import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  InvoiceType,
  TreatmentStepPaymentStatus,
} from '../../../prisma/generated/enums';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
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

  private async ensureCanAccess(
    planDoctorId: string,
    user: AuthenticatedUser,
  ) {
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
      dto.startDate &&
      dto.expectedEndDate &&
      new Date(dto.startDate) > new Date(dto.expectedEndDate)
    ) {
      throw new BadRequestException(
        'Ngày kết thúc dự kiến phải sau ngày bắt đầu',
      );
    }

    return this.prisma.$transaction(async (tx) => {
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

        const toDelete = [...existingIds].filter((sid) => !incomingIds.has(sid));
        if (toDelete.length > 0) {
          await tx.treatmentPlanStep.deleteMany({
            where: { id: { in: toDelete }, treatmentPlanId: id },
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
        where: { id },
        data: {
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

      return this.toDetail(updated);
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const plan = await this.findPlanOrThrow(id);
    await this.ensureCanAccess(plan.doctorId, user);
    await this.prisma.treatmentPlan.delete({ where: { id } });
    return { success: true };
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

    if (isCompleting) {
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
            description: `Dot ${input.stepOrder}: ${input.title}`,
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
    return {
      id: p.id,
      title: p.title,
      description: p.description ?? null,
      status: p.status,
      patientId: p.patientId,
      patientName: p.patient?.user?.fullName ?? '—',
      patientCode: p.patient?.patientCode ?? '—',
      startDate: p.startDate ?? null,
      expectedEndDate: p.expectedEndDate ?? null,
      totalSteps: total,
      completedSteps: completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      createdAt: p.createdAt,
    };
  }

  private toDetail(p: any) {
    return {
      ...this.toSummary(p),
      steps: p.steps ?? [],
    };
  }
}
