import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalCaseController } from './clinical-case.controller';
import { ClinicalCaseService } from './clinical-case.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicalCaseController],
  providers: [ClinicalCaseService],
  exports: [ClinicalCaseService],
})
export class ClinicalCaseModule {}
