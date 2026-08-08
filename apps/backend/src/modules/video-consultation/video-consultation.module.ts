import { Module } from '@nestjs/common';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VideoConsultationController } from './video-consultation.controller';
import { VideoConsultationService } from './video-consultation.service';

@Module({
  imports: [PrismaModule, PaymentModule, ClinicConfigModule],
  controllers: [VideoConsultationController],
  providers: [VideoConsultationService],
  exports: [VideoConsultationService],
})
export class VideoConsultationModule {}
