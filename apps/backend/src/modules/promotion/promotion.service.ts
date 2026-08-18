import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '../../../prisma/generated/enums';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionQueryDto } from './dto/promotion-query.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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
    const codeUpper = dto.code.trim().toUpperCase();

    const existing = await this.prisma.promotion.findUnique({
      where: { code: codeUpper },
    });
    if (existing) {
      throw new BadRequestException('Mã khuyến mãi này đã tồn tại');
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        code: codeUpper,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        imageUrl: dto.image_url?.trim() || null,
        applicableServiceSlug: dto.applicable_service_slug?.trim() || null,
        applicableTreatmentMethodId: dto.applicable_treatment_method_id?.trim() || null,
        discountType: dto.discount_type,
        discountValue: dto.discount_value,
        minOrderAmount: dto.min_order_amount ?? 0,
        maxUses: dto.max_uses,
        startDate: new Date(dto.start_date),
        endDate: new Date(dto.end_date),
        isActive: dto.is_active ?? true,
      },
    });

    if (dto.broadcast_notification) {
      await this.broadcastPromotion(promotion.id);
    }

    return this.findOne(promotion.id);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.ensureExists(id);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.image_url !== undefined) data.imageUrl = dto.image_url.trim() || null;
    if (dto.applicable_service_slug !== undefined)
      data.applicableServiceSlug = dto.applicable_service_slug.trim() || null;
    if (dto.applicable_treatment_method_id !== undefined)
      data.applicableTreatmentMethodId = dto.applicable_treatment_method_id.trim() || null;
    if (dto.discount_type !== undefined) data.discountType = dto.discount_type;
    if (dto.discount_value !== undefined) data.discountValue = dto.discount_value;
    if (dto.min_order_amount !== undefined) data.minOrderAmount = dto.min_order_amount;
    if (dto.max_uses !== undefined) data.maxUses = dto.max_uses;
    if (dto.start_date !== undefined) data.startDate = new Date(dto.start_date);
    if (dto.end_date !== undefined) data.endDate = new Date(dto.end_date);
    if (dto.is_active !== undefined) data.isActive = dto.is_active;

    await this.prisma.promotion.update({
      where: { id },
      data,
    });

    if (dto.broadcast_notification) {
      await this.broadcastPromotion(id);
    }

    return this.findOne(id);
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

  async broadcastPromotion(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      throw new NotFoundException('promotion.not_found');
    }

    const patients = await this.prisma.patient.findMany({
      where: { userId: { not: null } },
      select: { userId: true },
    });

    if (patients.length === 0) {
      return { broadcast_count: 0, message: 'Chưa có tài khoản bệnh nhân nào trong hệ thống' };
    }

    const discountText =
      promotion.discountType === 'PERCENTAGE'
        ? `giảm ${promotion.discountValue}%`
        : `giảm ${Number(promotion.discountValue).toLocaleString('vi-VN')} VNĐ`;

    const title = `🎁 Ưu đãi đặc biệt: ${promotion.name}`;
    const content = `Nhận ngay voucher ${promotion.code} (${discountText}) áp dụng từ ${new Date(promotion.startDate).toLocaleDateString('vi-VN')} đến ${new Date(promotion.endDate).toLocaleDateString('vi-VN')}. Nhanh tay nhận ưu đãi!`;

    const now = new Date();
    await this.prisma.$transaction(
      patients.map((p) =>
        this.prisma.notification.create({
          data: {
            userId: p.userId!,
            type: 'PROMOTION_CAMPAIGN',
            title,
            content,
            channel: NotificationChannel.IN_APP,
            status: NotificationStatus.SENT,
            sentAt: now,
          },
        }),
      ),
    );

    return {
      broadcast_count: patients.length,
      message: `Đã gửi thông báo ưu đãi tới ${patients.length} bệnh nhân`,
    };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'promotion.deleted' };
  }

  private async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        applicableTreatmentMethod: {
          include: {
            service: true,
            media: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('promotion.not_found');
    }

    return {
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
    };
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
