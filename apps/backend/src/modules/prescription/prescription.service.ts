import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
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
      throw new ForbiddenException('Bạn không có quyền truy cập đơn thuốc này');
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
            fullName: true,
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
    if (rx.cancelledAt) throw new NotFoundException('Đơn thuốc đã bị hủy');
    return rx;
  }

  private toDetail(p: Awaited<ReturnType<typeof this.findOneOrThrow>>) {
    return {
      id: p.id,
      patientId: p.patientId,
      patientName:
        (p.patient as any)?.fullName ??
        p.patient?.user?.fullName ??
        'Bệnh nhân',
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
      where: { doctorId, cancelledAt: null },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true,
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
      patientName:
        (p.patient as any)?.fullName ??
        p.patient?.user?.fullName ??
        'Bệnh nhân',
      patientCode: p.patient?.patientCode ?? '—',
      diagnosis: p.medicalRecord?.diagnosis ?? null,
      scheduledAt: p.medicalRecord?.appointment?.scheduledAt ?? null,
      notes: p.notes ?? null,
      itemCount: p.items?.length ?? 0,
      items: p.items ?? [],
      createdAt: p.createdAt,
    }));
  }

  async findPageByDoctor(
    doctorId: string,
    page: number,
    pageSize: number,
    search?: string,
    month?: string,
  ) {
    const monthStart = month
      ? new Date(
          Date.UTC(
            Number(month.slice(0, 4)),
            Number(month.slice(5, 7)) - 1,
            1,
          ) -
            7 * 60 * 60 * 1000,
        )
      : null;
    const nextMonthStart = month
      ? new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1) -
            7 * 60 * 60 * 1000,
        )
      : null;
    const where: Prisma.PrescriptionWhereInput = {
      doctorId,
      cancelledAt: null,
      ...(search?.trim()
        ? {
            OR: [
              {
                patient: {
                  fullName: { contains: search.trim(), mode: 'insensitive' },
                },
              },
              {
                patient: {
                  patientCode: { contains: search.trim(), mode: 'insensitive' },
                },
              },
              {
                medicalRecord: {
                  diagnosis: { contains: search.trim(), mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(month
        ? {
            createdAt: {
              gte: monthStart!,
              lt: nextMonthStart!,
            },
          }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        include: {
          items: true,
          patient: {
            select: {
              id: true,
              patientCode: true,
              fullName: true,
              user: { select: { fullName: true } },
            },
          },
          medicalRecord: { select: { diagnosis: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((p) => ({
        ...this.toDetail(p as Awaited<ReturnType<typeof this.findOneOrThrow>>),
        scheduledAt: null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(
    doctorId: string,
    dto: CreatePrescriptionDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureCanAccess(doctorId, user);
    if (!dto.safetyAcknowledged) {
      throw new BadRequestException('Cần xác nhận kiểm tra an toàn đơn thuốc');
    }

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
      throw new BadRequestException('Bệnh nhân không khớp với hồ sơ bệnh án');
    }

    const items = dto.items.map((item) => ({
      medicineName: item.medicineName.trim(),
      dosage: item.dosage.trim(),
      frequency: item.frequency?.trim() || null,
      duration: item.duration?.trim() || null,
      instruction: item.instruction?.trim() || null,
    }));

    if (items.some((i) => !i.medicineName || !i.dosage)) {
      throw new BadRequestException('Mỗi thuốc cần có tên thuốc và liều dùng');
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.prescription.create({
        data: {
          doctorId,
          patientId: dto.patientId,
          medicalRecordId: dto.medicalRecordId,
          notes: dto.notes?.trim() || null,
          safetyOverride: dto.safetyOverride === true,
          items: { create: items },
        },
        include: { items: true },
      });
      await tx.prescriptionAudit.create({
        data: {
          prescriptionId: created.id,
          action: 'CREATED',
          changedBy: user.userId,
        },
      });
      return created;
    });
  }

  async update(
    id: string,
    dto: UpdatePrescriptionDto,
    user: AuthenticatedUser,
  ) {
    const existing = await this.findOneOrThrow(id);
    await this.ensureCanAccess(existing.doctorId, user);
    if (!dto.safetyAcknowledged) {
      throw new BadRequestException('Cần xác nhận kiểm tra an toàn đơn thuốc');
    }
    if (
      existing.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()
    ) {
      throw new ConflictException('Đơn thuốc vừa được cập nhật ở nơi khác');
    }

    return this.prisma.$transaction(async (tx) => {
      const write = await tx.prescription.updateMany({
        where: { id, updatedAt: existing.updatedAt, cancelledAt: null },
        data: {
          ...(dto.notes !== undefined && { notes: dto.notes.trim() || null }),
          safetyConfirmedAt: new Date(),
          safetyOverride: dto.safetyOverride === true,
        },
      });
      if (write.count !== 1) {
        throw new ConflictException('Đơn thuốc vừa được cập nhật ở nơi khác');
      }
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

      await tx.prescriptionAudit.create({
        data: {
          prescriptionId: id,
          action: 'UPDATED',
          changedBy: user.userId,
          previousData: {
            notes: existing.notes,
            items: existing.items,
          } as Prisma.InputJsonValue,
        },
      });
      return tx.prescription.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.findOneOrThrow(id);
    await this.ensureCanAccess(existing.doctorId, user);
    await this.prisma.$transaction(async (tx) => {
      await tx.prescription.update({
        where: { id },
        data: { cancelledAt: new Date(), cancelledBy: user.userId },
      });
      await tx.prescriptionAudit.create({
        data: {
          prescriptionId: id,
          action: 'CANCELLED',
          changedBy: user.userId,
          previousData: {
            notes: existing.notes,
            items: existing.items,
          } as Prisma.InputJsonValue,
        },
      });
    });
    return { success: true, cancelled: true };
  }

  /** Gửi Toa thuốc điện tử & Hướng dẫn sử dụng qua Gmail cho bệnh nhân */
  async sendPrescriptionToPatient(id: string, user: AuthenticatedUser) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        patient: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
        doctor: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        medicalRecord: {
          select: {
            diagnosis: true,
            appointment: {
              select: {
                scheduledAt: true,
                service: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!rx) {
      throw new NotFoundException('Không tìm thấy đơn thuốc');
    }

    await this.ensureCanAccess(rx.doctorId, user);

    if (rx.cancelledAt) {
      throw new BadRequestException('Không thể gửi đơn thuốc đã hủy');
    }
    if (rx.emailQueuedAt) {
      throw new ConflictException('Đơn thuốc này đã được xếp hàng gửi email');
    }

    const email = rx.patient?.user?.email || rx.patient?.email;
    const patientName =
      (rx.patient as any)?.fullName ||
      rx.patient?.user?.fullName ||
      'Quý khách';
    const patientCode = rx.patient?.patientCode || 'PAT-0000';
    const doctorName = rx.doctor?.user?.fullName
      ? rx.doctor.user.fullName.startsWith('BS')
        ? rx.doctor.user.fullName
        : `BS. ${rx.doctor.user.fullName}`
      : 'Bác sĩ điều trị';
    const diagnosis = rx.medicalRecord?.diagnosis || 'Khám & Điều trị nha khoa';
    const notes = rx.notes;

    if (!email || email.endsWith('@clinic.local')) {
      throw new BadRequestException(
        'Bệnh nhân chưa có địa chỉ email hợp lệ để nhận toa thuốc',
      );
    }

    const claimed = await this.prisma.prescription.updateMany({
      where: { id, emailQueuedAt: null, cancelledAt: null },
      data: { emailQueuedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new ConflictException('Đơn thuốc này đã được xếp hàng gửi email');
    }

    try {
      await this.mailQueue.add('send-prescription', {
        name: patientName,
        email,
        patientCode,
        doctorName,
        diagnosis,
        notes,
        items: rx.items.map((item) => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instruction: item.instruction,
        })),
        createdAt: (rx.createdAt
          ? new Date(rx.createdAt)
          : new Date()
        ).toISOString(),
      });
    } catch (error) {
      await this.prisma.prescription.update({
        where: { id },
        data: { emailQueuedAt: null },
      });
      throw error;
    }

    if (rx.patient?.user?.id) {
      await this.prisma.notification
        .create({
          data: {
            userId: rx.patient.user.id,
            type: 'SYSTEM',
            title: '💊 Toa thuốc điện tử từ Bác sĩ điều trị',
            content: `${doctorName} đã gửi Toa thuốc điện tử cho bạn. Vui lòng kiểm tra email và làm theo hướng dẫn sử dụng thuốc an toàn.`,
            channel: 'IN_APP',
            status: 'SENT',
            sentAt: new Date(),
          },
        })
        .catch(() => undefined);
    }

    return {
      success: true,
      message: `Đã gửi toa thuốc điện tử thành công đến ${email}`,
    };
  }
}
