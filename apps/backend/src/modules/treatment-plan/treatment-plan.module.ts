import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { TreatmentPlanController } from './treatment-plan.controller';
import { TreatmentPlanService } from './treatment-plan.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SocketModule,
  ],
  controllers: [TreatmentPlanController],
  providers: [TreatmentPlanService],
  exports: [TreatmentPlanService],
})
export class TreatmentPlanModule {}
