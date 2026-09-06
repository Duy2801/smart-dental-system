import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Prisma } from '../../../prisma/generated/client';
import { uploadImageBuffer } from '../../common/cloudinary';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

type RecordImage = {
  id?: string;
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
  doctor: {
    select: {
      id: true,
      user: { select: { fullName: true } },
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

const recordSummarySelect = {
  id: true,
  patientId: true,
  doctorId: true,
  diagnosis: true,
  chiefComplaint: true,
  treatmentNotes: true,
  followUpDate: true,
  images: true,
  createdAt: true,
  updatedAt: true,
  patient: recordInclude.patient,
  doctor: recordInclude.doctor,
  appointment: recordInclude.appointment,
  _count: { select: { prescriptionRecords: true } },
} as const;

@Injectable()
export class MedicalRecordService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private redis: RedisService,
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

  async findByDoctor(
    doctorId: string,
    patientId?: string,
    appointmentId?: string,
    user?: AuthenticatedUser,
    allDoctors?: boolean,
  ) {
    if (patientId && allDoctors && user && !user.roles.includes('ADMIN')) {
      const ownDoctorId = await this.resolveDoctorIdByUserId(user.userId);
      const [relAppt, relVideo, relPlan, relRecord] = await Promise.all([
        this.prisma.appointment.findFirst({
          where: { patientId, doctorId: ownDoctorId },
          select: { id: true },
        }),
        this.prisma.videoConsultation.findFirst({
          where: { patientId, doctorId: ownDoctorId },
          select: { id: true },
        }),
        this.prisma.treatmentPlan.findFirst({
          where: { patientId, doctorId: ownDoctorId },
          select: { id: true },
        }),
        this.prisma.medicalRecord.findFirst({
          where: { patientId, doctorId: ownDoctorId },
          select: { id: true },
        }),
      ]);
      if (!relAppt && !relVideo && !relPlan && !relRecord) {
        throw new ForbiddenException(
          'Bạn không có quyền xem hồ sơ bệnh án của bệnh nhân này',
        );
      }
    }

    const whereClause: Prisma.MedicalRecordWhereInput =
      allDoctors && patientId
        ? { patientId }
        : {
            doctorId,
            ...(patientId ? { patientId } : {}),
            ...(appointmentId ? { appointmentId } : {}),
          };

    const records = await this.prisma.medicalRecord.findMany({
      where: whereClause,
      select: recordSummarySelect,
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
    await this.ensureCanAccessRead(r, user);
    return this.toDetail(r);
  }

  async update(
    id: string,
    dto: UpdateMedicalRecordDto,
    user: AuthenticatedUser,
  ) {
    const exists = await this.prisma.medicalRecord.findUnique({
      where: { id },
      select: {
        id: true,
        doctorId: true,
        images: true,
        dentalChart: true,
        chiefComplaint: true,
        diagnosis: true,
        treatmentNotes: true,
        internalNotes: true,
        followUpDate: true,
        updatedAt: true,
      },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    await this.ensureCanAccess(exists.doctorId, user);
    if (
      dto.expectedUpdatedAt &&
      exists.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()
    ) {
      throw new ConflictException(
        'Hồ sơ vừa được cập nhật ở nơi khác. Vui lòng tải lại trước khi lưu.',
      );
    }

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
      if (dto.followUpDate) {
        const followUpDate = new Date(dto.followUpDate);
        const originalDate = exists.followUpDate
          ? new Date(exists.followUpDate)
          : null;
        const isUnchanged =
          originalDate &&
          originalDate.toISOString().slice(0, 10) ===
            followUpDate.toISOString().slice(0, 10);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isUnchanged && followUpDate.getTime() < today.getTime()) {
          throw new BadRequestException(
            'Ngày tái khám không được trước ngày hiện tại',
          );
        }
        data.followUpDate = followUpDate;
      } else {
        data.followUpDate = null;
      }
    }
    if (dto.images !== undefined) {
      const storedImages = Array.isArray(exists.images)
        ? (exists.images as RecordImage[])
        : [];
      const requestedImages = dto.images === null ? [] : dto.images;
      const containsUntrustedImage = requestedImages.some((requested) => {
        const stored = requested.id
          ? storedImages.find((image) => image.id === requested.id)
          : storedImages.find(
              (image) => !image.id && image.url === requested.url,
            );
        return !stored || stored.url !== requested.url;
      });
      if (containsUntrustedImage) {
        throw new BadRequestException(
          'Ảnh bệnh án mới phải được thêm qua chức năng tải ảnh lên',
        );
      }
      data.images = JSON.parse(
        JSON.stringify(requestedImages),
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const write = await tx.medicalRecord.updateMany({
        where: { id, updatedAt: exists.updatedAt },
        data,
      });
      if (write.count !== 1) {
        throw new ConflictException(
          'Hồ sơ vừa được cập nhật ở nơi khác. Vui lòng tải lại trước khi lưu.',
        );
      }
      await tx.medicalRecordAudit.create({
        data: {
          medicalRecordId: id,
          changedBy: user.userId,
          previousData: JSON.parse(
            JSON.stringify({
              chiefComplaint: exists.chiefComplaint,
              diagnosis: exists.diagnosis,
              treatmentNotes: exists.treatmentNotes,
              internalNotes: exists.internalNotes,
              followUpDate: exists.followUpDate,
              images: exists.images,
              dentalChart: exists.dentalChart,
              updatedAt: exists.updatedAt,
            }),
          ) as Prisma.InputJsonValue,
        },
      });
      const record = await tx.medicalRecord.findUnique({
        where: { id },
        include: recordInclude,
      });
      if (!record) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
      return record;
    });
    void this.redis.del(`patient:records:${updated.patientId}`);
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
        id: randomUUID(),
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
    void this.redis.del(`patient:records:${updated.patientId}`);
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
        'Bạn không có quyền sửa hồ sơ bệnh án của bác sĩ khác',
      );
    }
  }

  private async ensureCanAccessRead(
    record: { doctorId: string; patientId: string },
    user: AuthenticatedUser,
  ) {
    if (user.roles.includes('ADMIN')) return;
    const ownDoctorId = await this.resolveDoctorIdByUserId(user.userId);
    if (ownDoctorId === record.doctorId) return;

    // Bác sĩ có thể đọc hồ sơ nếu có bất kỳ quan hệ khám/điều trị nào với bệnh nhân này
    const [relAppt, relVideo, relPlan, relRecord] = await Promise.all([
      this.prisma.appointment.findFirst({
        where: { patientId: record.patientId, doctorId: ownDoctorId },
        select: { id: true },
      }),
      this.prisma.videoConsultation.findFirst({
        where: { patientId: record.patientId, doctorId: ownDoctorId },
        select: { id: true },
      }),
      this.prisma.treatmentPlan.findFirst({
        where: { patientId: record.patientId, doctorId: ownDoctorId },
        select: { id: true },
      }),
      this.prisma.medicalRecord.findFirst({
        where: { patientId: record.patientId, doctorId: ownDoctorId },
        select: { id: true },
      }),
    ]);
    if (!relAppt && !relVideo && !relPlan && !relRecord) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập hồ sơ bệnh án này',
      );
    }
  }

  private toSummary(r: any) {
    return {
      id: r.id,
      patientId: r.patientId,
      doctorId: r.doctorId ?? r.doctor?.id ?? null,
      doctorName: r.doctor?.user?.fullName ?? null,
      appointmentId: r.appointment?.id ?? r.appointmentId ?? null,
      patientName:
        r.patient?.fullName ?? r.patient?.user?.fullName ?? 'Bệnh nhân',
      patientCode: r.patient?.patientCode ?? '—',
      diagnosis: r.diagnosis ?? null,
      chiefComplaint: r.chiefComplaint ?? null,
      treatmentNotes: r.treatmentNotes ?? null,
      serviceName: r.appointment?.service?.name ?? null,
      scheduledAt: r.appointment?.scheduledAt ?? null,
      followUpDate: r.followUpDate ?? null,
      images: Array.isArray(r.images) ? r.images : [],
      prescriptionCount:
        r._count?.prescriptionRecords ?? r.prescriptionRecords?.length ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
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
