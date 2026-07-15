import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

const serviceInclude = {
  media: { orderBy: { sortOrder: 'asc' as const } },
  procedureSteps: { orderBy: { stepOrder: 'asc' as const } },
  faqs: { orderBy: { sortOrder: 'asc' as const } },
};

function cleanOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
        shortDescription: cleanOptionalText(dto.shortDescription),
        description: cleanOptionalText(dto.description),
        thumbnailUrl: cleanOptionalText(dto.thumbnailUrl),
        durationMinutes: dto.durationMinutes,
        basePrice: dto.basePrice,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        displayOrder: dto.displayOrder ?? 0,
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
          shortDescription:
            dto.shortDescription === undefined
              ? undefined
              : cleanOptionalText(dto.shortDescription),
          description:
            dto.description === undefined
              ? undefined
              : cleanOptionalText(dto.description),
          thumbnailUrl:
            dto.thumbnailUrl === undefined
              ? undefined
              : cleanOptionalText(dto.thumbnailUrl),
          durationMinutes: dto.durationMinutes,
          basePrice: dto.basePrice,
          isActive: dto.isActive,
          isFeatured: dto.isFeatured,
          displayOrder: dto.displayOrder,
        },
      });

      if (dto.media) {
        await tx.serviceMedia.deleteMany({ where: { serviceId: id } });
        if (dto.media.length) {
          await tx.serviceMedia.createMany({
            data: dto.media.map((media, index) => ({
              serviceId: id,
              url: media.url.trim(),
              alt: cleanOptionalText(media.alt),
              type: media.type.trim(),
              sortOrder: media.sortOrder ?? index + 1,
            })),
          });
        }
      }

      if (dto.procedureSteps) {
        await tx.serviceProcedureStep.deleteMany({
          where: { serviceId: id },
        });
        if (dto.procedureSteps.length) {
          await tx.serviceProcedureStep.createMany({
            data: dto.procedureSteps.map((step, index) => ({
              serviceId: id,
              stepOrder: step.stepOrder ?? index + 1,
              title: step.title.trim(),
              description: step.description.trim(),
              durationMinutes: step.durationMinutes,
            })),
          });
        }
      }

      if (dto.faqs) {
        await tx.serviceFaq.deleteMany({ where: { serviceId: id } });
        if (dto.faqs.length) {
          await tx.serviceFaq.createMany({
            data: dto.faqs.map((faq, index) => ({
              serviceId: id,
              question: faq.question.trim(),
              answer: faq.answer.trim(),
              sortOrder: faq.sortOrder ?? index + 1,
            })),
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
