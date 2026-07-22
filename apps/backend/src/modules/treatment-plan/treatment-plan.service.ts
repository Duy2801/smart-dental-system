import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const stepSelect = {
  id: true,
  stepOrder: true,
  title: true,
  description: true,
  targetTooth: true,
  status: true,
  estimatedCost: true,
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

  async findOne(id: string) {
    const p = await this.findPlanOrThrow(id);
    return this.toDetail(p);
  }

  async create(doctorId: string, dto: {
    patientId: string;
    title: string;
    description?: string;
    startDate?: string;
    expectedEndDate?: string;
    steps?: Array<{
      title: string;
      description?: string;
      targetTooth?: string;
      estimatedCost?: number;
      expectedDate?: string;
    }>;
  }) {
    return this.prisma.treatmentPlan.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : null,
        steps: dto.steps?.length
          ? {
              create: dto.steps.map((s, i) => ({
                doctorId,
                stepOrder: i + 1,
                title: s.title,
                description: s.description,
                targetTooth: s.targetTooth,
                estimatedCost: s.estimatedCost,
                expectedDate: s.expectedDate ? new Date(s.expectedDate) : null,
              })),
            }
          : undefined,
      },
      include: planInclude,
    });
  }

  async update(id: string, dto: {
    title?: string;
    description?: string;
    status?: string;
    startDate?: string | null;
    expectedEndDate?: string | null;
    steps?: Array<{
      title: string;
      description?: string;
      targetTooth?: string;
      estimatedCost?: number;
      expectedDate?: string;
    }>;
  }) {
    const plan = await this.findPlanOrThrow(id);

    return this.prisma.$transaction(async (tx) => {
      // Nếu có steps mới → xóa cũ, tạo lại
      if (dto.steps !== undefined) {
        await tx.treatmentPlanStep.deleteMany({ where: { treatmentPlanId: id } });
        if (dto.steps.length > 0) {
          await tx.treatmentPlanStep.createMany({
            data: dto.steps.map((s, i) => ({
              treatmentPlanId: id,
              doctorId: plan.doctorId,
              stepOrder: i + 1,
              title: s.title,
              description: s.description ?? null,
              targetTooth: s.targetTooth ?? null,
              estimatedCost: s.estimatedCost ?? null,
              expectedDate: s.expectedDate ? new Date(s.expectedDate) : null,
            })),
          });
        }
      }

      const updated = await tx.treatmentPlan.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.status !== undefined && { status: dto.status as any }),
          ...(dto.startDate !== undefined && {
            startDate: dto.startDate ? new Date(dto.startDate) : null,
          }),
          ...(dto.expectedEndDate !== undefined && {
            expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : null,
          }),
        },
        include: planInclude,
      });

      return this.toDetail(updated);
    });
  }

  async remove(id: string) {
    await this.findPlanOrThrow(id);
    await this.prisma.treatmentPlan.delete({ where: { id } });
    return { success: true };
  }

  async updateStep(planId: string, stepId: string, dto: {
    status?: string;
    title?: string;
    description?: string;
    targetTooth?: string;
    estimatedCost?: number;
    expectedDate?: string | null;
  }) {
    const step = await this.prisma.treatmentPlanStep.findFirst({
      where: { id: stepId, treatmentPlanId: planId },
    });
    if (!step) throw new NotFoundException('Không tìm thấy bước điều trị');

    const isCompleting = dto.status === 'COMPLETED' && step.status !== 'COMPLETED';
    const isUncompleting = dto.status && dto.status !== 'COMPLETED' && step.status === 'COMPLETED';

    return this.prisma.treatmentPlanStep.update({
      where: { id: stepId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetTooth !== undefined && { targetTooth: dto.targetTooth }),
        ...(dto.estimatedCost !== undefined && { estimatedCost: dto.estimatedCost }),
        ...(dto.expectedDate !== undefined && {
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(isCompleting && { completedAt: new Date() }),
        ...(isUncompleting && { completedAt: null }),
      },
      select: stepSelect,
    });
  }

  private toSummary(p: any) {
    const total = p.steps?.length ?? 0;
    const completed = p.steps?.filter((s: any) => s.status === 'COMPLETED').length ?? 0;
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
