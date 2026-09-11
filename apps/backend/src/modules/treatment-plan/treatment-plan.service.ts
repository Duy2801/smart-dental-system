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
import {
  InvoiceStatus,
  InvoiceType,
  TreatmentStepPaymentStatus,
} from '../../../prisma/generated/enums';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../socket/events.gateway';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { UpdateTreatmentPlanStepDto } from './dto/update-treatment-plan-step.dto';

const stepSelect = {
  id: true,
  stepOrder: true,
  title: true,
  description: true,
  targetTooth: true,
  status: true,
  estimatedCost: true,
  paymentAmount: true,
  paymentStatus: true,
  expectedDate: true,
  completedAt: true,
} as const;

const planInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      fullName: true,
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  },
  doctor: {
    select: {
      id: true,
      specialization: true,
      user: { select: { fullName: true } },
    },
  },
  steps: {
    orderBy: { stepOrder: 'asc' as const },
    select: stepSelect,
  },
} as const;

@Injectable()
export class TreatmentPlanService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventsGateway: EventsGateway,
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) {}

  private invalidatePatientRecordsCache(patientId: string) {
    void this.redis.del(`patient:records:${patientId}`);
  }

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
          'Không được xem kế hoạch điều trị của bác sĩ khác',
        );
      }
      return doctor.id;
    }

    if (user.roles.includes('ADMIN') && !doctorIdQuery) {
      throw new ForbiddenException('ADMIN cần truyền doctorId');
    }

    throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
  }

  private async ensureCanAccess(planDoctorId: string, user: AuthenticatedUser) {
    if (user.roles.includes('ADMIN')) return;
    const ownId = await this.resolveDoctorIdByUserId(user.userId);
    if (ownId !== planDoctorId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập kế hoạch điều trị này',
      );
    }
  }

  private async findPlanOrThrow(id: string) {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('Không tìm thấy kế hoạch điều trị');
    return plan;
  }

  async findByDoctor(doctorId: string) {
    const plans = await this.prisma.treatmentPlan.findMany({
      where: { doctorId },
      include: planInclude,
      orderBy: { createdAt: 'desc' },
    });
    return plans.map((p) => this.toSummary(p));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const p = await this.findPlanOrThrow(id);
    await this.ensureCanAccess(p.doctorId, user);
    return this.toDetail(p);
  }

  async create(
    doctorId: string,
    dto: CreateTreatmentPlanDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureCanAccess(doctorId, user);

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân');
    if (!user.roles.includes('ADMIN')) {
      const related = await this.prisma.medicalRecord.findFirst({
        where: { patientId: dto.patientId, doctorId },
        select: { id: true },
      });
      if (!related) {
        throw new ForbiddenException(
          'Bác sĩ chưa có quan hệ điều trị với bệnh nhân',
        );
      }
    }

    if (
      dto.startDate &&
      dto.expectedEndDate &&
      new Date(dto.startDate) > new Date(dto.expectedEndDate)
    ) {
      throw new BadRequestException(
        'Ngày kết thúc dự kiến phải sau ngày bắt đầu',
      );
    }

    const created = await this.prisma.treatmentPlan.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        expectedEndDate: dto.expectedEndDate
          ? new Date(dto.expectedEndDate)
          : null,
        steps: {
          create: dto.steps.map((s, i) => ({
            doctorId,
            stepOrder: i + 1,
            title: s.title.trim(),
            description: s.description?.trim() || null,
            targetTooth: s.targetTooth?.trim() || null,
            estimatedCost: s.estimatedCost ?? null,
            expectedDate: s.expectedDate ? new Date(s.expectedDate) : null,
          })),
        },
      },
      include: planInclude,
    });

    this.invalidatePatientRecordsCache(dto.patientId);

    return this.toDetail(created);
  }

  async update(
    id: string,
    dto: UpdateTreatmentPlanDto,
    user: AuthenticatedUser,
  ) {
    const plan = await this.findPlanOrThrow(id);
    await this.ensureCanAccess(plan.doctorId, user);
    if (
      dto.expectedUpdatedAt &&
      plan.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()
    ) {
      throw new ConflictException('Kế hoạch vừa được cập nhật ở nơi khác');
    }
    if (plan.status === 'CANCELLED') {
      throw new BadRequestException('Không thể sửa kế hoạch đã hủy');
    }
    if (dto.status) {
      const allowed: Record<string, string[]> = {
        PLANNED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: ['IN_PROGRESS'],
      };
      if (!allowed[plan.status]?.includes(dto.status)) {
        throw new BadRequestException(
          'Chuyển trạng thái kế hoạch không hợp lệ',
        );
      }
      if (
        dto.status === 'COMPLETED' &&
        plan.steps.some((s) => s.status !== 'COMPLETED')
      ) {
        throw new BadRequestException(
          'Chỉ hoàn thành kế hoạch khi tất cả bước đã hoàn thành',
        );
      }
    }

    const effectiveStart =
      dto.startDate !== undefined
        ? dto.startDate
          ? new Date(dto.startDate)
          : null
        : plan.startDate;
    const effectiveEnd =
      dto.expectedEndDate !== undefined
        ? dto.expectedEndDate
          ? new Date(dto.expectedEndDate)
          : null
        : plan.expectedEndDate;

    if (effectiveStart && effectiveEnd && effectiveStart > effectiveEnd) {
      throw new BadRequestException(
        'Ngày kết thúc dự kiến phải sau ngày bắt đầu',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.steps !== undefined) {
        const existingIds = new Set(plan.steps.map((s) => s.id));
        const incomingIds = new Set(
          dto.steps.filter((s) => s.id).map((s) => s.id as string),
        );

        for (const sid of incomingIds) {
          if (!existingIds.has(sid)) {
            throw new BadRequestException(
              `Bước ${sid} không thuộc kế hoạch này`,
            );
          }
        }

        const toDelete = [...existingIds].filter(
          (sid) => !incomingIds.has(sid),
        );
        if (toDelete.length > 0) {
          if (
            plan.steps.some(
              (s) =>
                toDelete.includes(s.id) &&
                (s.status !== 'PLANNED' || s.paymentStatus !== 'UNBILLED'),
            )
          ) {
            throw new BadRequestException(
              'Không thể xóa bước đã thực hiện hoặc phát sinh thanh toán',
            );
          }
          await tx.treatmentPlanStep.deleteMany({
            where: { id: { in: toDelete }, treatmentPlanId: id },
          });
        }

        // Tạm thời dịch chuyển stepOrder của các bước hiện có để tránh vi phạm
        // ràng buộc duy nhất @@unique([treatmentPlanId, stepOrder]) khi reorder
        if (existingIds.size > 0) {
          await tx.treatmentPlanStep.updateMany({
            where: { treatmentPlanId: id },
            data: { stepOrder: { increment: 10000 } },
          });
        }

        for (let i = 0; i < dto.steps.length; i++) {
          const s = dto.steps[i];
          const data = {
            stepOrder: i + 1,
            title: s.title.trim(),
            description: s.description?.trim() || null,
            targetTooth: s.targetTooth?.trim() || null,
            estimatedCost: s.estimatedCost ?? null,
            expectedDate: s.expectedDate ? new Date(s.expectedDate) : null,
          };

          if (s.id && existingIds.has(s.id)) {
            await tx.treatmentPlanStep.update({
              where: { id: s.id },
              data,
            });
          } else {
            await tx.treatmentPlanStep.create({
              data: {
                treatmentPlanId: id,
                doctorId: plan.doctorId,
                ...data,
              },
            });
          }
        }
      }

      const updated = await tx.treatmentPlan.update({
        where: { id, updatedAt: plan.updatedAt },
        data: {
          emailQueuedAt: null,
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description?.trim() || null,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.startDate !== undefined && {
            startDate: dto.startDate ? new Date(dto.startDate) : null,
          }),
          ...(dto.expectedEndDate !== undefined && {
            expectedEndDate: dto.expectedEndDate
              ? new Date(dto.expectedEndDate)
              : null,
          }),
        },
        include: planInclude,
      });

      await tx.treatmentPlanAudit.create({
        data: {
          treatmentPlanId: id,
          action: 'UPDATED',
          changedBy: user.userId,
          previousData: {
            status: plan.status,
            steps: plan.steps,
          } as Prisma.InputJsonValue,
        },
      });

      return this.toDetail(updated);
    });

    this.invalidatePatientRecordsCache(plan.patientId);

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const plan = await this.findPlanOrThrow(id);
    await this.ensureCanAccess(plan.doctorId, user);
    if (plan.steps.some((s) => s.paymentStatus === 'PAID')) {
      throw new BadRequestException(
        'Không thể hủy kế hoạch còn bước đã thanh toán',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.treatmentPlan.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      await tx.treatmentPlanAudit.create({
        data: {
          treatmentPlanId: id,
          action: 'CANCELLED',
          changedBy: user.userId,
          previousData: {
            status: plan.status,
            steps: plan.steps,
          } as Prisma.InputJsonValue,
        },
      });
    });
    this.invalidatePatientRecordsCache(plan.patientId);
    return { success: true, cancelled: true };
  }

  async updateStep(
    planId: string,
    stepId: string,
    dto: UpdateTreatmentPlanStepDto,
    user: AuthenticatedUser,
  ) {
    const plan = await this.findPlanOrThrow(planId);
    await this.ensureCanAccess(plan.doctorId, user);

    const step = await this.prisma.treatmentPlanStep.findFirst({
      where: { id: stepId, treatmentPlanId: planId },
    });
    if (!step) throw new NotFoundException('Không tìm thấy bước điều trị');
    if (plan.status === 'CANCELLED') {
      throw new BadRequestException(
        'Không thể cập nhật bước của kế hoạch đã hủy',
      );
    }
    if (dto.status) {
      const allowed: Record<string, string[]> = {
        PLANNED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: ['IN_PROGRESS'],
        CANCELLED: ['PLANNED'],
      };
      if (!allowed[step.status]?.includes(dto.status)) {
        throw new BadRequestException('Chuyển trạng thái bước không hợp lệ');
      }
    }
    if (
      step.paymentStatus !== TreatmentStepPaymentStatus.UNBILLED &&
      (dto.estimatedCost !== undefined || dto.status === 'CANCELLED')
    ) {
      throw new BadRequestException(
        'Không thể đổi chi phí hoặc hủy bước đã phát sinh thanh toán',
      );
    }

    if (
      step.paymentStatus === TreatmentStepPaymentStatus.PAID &&
      dto.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Không thể hủy bước điều trị đã thanh toán. Vui lòng liên hệ lễ tân thực hiện hoàn tiền trước.',
      );
    }

    const isCompleting =
      dto.status === 'COMPLETED' && step.status !== 'COMPLETED';
    const isUncompleting =
      dto.status && dto.status !== 'COMPLETED' && step.status === 'COMPLETED';

    const updated = await this.prisma.treatmentPlanStep.update({
      where: { id: stepId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.targetTooth !== undefined && {
          targetTooth: dto.targetTooth?.trim() || null,
        }),
        ...(dto.estimatedCost !== undefined && {
          estimatedCost: dto.estimatedCost,
        }),
        ...(dto.expectedDate !== undefined && {
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(isCompleting && { completedAt: new Date() }),
        ...(isUncompleting && { completedAt: null }),
      },
      select: {
        ...stepSelect,
        treatmentPlanId: true,
        doctor: { select: { userId: true } },
        treatmentPlan: { select: { patientId: true } },
      },
    });
    await this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: { emailQueuedAt: null },
    });
    this.invalidatePatientRecordsCache(updated.treatmentPlan.patientId);

    if (isCompleting) {
      try {
        await this.ensureStepInvoice({
          stepId: updated.id,
          patientId: updated.treatmentPlan.patientId,
          treatmentPlanId: updated.treatmentPlanId,
          createdBy: updated.doctor.userId,
          title: updated.title,
          stepOrder: updated.stepOrder,
          amount: Number(updated.paymentAmount ?? updated.estimatedCost ?? 0),
          paymentStatus: updated.paymentStatus,
        });
      } catch (error) {
        await this.prisma.treatmentPlanStep.update({
          where: { id: stepId },
          data: { status: step.status, completedAt: step.completedAt },
        });
        throw error;
      }
    }

    if (dto.status !== undefined) {
      const allSteps = await this.prisma.treatmentPlanStep.findMany({
        where: { treatmentPlanId: planId },
        select: { status: true },
      });
      if (allSteps.length > 0) {
        const allCompleted = allSteps.every((s) => s.status === 'COMPLETED');
        const anyActive = allSteps.some(
          (s) => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED',
        );

        if (allCompleted && plan.status !== 'COMPLETED') {
          await this.prisma.treatmentPlan.update({
            where: { id: planId },
            data: { status: 'COMPLETED' },
          });
        } else if (anyActive && plan.status !== 'IN_PROGRESS') {
          await this.prisma.treatmentPlan.update({
            where: { id: planId },
            data: { status: 'IN_PROGRESS' },
          });
        }
      }
    }

    return this.prisma.treatmentPlanStep.findUnique({
      where: { id: stepId },
      select: stepSelect,
    });
  }

  private async ensureStepInvoice(input: {
    stepId: string;
    patientId: string;
    treatmentPlanId: string;
    createdBy: string;
    title: string;
    stepOrder: number;
    amount: number;
    paymentStatus: string;
  }) {
    if (input.amount <= 0) return;

    const existing = await this.prisma.invoice.findFirst({
      where: {
        treatmentPlanStepId: input.stepId,
        status: {
          notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED],
        },
      },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.invoice.create({
      data: {
        invoiceCode: await this.generateInvoiceCode(),
        patientId: input.patientId,
        treatmentPlanId: input.treatmentPlanId,
        treatmentPlanStepId: input.stepId,
        invoiceType: InvoiceType.STEP_PAYMENT,
        items: [
          {
            description: `Đợt ${input.stepOrder}: ${input.title}`,
            qty: 1,
            unit_price: input.amount,
            amount: input.amount,
            type: 'STEP',
          },
        ],
        subtotal: input.amount,
        finalAmount: input.amount,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        createdBy: input.createdBy,
      },
    });

    if (input.paymentStatus === TreatmentStepPaymentStatus.UNBILLED) {
      await this.prisma.treatmentPlanStep.update({
        where: { id: input.stepId },
        data: { paymentStatus: TreatmentStepPaymentStatus.INVOICED },
      });
    }
  }

  private async generateInvoiceCode() {
    const yyyyMMdd = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const count = await this.prisma.invoice.count({
      where: { invoiceCode: { startsWith: `INV-${yyyyMMdd}` } },
    });
    return `INV-${yyyyMMdd}-${String(count + 1).padStart(4, '0')}`;
  }

  private toSummary(p: any) {
    const total = p.steps?.length ?? 0;
    const completed =
      p.steps?.filter((s: any) => s.status === 'COMPLETED').length ?? 0;
    const totalEstimatedCost =
      p.steps?.reduce(
        (sum: number, s: any) =>
          sum + Number(s.estimatedCost ?? s.paymentAmount ?? 0),
        0,
      ) ?? 0;
    return {
      id: p.id,
      title: p.title,
      description: p.description ?? null,
      status: p.status,
      patientId: p.patientId,
      patientName:
        p.patient?.fullName ?? p.patient?.user?.fullName ?? 'Bệnh nhân',
      patientCode: p.patient?.patientCode ?? '—',
      startDate: p.startDate ?? null,
      expectedEndDate: p.expectedEndDate ?? null,
      totalSteps: total,
      completedSteps: completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalEstimatedCost,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private toDetail(p: any) {
    return {
      ...this.toSummary(p),
      steps: p.steps ?? [],
    };
  }

  /** Gửi Phác đồ điều trị & Dự toán chi phí qua Gmail & Thông báo In-App cho bệnh nhân */
  async sendTreatmentPlanEmail(id: string, user: AuthenticatedUser) {
    const plan = await this.findPlanOrThrow(id);
    await this.ensureCanAccess(plan.doctorId, user);
    if (plan.emailQueuedAt) {
      throw new ConflictException('Kế hoạch này đã được xếp hàng gửi email');
    }

    const email =
      (plan.patient as any)?.user?.email || (plan.patient as any)?.email;
    const patientName =
      plan.patient?.fullName ??
      (plan.patient as any)?.user?.fullName ??
      'Quý khách';
    const patientCode = plan.patient?.patientCode ?? 'PAT-0000';
    const rawDoctorName = (plan as any)?.doctor?.user?.fullName;
    const doctorName = rawDoctorName
      ? rawDoctorName.startsWith('BS')
        ? rawDoctorName
        : `BS. ${rawDoctorName}`
      : 'Bác sĩ Nha Khoa Smart Dental';

    if (plan.status === 'CANCELLED') {
      throw new BadRequestException(
        'Không thể gửi email cho kế hoạch điều trị đã hủy',
      );
    }

    if (!plan.steps || plan.steps.length === 0) {
      throw new BadRequestException(
        'Kế hoạch điều trị chưa có bước điều trị nào để gửi',
      );
    }

    if (!email || email.endsWith('@clinic.local')) {
      throw new BadRequestException(
        'Bệnh nhân chưa có địa chỉ email hợp lệ để nhận phác đồ điều trị',
      );
    }

    const steps = (plan.steps || []).map((s: any) => ({
      stepOrder: s.stepOrder,
      title: s.title,
      description: s.description ?? null,
      targetTooth: s.targetTooth ?? null,
      estimatedCost: s.estimatedCost ? Number(s.estimatedCost) : null,
      paymentAmount: s.paymentAmount ? Number(s.paymentAmount) : null,
      expectedDate: s.expectedDate ? s.expectedDate.toISOString() : null,
      status: s.status,
    }));

    const totalEstimatedCost = steps.reduce(
      (sum, s) => sum + (s.estimatedCost || s.paymentAmount || 0),
      0,
    );

    const claimed = await this.prisma.treatmentPlan.updateMany({
      where: { id, emailQueuedAt: null },
      data: { emailQueuedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new ConflictException('Kế hoạch này đã được xếp hàng gửi email');
    }
    try {
      await this.mailQueue.add('send-treatment-plan', {
        name: patientName,
        email,
        patientCode,
        doctorName,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        startDate: plan.startDate ? plan.startDate.toISOString() : null,
        expectedEndDate: plan.expectedEndDate
          ? plan.expectedEndDate.toISOString()
          : null,
        totalEstimatedCost,
        steps,
      });
    } catch (error) {
      await this.prisma.treatmentPlan.update({
        where: { id },
        data: { emailQueuedAt: null },
      });
      throw error;
    }

    const patientUserId = (plan.patient as any)?.user?.id;
    if (patientUserId) {
      const notif = await this.prisma.notification
        .create({
          data: {
            userId: patientUserId,
            type: 'SYSTEM',
            title: '📑 Kế hoạch điều trị & Dự toán chi phí',
            content: `${doctorName} đã gửi Bản phác đồ điều trị "${plan.title}" và dự toán chi phí. Vui lòng kiểm tra email để duyệt lộ trình.`,
            channel: 'IN_APP',
            status: 'SENT',
            sentAt: new Date(),
          },
        })
        .catch(() => null);

      if (notif)
        try {
          this.eventsGateway.emitToUser(patientUserId, 'notification', notif);
        } catch (err) {
          console.error('Socket notification emit error:', err);
        }
    }

    return {
      success: true,
      message: `Đã gửi phác đồ điều trị & bảng dự toán chi phí thành công đến ${email}`,
    };
  }
}
