import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

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
  constructor(private readonly prisma: PrismaService) {}

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
          : {
              create: [
                {
                  name: dto.name.trim(),
                  slug: cleanOptionalText(dto.slug),
                  description: cleanOptionalText(dto.description),
                  basePrice: dto.basePrice ?? 0,
                  durationMinutes: dto.durationMinutes ?? 30,
                  displayOrder: 1,
                  isActive: dto.isActive ?? true,
                  media: dto.media?.length
                    ? {
                        create: dto.media.map((media, index) => ({
                          url: media.url.trim(),
                          alt: cleanOptionalText(media.alt),
                          type: media.type.trim(),
                          sortOrder: media.sortOrder ?? index + 1,
                        })),
                      }
                    : undefined,
                  procedureSteps: dto.procedureSteps?.length
                    ? {
                        create: dto.procedureSteps.map((step, index) => ({
                          stepOrder: step.stepOrder ?? index + 1,
                          title: step.title.trim(),
                          description: step.description.trim(),
                          durationMinutes: step.durationMinutes,
                        })),
                      }
                    : undefined,
                  faqs: dto.faqs?.length
                    ? {
                        create: dto.faqs.map((faq, index) => ({
                          question: faq.question.trim(),
                          answer: faq.answer.trim(),
                          sortOrder: faq.sortOrder ?? index + 1,
                        })),
                      }
                    : undefined,
                },
              ],
            },
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
        await tx.treatmentMethod.deleteMany({ where: { serviceId: id } });
        if (dto.treatmentMethods.length) {
          for (const tm of dto.treatmentMethods) {
            await tx.treatmentMethod.create({
              data: {
                serviceId: id,
                name: tm.name.trim(),
                slug: cleanOptionalText(tm.slug),
                description: cleanOptionalText(tm.description),
                imageUrl: cleanOptionalText(tm.imageUrl),
                basePrice: tm.basePrice,
                durationMinutes: tm.durationMinutes,
                displayOrder: tm.displayOrder ?? 0,
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
              },
            });
          }
        }
      } else {
        // Sync single default treatment method if treatmentMethods was not explicitly supplied
        const existingMethods = await tx.treatmentMethod.findMany({
          where: { serviceId: id },
          orderBy: { displayOrder: 'asc' },
        });

        if (existingMethods.length > 0) {
          const primaryMethod = existingMethods[0];
          await tx.treatmentMethod.update({
            where: { id: primaryMethod.id },
            data: {
              name: dto.name ? dto.name.trim() : primaryMethod.name,
              basePrice: dto.basePrice ?? primaryMethod.basePrice,
              durationMinutes: dto.durationMinutes ?? primaryMethod.durationMinutes,
              description:
                dto.description !== undefined
                  ? cleanOptionalText(dto.description)
                  : primaryMethod.description,
            },
          });

          if (dto.media !== undefined) {
            await tx.serviceMedia.deleteMany({ where: { treatmentMethodId: primaryMethod.id } });
            if (dto.media.length > 0) {
              await tx.serviceMedia.createMany({
                data: dto.media.map((media, index) => ({
                  treatmentMethodId: primaryMethod.id,
                  url: media.url.trim(),
                  alt: cleanOptionalText(media.alt),
                  type: media.type.trim(),
                  sortOrder: media.sortOrder ?? index + 1,
                })),
              });
            }
          }

          if (dto.procedureSteps !== undefined) {
            await tx.serviceProcedureStep.deleteMany({ where: { treatmentMethodId: primaryMethod.id } });
            if (dto.procedureSteps.length > 0) {
              await tx.serviceProcedureStep.createMany({
                data: dto.procedureSteps.map((step, index) => ({
                  treatmentMethodId: primaryMethod.id,
                  stepOrder: step.stepOrder ?? index + 1,
                  title: step.title.trim(),
                  description: step.description.trim(),
                  durationMinutes: step.durationMinutes,
                })),
              });
            }
          }

          if (dto.faqs !== undefined) {
            await tx.serviceFaq.deleteMany({ where: { treatmentMethodId: primaryMethod.id } });
            if (dto.faqs.length > 0) {
              await tx.serviceFaq.createMany({
                data: dto.faqs.map((faq, index) => ({
                  treatmentMethodId: primaryMethod.id,
                  question: faq.question.trim(),
                  answer: faq.answer.trim(),
                  sortOrder: faq.sortOrder ?? index + 1,
                })),
              });
            }
          }
        } else {
          await tx.treatmentMethod.create({
            data: {
              serviceId: id,
              name: (dto.name || service.name).trim(),
              slug: cleanOptionalText(dto.slug || service.slug || undefined),
              description: cleanOptionalText(dto.description || service.description || undefined),
              basePrice: dto.basePrice ?? service.basePrice ?? 0,
              durationMinutes: dto.durationMinutes ?? service.durationMinutes ?? 30,
              displayOrder: 1,
              isActive: dto.isActive ?? service.isActive,
              media: dto.media?.length
                ? {
                    create: dto.media.map((media, index) => ({
                      url: media.url.trim(),
                      alt: cleanOptionalText(media.alt),
                      type: media.type.trim(),
                      sortOrder: media.sortOrder ?? index + 1,
                    })),
                  }
                : undefined,
              procedureSteps: dto.procedureSteps?.length
                ? {
                    create: dto.procedureSteps.map((step, index) => ({
                      stepOrder: step.stepOrder ?? index + 1,
                      title: step.title.trim(),
                      description: step.description.trim(),
                      durationMinutes: step.durationMinutes,
                    })),
                  }
                : undefined,
              faqs: dto.faqs?.length
                ? {
                    create: dto.faqs.map((faq, index) => ({
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

  async remove(id: string) {
    await this.ensureServiceExists(id);

    await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'service.deactivated' };
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
