import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
} from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { MarketingCampaignQueryDto } from './dto/marketing-campaign-query.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserNotifications(
    userId: string,
    query?: { type?: string; unreadOnly?: boolean | string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    const isUnreadOnly = query?.unreadOnly === true || query?.unreadOnly === 'true';

    let typeFilter: any = undefined;
    if (query?.type) {
      if (query.type === 'APPOINTMENTS') {
        typeFilter = { in: ['APPOINTMENT_CONFIRMED', 'APPOINTMENT_REMINDER'] };
      } else if (query.type === 'PAYMENTS') {
        typeFilter = 'PAYMENT_SUCCESS';
      } else if (query.type === 'PROMOTIONS') {
        typeFilter = { in: ['PROMOTION_CAMPAIGN', 'MARKETING'] };
      } else if (query.type.includes(',')) {
        typeFilter = { in: query.type.split(',') };
      } else {
        typeFilter = query.type;
      }
    }

    const whereCondition = {
      userId,
      ...(isUnreadOnly ? { readAt: null } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    };

    let total = await this.prisma.notification.count({ where: whereCondition });

    if (total === 0 && !query?.type && !isUnreadOnly && page === 1) {
      await this.seedInitialPatientNotifications(userId);
      total = await this.prisma.notification.count({ where: whereCondition });
    }

    const notifications = await this.prisma.notification.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      data: notifications.map((item) => ({
        id: item.id,
        userId: item.userId,
        type: item.type,
        title: item.title,
        content: item.content,
        read: Boolean(item.readAt),
        readAt: item.readAt,
        createdAt: item.createdAt,
        appointmentId: item.appointmentId,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
        unreadCount,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('notification.not_found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return { message: 'notification.marked_read', id: notificationId };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        status: NotificationStatus.SENT,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return { message: 'notification.all_marked_read' };
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    content: string;
    channel?: NotificationChannel;
    appointmentId?: string;
    treatmentPlanId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title.trim(),
        content: data.content.trim(),
        channel: data.channel ?? NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        appointmentId: data.appointmentId,
        treatmentPlanId: data.treatmentPlanId,
        sentAt: new Date(),
      },
    });
  }

  private async seedInitialPatientNotifications(userId: string) {
    const now = new Date();
    const seedData = [
      {
        userId,
        type: 'APPOINTMENT_CONFIRMED',
        title: 'Lịch hẹn đã được xác nhận',
        content:
          'Cuộc hẹn vệ sinh răng miệng và kiểm tra tổng quát đã được phòng khám xác nhận thành công.',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        sentAt: new Date(now.getTime() - 5 * 60 * 1000),
        createdAt: new Date(now.getTime() - 5 * 60 * 1000),
      },
      {
        userId,
        type: 'APPOINTMENT_REMINDER',
        title: 'Nhắc chuẩn bị trước khám',
        content:
          'Vui lòng có mặt trước 15 phút tại chi nhánh phòng khám và mang theo hồ sơ điều trị cá nhân.',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        sentAt: new Date(now.getTime() - 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Thanh toán thành công',
        content:
          'Hóa đơn đặt cọc dịch vụ nha khoa đã được thanh toán thành công và lưu trữ trong lịch sử giao dịch.',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.READ,
        sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      },
      {
        userId,
        type: 'PROMOTION_CAMPAIGN',
        title: 'Chương trình Ưu Đãi Đặc Biệt',
        content:
          'Nhận ngay Voucher giảm giá 500.000 VNĐ cho các gói dịch vụ Tẩy trắng răng & Bọc răng sứ cao cấp trong tháng này!',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.READ,
        sentAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 40 * 60 * 60 * 1000),
      },
    ];

    await this.prisma.notification.createMany({
      data: seedData,
    });
  }

  async findMarketingCampaigns(query: MarketingCampaignQueryDto) {
    const search = query.search?.trim();
    const channel = query.channel ?? 'ALL';

    const notifications = await this.prisma.notification.findMany({
      where: {
        type: 'MARKETING',
        isManual: true,
        ...(channel === 'ALL' ? {} : { channel: channel as NotificationChannel }),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    });

    const grouped = new Map<
      string,
      {
        content: string;
        id: string;
        channel: NotificationChannel;
        scheduled_at: string;
        status: 'PENDING' | 'SENT' | 'FAILED';
        title: string;
        sent_count: number;
        read_count: number;
      }
    >();

    notifications.forEach((notification) => {
      const scheduledAt = (
        notification.scheduledAt ?? notification.createdAt
      ).toISOString();
      const key = JSON.stringify([
        notification.title,
        notification.content,
        notification.channel,
        scheduledAt,
      ]);
      const current = grouped.get(key) ?? {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        channel: notification.channel,
        scheduled_at: scheduledAt,
        status: this.mapCampaignStatus(notification.status),
        sent_count: 0,
        read_count: 0,
      };

      if (
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.READ
      ) {
        current.sent_count += 1;
      }
      if (notification.status === NotificationStatus.READ) {
        current.read_count += 1;
      }
      if (notification.status === NotificationStatus.FAILED) {
        current.status = 'FAILED';
      } else if (
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.READ
      ) {
        current.status = 'SENT';
      }

      grouped.set(key, current);
    });

    return Array.from(grouped.values());
  }

  async createMarketingCampaign(dto: CreateMarketingCampaignDto) {
    const patients = await this.prisma.patient.findMany({
      where: { userId: { not: null } },
      select: { userId: true },
    });

    if (patients.length === 0) {
      throw new BadRequestException('marketing.no_patient_recipients');
    }

    const scheduledAt = dto.scheduled_at ? new Date(dto.scheduled_at) : new Date();
    const isScheduled = Boolean(dto.scheduled_at);
    const status = isScheduled
      ? NotificationStatus.PENDING
      : NotificationStatus.SENT;

    const chunkSize = 500;
    for (let i = 0; i < patients.length; i += chunkSize) {
      const chunk = patients.slice(i, i + chunkSize);
      await this.prisma.notification.createMany({
        data: chunk.map((patient) => ({
          userId: patient.userId!,
          type: 'MARKETING',
          title: dto.title.trim(),
          content: dto.content.trim(),
          channel: dto.channel,
          status,
          scheduledAt,
          isManual: true,
          sentAt: status === NotificationStatus.SENT ? new Date() : null,
        })),
      });
    }

    return {
      title: dto.title.trim(),
      content: dto.content.trim(),
      channel: dto.channel,
      status: this.mapCampaignStatus(status),
      scheduled_at: scheduledAt.toISOString(),
      sent_count: status === NotificationStatus.SENT ? patients.length : 0,
      read_count: 0,
    };
  }

  async removeMarketingCampaign(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('marketing_campaign.not_found');
    }

    await this.prisma.notification.deleteMany({
      where: {
        type: 'MARKETING',
        isManual: true,
        title: notification.title,
        content: notification.content,
        channel: notification.channel,
        scheduledAt: notification.scheduledAt,
      },
    });

    return { message: 'marketing_campaign.deleted' };
  }

  private mapCampaignStatus(status: NotificationStatus) {
    if (status === NotificationStatus.FAILED) {
      return 'FAILED';
    }
    if (status === NotificationStatus.SENT || status === NotificationStatus.READ) {
      return 'SENT';
    }
    return 'PENDING';
  }
}
