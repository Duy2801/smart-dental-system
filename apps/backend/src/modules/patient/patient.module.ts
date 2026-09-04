import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
  ],
  controllers: [PatientController],
  providers: [PatientService, RolesGuard],
  exports: [PatientService],
})
export class PatientModule {}
