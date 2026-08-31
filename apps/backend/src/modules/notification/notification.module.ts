import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminMarketingCampaignController } from './admin-marketing.controller';
import { PatientNotificationController } from './patient-notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [PatientNotificationController, AdminMarketingCampaignController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
