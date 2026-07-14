import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

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
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
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
        description: dto.description?.trim(),
        durationMinutes: dto.durationMinutes,
        basePrice: dto.basePrice,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.ensureServiceExists(id);

    return this.prisma.service.update({
      where: { id },
      data: {
        category: dto.category?.trim(),
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        durationMinutes: dto.durationMinutes,
        basePrice: dto.basePrice,
        isActive: dto.isActive,
      },
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
