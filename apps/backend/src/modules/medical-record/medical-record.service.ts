import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Prisma } from '../../../prisma/generated/client';
import { uploadImageBuffer } from 'src/common/cloudinary';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

type RecordImage = {
  url: string;
  caption?: string | null;
  type?: 'xray' | 'intraoral' | 'other';
};

const recordInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      fullName: true,
      phone: true,
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
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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

    const data: Prisma.MedicalRecordUpdateInput = {};
    if (dto.chiefComplaint !== undefined) {
      data.chiefComplaint = dto.chiefComplaint?.trim() || null;
    }
    if (dto.diagnosis !== undefined) {
      data.diagnosis = dto.diagnosis?.trim() || null;
    }
    if (dto.treatmentNotes !== undefined) {
      data.treatmentNotes = dto.treatmentNotes?.trim() || null;
    }
    if (dto.internalNotes !== undefined) {
      data.internalNotes = dto.internalNotes?.trim() || null;
    }
    if (dto.followUpDate !== undefined) {
      data.followUpDate = dto.followUpDate
        ? new Date(dto.followUpDate)
        : null;
    }
    if (dto.images !== undefined) {
      data.images = JSON.parse(
        JSON.stringify(dto.images === null ? [] : dto.images),
      ) as Prisma.InputJsonValue;
    }
    if (dto.dentalChart !== undefined) {
      data.dentalChart = JSON.parse(
        JSON.stringify(
          dto.dentalChart === null
            ? { teeth: [] }
            : { teeth: dto.dentalChart.teeth },
        ),
      ) as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.medicalRecord.update({
      where: { id },
      data,
      include: recordInclude,
    });
    return this.toDetail(updated);
  }

  async uploadImage(
    id: string,
    user: AuthenticatedUser,
    file:
      | { buffer: Buffer; mimetype: string; originalname: string }
      | undefined,
    meta: { caption?: string; type?: 'xray' | 'intraoral' | 'other' },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Chưa chọn file ảnh');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh');
    }

    const row = await this.prisma.medicalRecord.findUnique({
      where: { id },
      select: { id: true, doctorId: true, images: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    await this.ensureCanAccess(row.doctorId, user);

    const current = Array.isArray(row.images)
      ? (row.images as RecordImage[])
      : [];
    if (current.length >= 20) {
      throw new BadRequestException('Tối đa 20 ảnh mỗi hồ sơ');
    }

    const url = await uploadImageBuffer(this.config, file.buffer, {
      folder: 'smart-dental/medical-records',
      publicId: `${id.slice(0, 8)}-${randomUUID()}`,
    });

    const nextImages = [
      ...current,
      {
        url,
        caption: meta.caption?.trim() || file.originalname || null,
        type: meta.type ?? 'xray',
      },
    ];

    const updated = await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        images: nextImages as unknown as Prisma.InputJsonValue,
      },
      include: recordInclude,
    });
    return this.toDetail(updated);
  }

  private async ensureCanAccess(
    recordDoctorId: string,
    user: AuthenticatedUser,
  ) {
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
      patientName: r.patient?.fullName ?? r.patient?.user?.fullName ?? 'Bệnh nhân',
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
      patientPhone: r.patient?.phone ?? r.patient?.user?.phone ?? null,
      appointmentStatus: r.appointment?.status ?? null,
      images: Array.isArray(r.images) ? r.images : [],
      dentalChart:
        r.dentalChart && typeof r.dentalChart === 'object'
          ? r.dentalChart
          : { teeth: [] },
      prescriptions: (r.prescriptionRecords ?? []).map((p: any) => ({
        id: p.id,
        notes: p.notes,
        items: p.items ?? [],
        createdAt: p.createdAt,
      })),
    };
  }
}
