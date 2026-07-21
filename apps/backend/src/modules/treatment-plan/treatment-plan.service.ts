import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    select: {
      id: true,
      stepOrder: true,
      title: true,
      status: true,
      estimatedCost: true,
      expectedDate: true,
      completedAt: true,
    },
  },
} as const;

@Injectable()
export class TreatmentPlanService {
  constructor(private prisma: PrismaService) {}

  async findByDoctor(doctorId: string) {
    const plans = await this.prisma.treatmentPlan.findMany({
      where: { doctorId },
      include: planInclude,
      orderBy: { createdAt: 'desc' },
    });
    return plans.map((p) => this.toSummary(p));
  }

  async findOne(id: string) {
    const p = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!p) throw new NotFoundException('Không tìm thấy kế hoạch điều trị');
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
