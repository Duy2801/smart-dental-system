import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateTreatmentMethodDto } from './dto/update-treatment-method.dto';

const serviceInclude = {
  treatmentMethods: {
    orderBy: { displayOrder: 'asc' as const },
    include: {
      _count: { select: { appointments: true } },
      media: { orderBy: { sortOrder: 'asc' as const } },
      procedureSteps: { orderBy: { stepOrder: 'asc' as const } },
      faqs: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
};

function cleanOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanTextList(values?: string[]) {
  if (!values) return undefined;
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function cleanHighlights(
  values?: { title: string; description: string; icon: string }[],
) {
  if (!values) return undefined;
  return values
    .map((value) => ({
      title: value.title.trim(),
      description: value.description.trim(),
      icon: value.icon.trim() || 'shield',
    }))
    .filter((value) => value.title || value.description);
}

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: ServiceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const category = query.category?.trim();

    const where = {
      AND: [
        search
          ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              {
                category: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
          : {},
        category ? { category } : {},
        query.isActive === undefined ? {} : { isActive: query.isActive },
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { category: 'asc' },
          { name: 'asc' },
        ],
        include: serviceInclude,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: serviceInclude,
    });

    if (!service) {
      throw new NotFoundException('service.not_found');
    }

    return service;
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        category: dto.category.trim(),
        name: dto.name.trim(),
        slug: cleanOptionalText(dto.slug),
        icon: cleanOptionalText(dto.icon),
        shortDescription: cleanOptionalText(dto.shortDescription),
        description: cleanOptionalText(dto.description),
        detailSummary: cleanOptionalText(dto.detailSummary),
        highlights: cleanHighlights(dto.highlights),
        suitableFor: cleanTextList(dto.suitableFor),
        includedItems: cleanTextList(dto.includedItems),
        preparationNotes: cleanTextList(dto.preparationNotes),
        aftercareNotes: cleanTextList(dto.aftercareNotes),
        importantNotes: cleanTextList(dto.importantNotes),
        pricingNote: cleanOptionalText(dto.pricingNote),
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        depositOverrideEnabled: dto.depositOverrideEnabled ?? false,
        depositRequired: dto.depositPolicyEnabled ?? true,
        depositCalculationMode: dto.depositCalculationMode,
        depositValue:
          dto.depositValue === undefined ? undefined : dto.depositValue,
        displayOrder: dto.displayOrder ?? 0,
        basePrice: dto.basePrice,
        durationMinutes: dto.durationMinutes,
        treatmentMethods: dto.treatmentMethods?.length
          ? {
            create: dto.treatmentMethods.map((tm, tmIndex) => ({
              name: tm.name.trim(),
              slug: cleanOptionalText(tm.slug),
              description: cleanOptionalText(tm.description),
              imageUrl: cleanOptionalText(tm.imageUrl),
              basePrice: tm.basePrice,
              durationMinutes: tm.durationMinutes,
              displayOrder: tm.displayOrder ?? tmIndex + 1,
              isActive: tm.isActive ?? true,
              media: tm.media?.length
                ? {
                  create: tm.media.map((media, index) => ({
                    url: media.url.trim(),
                    alt: cleanOptionalText(media.alt),
                    type: media.type.trim(),
                    sortOrder: media.sortOrder ?? index + 1,
                  })),
                }
                : undefined,
              procedureSteps: tm.procedureSteps?.length
                ? {
                  create: tm.procedureSteps.map((step, index) => ({
                    stepOrder: step.stepOrder ?? index + 1,
                    title: step.title.trim(),
                    description: step.description.trim(),
                    durationMinutes: step.durationMinutes,
                  })),
                }
                : undefined,
              faqs: tm.faqs?.length
                ? {
                  create: tm.faqs.map((faq, index) => ({
                    question: faq.question.trim(),
                    answer: faq.answer.trim(),
                    sortOrder: faq.sortOrder ?? index + 1,
                  })),
                }
                : undefined,
            })),
          }
          : undefined,
      },
      include: serviceInclude,
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.ensureServiceExists(id);

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.update({
        where: { id },
        data: {
          category: dto.category?.trim(),
          name: dto.name?.trim(),
          slug:
            dto.slug === undefined ? undefined : cleanOptionalText(dto.slug),
          icon:
            dto.icon === undefined ? undefined : cleanOptionalText(dto.icon),
          shortDescription:
            dto.shortDescription === undefined
              ? undefined
              : cleanOptionalText(dto.shortDescription),
          description:
            dto.description === undefined
              ? undefined
              : cleanOptionalText(dto.description),
          detailSummary:
            dto.detailSummary === undefined
              ? undefined
              : cleanOptionalText(dto.detailSummary),
          highlights:
            dto.highlights === undefined
              ? undefined
              : cleanHighlights(dto.highlights),
          suitableFor:
            dto.suitableFor === undefined
              ? undefined
              : cleanTextList(dto.suitableFor),
          includedItems:
            dto.includedItems === undefined
              ? undefined
              : cleanTextList(dto.includedItems),
          preparationNotes:
            dto.preparationNotes === undefined
              ? undefined
              : cleanTextList(dto.preparationNotes),
          aftercareNotes:
            dto.aftercareNotes === undefined
              ? undefined
              : cleanTextList(dto.aftercareNotes),
          importantNotes:
            dto.importantNotes === undefined
              ? undefined
              : cleanTextList(dto.importantNotes),
          pricingNote:
            dto.pricingNote === undefined
              ? undefined
              : cleanOptionalText(dto.pricingNote),
          isActive: dto.isActive,
          isFeatured: dto.isFeatured,
          basePrice: dto.basePrice,
          durationMinutes: dto.durationMinutes,
          depositOverrideEnabled: dto.depositOverrideEnabled,
          depositRequired: dto.depositPolicyEnabled,
          depositCalculationMode: dto.depositCalculationMode,
          depositValue:
            dto.depositValue === undefined ? undefined : dto.depositValue,
          displayOrder: dto.displayOrder,
        },
      });

      if (dto.treatmentMethods) {
        const existingMethods = await tx.treatmentMethod.findMany({
          where: { serviceId: id },
          select: { id: true },
        });
        const existingMethodIds = new Set(
          existingMethods.map((method) => method.id),
        );
        const retainedMethodIds = dto.treatmentMethods
          .map((method) => method.id)
          .filter((methodId): methodId is string => Boolean(methodId));

        if (
          retainedMethodIds.some(
            (methodId) => !existingMethodIds.has(methodId),
          )
        ) {
          throw new NotFoundException('treatment_method.not_found');
        }

        await tx.treatmentMethod.deleteMany({
          where: {
            serviceId: id,
            id: { notIn: retainedMethodIds },
          },
        });

        for (const tm of dto.treatmentMethods) {
          const methodData = {
            name: tm.name.trim(),
            slug: cleanOptionalText(tm.slug),
            description: cleanOptionalText(tm.description),
            imageUrl: cleanOptionalText(tm.imageUrl),
            basePrice: tm.basePrice,
            durationMinutes: tm.durationMinutes,
            displayOrder: tm.displayOrder ?? 0,
            isActive: dto.isActive === false ? false : (tm.isActive ?? true),
          };

          if (tm.id) {
            await tx.treatmentMethod.update({
              where: { id: tm.id },
              data: methodData,
            });

            await tx.serviceMedia.deleteMany({
              where: { treatmentMethodId: tm.id },
            });
            await tx.serviceProcedureStep.deleteMany({
              where: { treatmentMethodId: tm.id },
            });
            await tx.serviceFaq.deleteMany({
              where: { treatmentMethodId: tm.id },
            });

            if (tm.media?.length) {
              await tx.serviceMedia.createMany({
                data: tm.media.map((media, index) => ({
                  treatmentMethodId: tm.id!,
                  url: media.url.trim(),
                  alt: cleanOptionalText(media.alt),
                  type: media.type.trim(),
                  sortOrder: media.sortOrder ?? index + 1,
                })),
              });
            }
            if (tm.procedureSteps?.length) {
              await tx.serviceProcedureStep.createMany({
                data: tm.procedureSteps.map((step, index) => ({
                  treatmentMethodId: tm.id!,
                  stepOrder: step.stepOrder ?? index + 1,
                  title: step.title.trim(),
                  description: step.description.trim(),
                  durationMinutes: step.durationMinutes,
                })),
              });
            }
            if (tm.faqs?.length) {
              await tx.serviceFaq.createMany({
                data: tm.faqs.map((faq, index) => ({
                  treatmentMethodId: tm.id!,
                  question: faq.question.trim(),
                  answer: faq.answer.trim(),
                  sortOrder: faq.sortOrder ?? index + 1,
                })),
              });
            }
          } else {
            await tx.treatmentMethod.create({
              data: {
                serviceId: id,
                ...methodData,
                media: tm.media?.length
                  ? {
                    create: tm.media.map((media, index) => ({
                      url: media.url.trim(),
                      alt: cleanOptionalText(media.alt),
                      type: media.type.trim(),
                      sortOrder: media.sortOrder ?? index + 1,
                    })),
                  }
                  : undefined,
                procedureSteps: tm.procedureSteps?.length
                  ? {
                    create: tm.procedureSteps.map((step, index) => ({
                      stepOrder: step.stepOrder ?? index + 1,
                      title: step.title.trim(),
                      description: step.description.trim(),
                      durationMinutes: step.durationMinutes,
                    })),
                  }
                  : undefined,
                faqs: tm.faqs?.length
                  ? {
                    create: tm.faqs.map((faq, index) => ({
                      question: faq.question.trim(),
                      answer: faq.answer.trim(),
                      sortOrder: faq.sortOrder ?? index + 1,
                    })),
                  }
                  : undefined,
              },
            });
          }
        }
      }


      return tx.service.findUniqueOrThrow({
        where: { id: service.id },
        include: serviceInclude,
      });
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.ensureServiceExists(id);

    return this.prisma.service.update({
      where: { id },
      data: { isActive },
    });
  }

  async updateTreatmentMethod(
    serviceId: string,
    methodId: string,
    dto: UpdateTreatmentMethodDto,
  ) {
    const method = await this.prisma.treatmentMethod.findFirst({
      where: { id: methodId, serviceId },
      select: { id: true },
    });

    if (!method) {
      throw new NotFoundException('treatment_method.not_found');
    }

    return this.prisma.treatmentMethod.update({
      where: { id: methodId },
      data: {
        name: dto.name.trim(),
        slug: cleanOptionalText(dto.slug),
        description: cleanOptionalText(dto.description),
        imageUrl: cleanOptionalText(dto.imageUrl),
        basePrice: dto.basePrice,
        durationMinutes: dto.durationMinutes,
        displayOrder: dto.displayOrder,
        isActive: dto.isActive,
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        procedureSteps: { orderBy: { stepOrder: 'asc' } },
        faqs: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async remove(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { appointments: true, clinicalCases: true } },
      },
    });

    if (!service) {
      throw new NotFoundException('service.not_found');
    }

    if (
      service._count.appointments > 0 ||
      service._count.clinicalCases > 0
    ) {
      throw new BadRequestException('service.has_related_history');
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return { message: 'service.deleted' };
  }

  async removeTreatmentMethod(serviceId: string, methodId: string) {
    const method = await this.prisma.treatmentMethod.findFirst({
      where: { id: methodId, serviceId },
      select: { id: true, _count: { select: { appointments: true } } },
    });

    if (!method) {
      throw new NotFoundException('treatment_method.not_found');
    }

    if (method._count.appointments > 0) {
      throw new BadRequestException('treatment_method.has_appointments');
    }

    await this.prisma.treatmentMethod.delete({ where: { id: methodId } });
    return { message: 'treatment_method.deleted' };
  }

  private async ensureServiceExists(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('service.not_found');
    }
  }
}
