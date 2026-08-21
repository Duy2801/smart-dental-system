import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromotionController } from './promotion.controller';
import { PromotionService } from './promotion.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [PromotionController],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionModule {}
