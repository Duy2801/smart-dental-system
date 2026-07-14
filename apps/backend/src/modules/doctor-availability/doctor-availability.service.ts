import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityRecordType } from '../../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AutoScheduleMode,
  AutoWeeklyAvailabilityDto,
  AutoWeeklyShiftDto,
} from './dto/auto-weekly-availability.dto';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-availability.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-availability.dto';

type ShiftRange = {
  startTime: string;
  endTime: string;
};

type AvailabilityRecord = {
  id: string;
  doctorId: string;
  recordType: AvailabilityRecordType;
  dayOfWeek: number | null;
  specificDate: Date | null;
  startTime: string;
  endTime: string;
  reason: string | null;
  isActive: boolean;
};

@Injectable()
export class DoctorAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDoctor(doctorId: string) {
    await this.ensureDoctorExists(doctorId);

    const records = await this.prisma.doctorAvailability.findMany({
      where: { doctorId, isActive: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { specificDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return {
      doctorId,
      records,
      weekly: this.groupWeekly(records),
    };
  }

  async create(dto: CreateDoctorAvailabilityDto) {
    await this.ensureDoctorExists(dto.doctorId);
    this.validateAvailabilityPayload(dto);

    const existing = await this.findExistingForSameSlot(dto);
    this.ensureNoOverlap([...existing, dto]);

    return this.prisma.doctorAvailability.create({
      data: {
        doctorId: dto.doctorId,
        recordType: dto.recordType,
        dayOfWeek: dto.dayOfWeek,
        specificDate: dto.specificDate
          ? this.toDateOnly(dto.specificDate)
          : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason?.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async autoCreateWeekly(dto: AutoWeeklyAvailabilityDto) {
    await this.ensureDoctorExists(dto.doctorId);

    const daysOfWeek = [...new Set(dto.daysOfWeek)].sort((a, b) => a - b);
    this.ensureNoOverlap(dto.shifts);

    if (dto.mode === AutoScheduleMode.APPEND) {
      await this.ensureNoOverlapWithExistingWeekly(
        dto.doctorId,
        daysOfWeek,
        dto.shifts,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.mode === AutoScheduleMode.REPLACE) {
        await tx.doctorAvailability.deleteMany({
          where: {
            doctorId: dto.doctorId,
            recordType: AvailabilityRecordType.WEEKLY,
            dayOfWeek: { in: daysOfWeek },
          },
        });
      }

      await tx.doctorAvailability.createMany({
        data: daysOfWeek.flatMap((dayOfWeek) =>
          dto.shifts.map((shift) => ({
            doctorId: dto.doctorId,
            recordType: AvailabilityRecordType.WEEKLY,
            dayOfWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isActive: true,
          })),
        ),
      });

      const records = await tx.doctorAvailability.findMany({
        where: {
          doctorId: dto.doctorId,
          recordType: AvailabilityRecordType.WEEKLY,
          isActive: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });

      return {
        doctorId: dto.doctorId,
        records,
        weekly: this.groupWeekly(records),
      };
    });
  }

  async update(id: string, dto: UpdateDoctorAvailabilityDto) {
    const current = await this.prisma.doctorAvailability.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('availability.not_found');
    }

    const next = {
      doctorId: dto.doctorId ?? current.doctorId,
      recordType: dto.recordType ?? current.recordType,
      dayOfWeek: dto.dayOfWeek ?? current.dayOfWeek ?? undefined,
      specificDate:
        dto.specificDate ??
        (current.specificDate
          ? current.specificDate.toISOString().slice(0, 10)
          : undefined),
      startTime: dto.startTime ?? current.startTime,
      endTime: dto.endTime ?? current.endTime,
      reason: dto.reason ?? current.reason ?? undefined,
      isActive: dto.isActive ?? current.isActive,
    };

    await this.ensureDoctorExists(next.doctorId);
    this.validateAvailabilityPayload(next);

    const existing = await this.findExistingForSameSlot(next, id);
    this.ensureNoOverlap([...existing, next]);

    return this.prisma.doctorAvailability.update({
      where: { id },
      data: {
        doctorId: dto.doctorId,
        recordType: dto.recordType,
        dayOfWeek:
          next.recordType === AvailabilityRecordType.DATE_OVERRIDE
            ? null
            : next.dayOfWeek,
        specificDate:
          next.recordType === AvailabilityRecordType.WEEKLY
            ? null
            : next.specificDate
              ? this.toDateOnly(next.specificDate)
              : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason?.trim(),
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.doctorAvailability.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('availability.not_found');
    }

    await this.prisma.doctorAvailability.delete({ where: { id } });

    return { message: 'availability.deleted' };
  }

  private async ensureDoctorExists(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });

    if (!doctor) {
      throw new NotFoundException('doctor.not_found');
    }
  }

  private validateAvailabilityPayload(
    dto: Omit<CreateDoctorAvailabilityDto, 'specificDate'> & {
      specificDate?: string;
    },
  ) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('availability.invalid_time_range');
    }

    if (dto.recordType === AvailabilityRecordType.WEEKLY && !dto.dayOfWeek) {
      throw new BadRequestException('availability.day_of_week_required');
    }

    if (
      dto.recordType === AvailabilityRecordType.DATE_OVERRIDE &&
      !dto.specificDate
    ) {
      throw new BadRequestException('availability.specific_date_required');
    }

    if (
      dto.recordType === AvailabilityRecordType.TIME_OFF &&
      !dto.dayOfWeek &&
      !dto.specificDate
    ) {
      throw new BadRequestException(
        'availability.day_or_specific_date_required',
      );
    }
  }

  private async findExistingForSameSlot(
    dto: Omit<CreateDoctorAvailabilityDto, 'specificDate'> & {
      specificDate?: string;
    },
    excludeId?: string,
  ): Promise<AvailabilityRecord[]> {
    const specificDate = dto.specificDate
      ? this.toDateOnly(dto.specificDate)
      : undefined;

    return this.prisma.doctorAvailability.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        doctorId: dto.doctorId,
        isActive: true,
        recordType: dto.recordType,
        dayOfWeek: dto.dayOfWeek ?? null,
        specificDate:
          dto.recordType === AvailabilityRecordType.WEEKLY
            ? null
            : specificDate,
      },
    });
  }

  private async ensureNoOverlapWithExistingWeekly(
    doctorId: string,
    daysOfWeek: number[],
    shifts: AutoWeeklyShiftDto[],
  ) {
    const existing = await this.prisma.doctorAvailability.findMany({
      where: {
        doctorId,
        recordType: AvailabilityRecordType.WEEKLY,
        dayOfWeek: { in: daysOfWeek },
        isActive: true,
      },
    });

    for (const dayOfWeek of daysOfWeek) {
      const dayExisting = existing.filter(
        (record) => record.dayOfWeek === dayOfWeek,
      );

      this.ensureNoOverlap([...dayExisting, ...shifts]);
    }
  }

  private ensureNoOverlap(shifts: ShiftRange[]) {
    const sorted = [...shifts].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    for (const shift of sorted) {
      if (shift.startTime >= shift.endTime) {
        throw new BadRequestException('availability.invalid_time_range');
      }
    }

    for (let index = 1; index < sorted.length; index++) {
      if (sorted[index].startTime < sorted[index - 1].endTime) {
        throw new BadRequestException('availability.shift_overlap');
      }
    }
  }

  private groupWeekly(records: AvailabilityRecord[]) {
    return [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
      const dayRecords = records.filter(
        (record) => record.dayOfWeek === dayOfWeek,
      );
      const shifts = dayRecords.filter(
        (record) => record.recordType === AvailabilityRecordType.WEEKLY,
      );
      const timeOff = dayRecords.filter(
        (record) => record.recordType === AvailabilityRecordType.TIME_OFF,
      );

      return {
        dayOfWeek,
        label: this.getDayLabel(dayOfWeek),
        shifts,
        timeOff,
      };
    });
  }

  private getDayLabel(dayOfWeek: number) {
    const labels: Record<number, string> = {
      1: 'Thu 2',
      2: 'Thu 3',
      3: 'Thu 4',
      4: 'Thu 5',
      5: 'Thu 6',
      6: 'Thu 7',
      7: 'Chu nhat',
    };

    return labels[dayOfWeek];
  }

  private toDateOnly(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
