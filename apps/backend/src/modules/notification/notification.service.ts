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
      const key = [
        notification.title,
        notification.content,
        notification.channel,
        scheduledAt,
      ].join('|');
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

    const notifications = await this.prisma.$transaction(
      patients.map((patient) =>
        this.prisma.notification.create({
          data: {
            userId: patient.userId,
            type: 'MARKETING',
            title: dto.title.trim(),
            content: dto.content.trim(),
            channel: dto.channel,
            status,
            scheduledAt,
            isManual: true,
            sentAt: status === NotificationStatus.SENT ? new Date() : null,
          },
        }),
      ),
    );

    const firstNotification = notifications[0];

    return {
      id: firstNotification.id,
      title: firstNotification.title,
      content: firstNotification.content,
      channel: firstNotification.channel,
      status: this.mapCampaignStatus(firstNotification.status),
      scheduled_at: firstNotification.scheduledAt?.toISOString() ?? scheduledAt.toISOString(),
      sent_count: status === NotificationStatus.SENT ? notifications.length : 0,
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
