import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TreatmentPlanController } from './treatment-plan.controller';
import { TreatmentPlanService } from './treatment-plan.service';

@Module({
  imports: [PrismaModule],
  controllers: [TreatmentPlanController],
  providers: [TreatmentPlanService],
  exports: [TreatmentPlanService],
})
export class TreatmentPlanModule {}
