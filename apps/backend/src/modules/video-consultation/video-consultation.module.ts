import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VideoConsultationController } from './video-consultation.controller';
import { VideoConsultationService } from './video-consultation.service';

@Module({
  imports: [PrismaModule],
  controllers: [VideoConsultationController],
  providers: [VideoConsultationService],
  exports: [VideoConsultationService],
})
export class VideoConsultationModule {}
