import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(private prisma: PrismaService) {}

  async resolveDoctorIdByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!doctor) {
      throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
    }
    return doctor.id;
  }

  /** DOCTOR: luôn dùng doctorId từ JWT. ADMIN: cho phép query. */
  async resolveListDoctorId(user: AuthenticatedUser, doctorIdQuery?: string) {
    if (user.roles.includes('ADMIN') && doctorIdQuery) {
      return doctorIdQuery;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (doctor) {
      if (
        doctorIdQuery &&
        doctorIdQuery !== doctor.id &&
        !user.roles.includes('ADMIN')
      ) {
        throw new ForbiddenException(
          'Không được xem đơn thuốc của bác sĩ khác',
        );
      }
      return doctor.id;
    }

    if (user.roles.includes('ADMIN') && !doctorIdQuery) {
      throw new ForbiddenException('ADMIN cần truyền doctorId');
    }

    throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
  }

  private async ensureCanAccess(
    prescriptionDoctorId: string,
    user: AuthenticatedUser,
  ) {
    if (user.roles.includes('ADMIN')) return;
    const ownId = await this.resolveDoctorIdByUserId(user.userId);
    if (ownId !== prescriptionDoctorId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập đơn thuốc này',
      );
    }
  }

  private async findOneOrThrow(id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            patientCode: true,
            user: { select: { fullName: true } },
          },
        },
        medicalRecord: {
          select: {
            diagnosis: true,
            appointment: { select: { scheduledAt: true } },
          },
        },
      },
    });
    if (!rx) throw new NotFoundException('Không tìm thấy đơn thuốc');
    return rx;
  }

  private toDetail(p: Awaited<ReturnType<typeof this.findOneOrThrow>>) {
    return {
      id: p.id,
      patientId: p.patientId,
      patientName: p.patient?.user?.fullName ?? '—',
      patientCode: p.patient?.patientCode ?? '—',
      medicalRecordId: p.medicalRecordId,
      diagnosis: p.medicalRecord?.diagnosis ?? null,
      scheduledAt: p.medicalRecord?.appointment?.scheduledAt ?? null,
      notes: p.notes ?? null,
      itemCount: p.items?.length ?? 0,
      items: p.items ?? [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const p = await this.findOneOrThrow(id);
    await this.ensureCanAccess(p.doctorId, user);
    return this.toDetail(p);
  }

  async findByDoctor(doctorId: string) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: { doctorId },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            patientCode: true,
            user: { select: { fullName: true } },
          },
        },
        medicalRecord: {
          select: {
            diagnosis: true,
            appointment: { select: { scheduledAt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return prescriptions.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patientName: p.patient?.user?.fullName ?? '—',
      patientCode: p.patient?.patientCode ?? '—',
      diagnosis: p.medicalRecord?.diagnosis ?? null,
      scheduledAt: p.medicalRecord?.appointment?.scheduledAt ?? null,
      notes: p.notes ?? null,
      itemCount: p.items?.length ?? 0,
      items: p.items ?? [],
      createdAt: p.createdAt,
    }));
  }

  async create(
    doctorId: string,
    dto: CreatePrescriptionDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureCanAccess(doctorId, user);

    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: dto.medicalRecordId },
      select: { id: true, doctorId: true, patientId: true },
    });
    if (!record) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    }
    if (record.doctorId !== doctorId) {
      throw new ForbiddenException(
        'Hồ sơ bệnh án không thuộc bác sĩ đang kê đơn',
      );
    }
    if (record.patientId !== dto.patientId) {
      throw new BadRequestException(
        'Bệnh nhân không khớp với hồ sơ bệnh án',
      );
    }

    const items = dto.items.map((item) => ({
      medicineName: item.medicineName.trim(),
      dosage: item.dosage.trim(),
      frequency: item.frequency?.trim() || null,
      duration: item.duration?.trim() || null,
      instruction: item.instruction?.trim() || null,
    }));

    if (items.some((i) => !i.medicineName || !i.dosage)) {
      throw new BadRequestException(
        'Mỗi thuốc cần có tên thuốc và liều dùng',
      );
    }

    return this.prisma.prescription.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        medicalRecordId: dto.medicalRecordId,
        notes: dto.notes?.trim() || null,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async update(
    id: string,
    dto: UpdatePrescriptionDto,
    user: AuthenticatedUser,
  ) {
    const existing = await this.findOneOrThrow(id);
    await this.ensureCanAccess(existing.doctorId, user);

    return this.prisma.$transaction(async (tx) => {
      if (dto.items !== undefined) {
        const items = dto.items.map((item) => ({
          prescriptionId: id,
          medicineName: item.medicineName.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency?.trim() || null,
          duration: item.duration?.trim() || null,
          instruction: item.instruction?.trim() || null,
        }));

        if (items.some((i) => !i.medicineName || !i.dosage)) {
          throw new BadRequestException(
            'Mỗi thuốc cần có tên thuốc và liều dùng',
          );
        }

        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
        await tx.prescriptionItem.createMany({ data: items });
      }

      return tx.prescription.update({
        where: { id },
        data: {
          ...(dto.notes !== undefined && {
            notes: dto.notes?.trim() || null,
          }),
        },
        include: { items: true },
      });
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.findOneOrThrow(id);
    await this.ensureCanAccess(existing.doctorId, user);
    await this.prisma.prescription.delete({ where: { id } });
    return { success: true };
  }
}
