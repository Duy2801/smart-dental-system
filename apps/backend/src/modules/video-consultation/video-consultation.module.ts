import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { MailModule } from '../mail/mail.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { VideoConsultationController } from './video-consultation.controller';
import { VideoConsultationService } from './video-consultation.service';

@Module({
  imports: [
    PrismaModule,
    PaymentModule,
    ClinicConfigModule,
    MailModule,
    SocketModule,
    BullModule.registerQueue({ name: 'mail-queue' }),
  ],
  controllers: [VideoConsultationController],
  providers: [VideoConsultationService],
  exports: [VideoConsultationService],
})
export class VideoConsultationModule {}
