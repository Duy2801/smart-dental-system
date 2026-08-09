import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionQueryDto } from './dto/promotion-query.dto';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PromotionQueryDto) {
    const search = query.search?.trim();

    const promotions = await this.prisma.promotion.findMany({
      where: search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        applicableTreatmentMethod: {
          include: {
            service: true,
            media: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((promotion) => ({
      id: promotion.id,
      code: promotion.code,
      name: promotion.name,
      description: promotion.description ?? '',
      image_url: promotion.imageUrl ?? null,
      applicable_service_slug: promotion.applicableServiceSlug ?? null,
      applicable_treatment_method_id: promotion.applicableTreatmentMethodId ?? null,
      applicable_treatment_method: promotion.applicableTreatmentMethod
        ? {
            id: promotion.applicableTreatmentMethod.id,
            name: promotion.applicableTreatmentMethod.name,
            slug: promotion.applicableTreatmentMethod.slug,
            description: promotion.applicableTreatmentMethod.description,
            imageUrl:
              promotion.applicableTreatmentMethod.imageUrl ||
              promotion.applicableTreatmentMethod.media?.[0]?.url ||
              null,
            basePrice: Number(promotion.applicableTreatmentMethod.basePrice),
            durationMinutes: promotion.applicableTreatmentMethod.durationMinutes,
            serviceId: promotion.applicableTreatmentMethod.serviceId,
            category:
              promotion.applicableTreatmentMethod.service?.category ||
              promotion.applicableTreatmentMethod.service?.name ||
              'NHA KHOA TỔNG QUÁT',
            serviceSlug: promotion.applicableTreatmentMethod.service?.slug,
          }
        : null,
      discount_type: promotion.discountType,
      discount_value: Number(promotion.discountValue),
      min_order_amount: Number(promotion.minOrderAmount ?? 0),
      max_uses: promotion.maxUses ?? 0,
      used_count: promotion.usedCount,
      start_date: promotion.startDate.toISOString(),
      end_date: promotion.endDate.toISOString(),
      is_active: promotion.isActive,
    }));
  }

  async create(dto: CreatePromotionDto) {
    const promotion = await this.prisma.promotion.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
        discountType: dto.discount_type,
        discountValue: dto.discount_value,
        minOrderAmount: dto.min_order_amount ?? 0,
        maxUses: dto.max_uses,
        startDate: new Date(dto.start_date),
        endDate: new Date(dto.end_date),
        isActive: dto.is_active ?? true,
      },
    });

    return {
      id: promotion.id,
      code: promotion.code,
      name: promotion.name,
      description: promotion.description ?? '',
      discount_type: promotion.discountType,
      discount_value: Number(promotion.discountValue),
      max_uses: promotion.maxUses ?? 0,
      used_count: promotion.usedCount,
      start_date: promotion.startDate.toISOString(),
      end_date: promotion.endDate.toISOString(),
      is_active: promotion.isActive,
    };
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.ensureExists(id);

    const promotion = await this.prisma.promotion.update({
      where: { id },
      data: { isActive },
    });

    return {
      id: promotion.id,
      is_active: promotion.isActive,
    };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'promotion.deleted' };
  }

  private async ensureExists(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!promotion) {
      throw new NotFoundException('promotion.not_found');
    }
  }
}
