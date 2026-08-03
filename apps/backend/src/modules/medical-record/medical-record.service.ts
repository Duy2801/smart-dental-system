import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

const recordInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      user: { select: { fullName: true, phone: true } },
    },
  },
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      service: { select: { name: true } },
    },
  },
  prescriptionRecords: {
    include: { items: true },
  },
} as const;

@Injectable()
export class MedicalRecordService {
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
          'Không được xem hồ sơ bệnh án của bác sĩ khác',
        );
      }
      return doctor.id;
    }

    if (user.roles.includes('ADMIN') && !doctorIdQuery) {
      throw new ForbiddenException('ADMIN cần truyền doctorId');
    }

    throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
  }

  async findByDoctor(doctorId: string, patientId?: string) {
    const records = await this.prisma.medicalRecord.findMany({
      where: {
        doctorId,
        ...(patientId ? { patientId } : {}),
      },
      include: recordInclude,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toSummary(r));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const r = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: recordInclude,
    });
    if (!r) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    await this.ensureCanAccess(r.doctorId, user);
    return this.toDetail(r);
  }

  async update(id: string, dto: UpdateMedicalRecordDto, user: AuthenticatedUser) {
    const exists = await this.prisma.medicalRecord.findUnique({
      where: { id },
      select: { id: true, doctorId: true },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    await this.ensureCanAccess(exists.doctorId, user);

    const updated = await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        ...(dto.diagnosis !== undefined && {
          diagnosis: dto.diagnosis?.trim() || null,
        }),
        ...(dto.treatmentNotes !== undefined && {
          treatmentNotes: dto.treatmentNotes?.trim() || null,
        }),
        ...(dto.internalNotes !== undefined && {
          internalNotes: dto.internalNotes?.trim() || null,
        }),
        ...(dto.followUpDate !== undefined && {
          followUpDate: dto.followUpDate
            ? new Date(dto.followUpDate)
            : null,
        }),
      },
      include: recordInclude,
    });
    return this.toDetail(updated);
  }

  private async ensureCanAccess(recordDoctorId: string, user: AuthenticatedUser) {
    if (user.roles.includes('ADMIN')) return;
    const ownId = await this.resolveDoctorIdByUserId(user.userId);
    if (ownId !== recordDoctorId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập hồ sơ bệnh án này',
      );
    }
  }

  private toSummary(r: any) {
    return {
      id: r.id,
      patientId: r.patientId,
      patientName: r.patient?.user?.fullName ?? '—',
      patientCode: r.patient?.patientCode ?? '—',
      diagnosis: r.diagnosis ?? null,
      chiefComplaint: r.chiefComplaint ?? null,
      serviceName: r.appointment?.service?.name ?? null,
      scheduledAt: r.appointment?.scheduledAt ?? null,
      followUpDate: r.followUpDate ?? null,
      prescriptionCount: r.prescriptionRecords?.length ?? 0,
      createdAt: r.createdAt,
    };
  }

  private toDetail(r: any) {
    return {
      ...this.toSummary(r),
      treatmentNotes: r.treatmentNotes ?? null,
      internalNotes: r.internalNotes ?? null,
      patientPhone: r.patient?.user?.phone ?? null,
      appointmentStatus: r.appointment?.status ?? null,
      prescriptions: (r.prescriptionRecords ?? []).map((p: any) => ({
        id: p.id,
        notes: p.notes,
        items: p.items ?? [],
        createdAt: p.createdAt,
      })),
    };
  }
}
