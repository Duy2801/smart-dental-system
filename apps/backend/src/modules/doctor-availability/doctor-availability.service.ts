import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilityApprovalStatus,
  AvailabilityRecordType,
} from '../../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import type { BusinessHourDto } from '../clinic-config/dto/update-clinic-config.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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
  approvalStatus?: AvailabilityApprovalStatus;
  isActive: boolean;
};


@Injectable()
export class DoctorAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicConfigService: ClinicConfigService,
  ) {}

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

  async checkConflicts(query: {
    doctorId: string;
    specificDate?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
  }) {
    const { doctorId, specificDate, dayOfWeek, startTime = '00:00', endTime = '23:59' } = query;
    if (!doctorId) return { hasConflict: false, conflicts: [] };

    if (specificDate) {
      const startDateTime = new Date(`${specificDate}T${startTime}:00.000Z`);
      const endDateTime = new Date(`${specificDate}T${endTime}:00.000Z`);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledAt: { lt: endDateTime },
          endAt: { gt: startDateTime },
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
        },
        include: {
          patient: { select: { fullName: true, phone: true } },
          service: { select: { name: true } },
        },
      });

      return {
        hasConflict: appointments.length > 0,
        conflicts: appointments.map((c) => ({
          id: c.id,
          appointmentCode: c.appointmentCode,
          scheduledAt: c.scheduledAt,
          endAt: c.endAt,
          patientName: c.patient?.fullName ?? 'Bệnh nhân',
          patientPhone: c.patient?.phone ?? '',
          serviceName: c.service?.name ?? '',
        })),
      };
    }

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: now, lte: future },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      include: {
        patient: { select: { fullName: true, phone: true } },
        service: { select: { name: true } },
      },
    });

    const conflicts = appointments.filter((app) => {
      const appDay = app.scheduledAt.getUTCDay();
      const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek;
      if (targetDay !== undefined && targetDay !== null && appDay !== targetDay) return false;

      const appStart = app.scheduledAt.toISOString().slice(11, 16);
      const appEnd = app.endAt.toISOString().slice(11, 16);
      return appStart < endTime && appEnd > startTime;
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        appointmentCode: c.appointmentCode,
        scheduledAt: c.scheduledAt,
        endAt: c.endAt,
        patientName: c.patient?.fullName ?? 'Bệnh nhân',
        patientPhone: c.patient?.phone ?? '',
        serviceName: c.service?.name ?? '',
      })),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateDoctorAvailabilityDto,
    force = false,
  ) {
    const isDoctor = user.roles.includes('DOCTOR');
    if (isDoctor) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (!doctor || doctor.id !== dto.doctorId) {
        throw new ForbiddenException('availability.doctor_mismatch');
      }
    } else {
      await this.ensureDoctorExists(dto.doctorId);
    }

    this.validateAvailabilityPayload(dto);
    this.ensureTimeOffStartsInFuture(dto);
    await this.ensureWithinClinicHours(dto);

    if (dto.recordType === AvailabilityRecordType.TIME_OFF && !force) {
      const conflictCheck = await this.checkConflicts({
        doctorId: dto.doctorId,
        specificDate: dto.specificDate,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      });

      if (conflictCheck.hasConflict) {
        throw new BadRequestException({
          code: 'APPOINTMENT_CONFLICT',
          message: 'Có lịch hẹn bị trùng với thời gian đăng ký nghỉ!',
          conflicts: conflictCheck.conflicts,
        });
      }
    }

    const existing = await this.findExistingForSameSlot(dto);
    this.ensureNoOverlap([...existing, dto]);

    return this.prisma.doctorAvailability.create({
      data: {
        doctorId: dto.doctorId,
        recordType: dto.recordType,
        dayOfWeek:
          dto.dayOfWeek ??
          (dto.specificDate
            ? new Date(dto.specificDate).getUTCDay() || 7
            : undefined),

        specificDate: dto.specificDate
          ? this.toDateOnly(dto.specificDate)
          : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason?.trim(),
        approvalStatus: isDoctor
          ? AvailabilityApprovalStatus.PENDING
          : (dto.approvalStatus ?? AvailabilityApprovalStatus.APPROVED),
        isActive: dto.isActive ?? true,
      },
    });
  }


  async autoCreateWeekly(dto: AutoWeeklyAvailabilityDto) {
    await this.ensureDoctorExists(dto.doctorId);

    const daysOfWeek = [...new Set(dto.daysOfWeek)].sort((a, b) => a - b);
    this.ensureNoOverlap(dto.shifts);
    await this.ensureWeeklyShiftsWithinClinicHours(daysOfWeek, dto.shifts);

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
    await this.ensureWithinClinicHours(next);

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

  async updateApprovalStatus(id: string, approvalStatus: AvailabilityApprovalStatus) {
    const current = await this.prisma.doctorAvailability.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('availability.not_found');
    }

    return this.prisma.doctorAvailability.update({
      where: { id },
      data: { approvalStatus },
    });
  }

  async getMatrixForAllDoctors() {
    const doctors = await this.prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        doctorCode: true,
        specialization: true,
        user: { select: { fullName: true, email: true } },
        availability: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    const businessHours =
      await this.clinicConfigService.getConfiguredBusinessHours();

    const days = [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
      const businessHour = businessHours.find((h) => h.id === dayOfWeek);
      const doctorShifts = doctors.map((doc) => {
        const shifts = doc.availability.filter(
          (a) =>
            a.recordType === AvailabilityRecordType.WEEKLY &&
            this.matchesDayOfWeek(a, dayOfWeek) &&
            a.approvalStatus === AvailabilityApprovalStatus.APPROVED,
        );
        const dateOverrides = doc.availability.filter(
          (a) =>
            a.recordType === AvailabilityRecordType.DATE_OVERRIDE &&
            this.matchesDayOfWeek(a, dayOfWeek) &&
            a.approvalStatus === AvailabilityApprovalStatus.APPROVED,
        );
        const timeOffs = doc.availability.filter(
          (a) =>
            a.recordType === AvailabilityRecordType.TIME_OFF &&
            this.matchesDayOfWeek(a, dayOfWeek) &&
            a.approvalStatus === AvailabilityApprovalStatus.APPROVED,
        );


        const isAvailable = (shifts.length > 0 || dateOverrides.length > 0) && timeOffs.length === 0;

        return {
          doctorId: doc.id,
          doctorName: doc.user.fullName,
          specialization: doc.specialization,
          shifts,
          dateOverrides,
          timeOffs,
          isAvailable,
        };
      });

      const activeDoctorCount = doctorShifts.filter((d) => d.isAvailable).length;

      return {
        dayOfWeek,
        label: this.getDayLabel(dayOfWeek),
        businessHour,
        isUnderstaffed: Boolean(businessHour?.isOpen) && activeDoctorCount < 2,
        activeDoctorCount,
        doctorShifts,
      };
    });

    return { doctors, days };
  }

  async remove(id: string, force = false) {
    const current = await this.prisma.doctorAvailability.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('availability.not_found');
    }

    if (!force) {
      const conflictCheck = await this.checkConflicts({
        doctorId: current.doctorId,
        specificDate: current.specificDate
          ? current.specificDate.toISOString().slice(0, 10)
          : undefined,
        dayOfWeek: current.dayOfWeek ?? undefined,
        startTime: current.startTime,
        endTime: current.endTime,
      });

      if (conflictCheck.hasConflict) {
        throw new BadRequestException({
          code: 'APPOINTMENT_CONFLICT',
          message: 'Có lịch hẹn bị ảnh hưởng khi xóa ca này!',
          conflicts: conflictCheck.conflicts,
        });
      }
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

    if (
      dto.recordType === AvailabilityRecordType.WEEKLY &&
      dto.dayOfWeek === undefined
    ) {
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
      dto.dayOfWeek === undefined &&
      !dto.specificDate
    ) {
      throw new BadRequestException(
        'availability.day_or_specific_date_required',
      );
    }
  }

  private ensureTimeOffStartsInFuture(
    dto: Omit<CreateDoctorAvailabilityDto, 'specificDate'> & {
      specificDate?: string;
    },
  ) {
    if (
      dto.recordType !== AvailabilityRecordType.TIME_OFF ||
      !dto.specificDate
    ) {
      return;
    }

    const date = dto.specificDate.slice(0, 10);
    const start = new Date(`${date}T${dto.startTime}:00+07:00`);
    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      throw new BadRequestException('availability.time_off_in_past');
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

  private async ensureWithinClinicHours(
    dto: Omit<CreateDoctorAvailabilityDto, 'specificDate'> & {
      specificDate?: string;
    },
  ) {
    if (dto.recordType === AvailabilityRecordType.TIME_OFF) return;

    const businessHours =
      await this.clinicConfigService.getConfiguredBusinessHours();
    const dayOfWeek =
      dto.recordType === AvailabilityRecordType.DATE_OVERRIDE &&
      dto.specificDate
        ? this.toDateOnly(dto.specificDate).getUTCDay()
        : dto.dayOfWeek;

    if (dayOfWeek === undefined) return;

    this.ensureShiftWithinClinicHours(dayOfWeek, dto, businessHours);
  }

  private async ensureWeeklyShiftsWithinClinicHours(
    daysOfWeek: number[],
    shifts: ShiftRange[],
  ) {
    const businessHours =
      await this.clinicConfigService.getConfiguredBusinessHours();

    for (const dayOfWeek of daysOfWeek) {
      for (const shift of shifts) {
        this.ensureShiftWithinClinicHours(dayOfWeek, shift, businessHours);
      }
    }
  }

  private ensureShiftWithinClinicHours(
    dayOfWeek: number,
    shift: ShiftRange,
    businessHours: BusinessHourDto[],
  ) {
    const businessHour = businessHours.find((hour) => hour.id === dayOfWeek);
    if (!businessHour?.isOpen) {
      throw new BadRequestException('clinic.closed_at_selected_time');
    }

    if (
      shift.startTime < businessHour.start ||
      shift.endTime > businessHour.end
    ) {
      throw new BadRequestException('clinic.closed_at_selected_time');
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

  private matchesDayOfWeek(
    record: { dayOfWeek: number | null; specificDate: Date | string | null },
    targetDayOfWeek: number,
  ): boolean {
    if (record.dayOfWeek !== null && record.dayOfWeek !== undefined) {
      return this.normalizeDayOfWeek(record.dayOfWeek) === targetDayOfWeek;
    }
    if (record.specificDate) {
      const date = new Date(record.specificDate);
      const day = date.getUTCDay();
      return (day === 0 ? 0 : day) === targetDayOfWeek;
    }
    return false;
  }

  private groupWeekly(records: AvailabilityRecord[]) {
    return [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
      const dayRecords = records.filter(
        (record) => this.matchesDayOfWeek(record, dayOfWeek),
      );
      const shifts = dayRecords.filter(
        (record) => record.recordType === AvailabilityRecordType.WEEKLY,
      );
      const dateOverrides = dayRecords.filter(
        (record) => record.recordType === AvailabilityRecordType.DATE_OVERRIDE,
      );
      const timeOff = dayRecords.filter(
        (record) => record.recordType === AvailabilityRecordType.TIME_OFF,
      );

      return {
        dayOfWeek,
        label: this.getDayLabel(dayOfWeek),
        shifts,
        dateOverrides,
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
      0: 'Chu nhat',
    };

    return labels[dayOfWeek];
  }

  private normalizeDayOfWeek(dayOfWeek: number | null) {
    return dayOfWeek === 7 ? 0 : dayOfWeek;
  }

  private toDateOnly(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
