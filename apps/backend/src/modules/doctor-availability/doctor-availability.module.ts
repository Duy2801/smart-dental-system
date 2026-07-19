import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { DoctorAvailabilityController } from './doctor-availability.controller';
import { DoctorAvailabilityService } from './doctor-availability.service';

@Module({
  imports: [PrismaModule, ClinicConfigModule],
  controllers: [DoctorAvailabilityController],
  providers: [DoctorAvailabilityService],
  exports: [DoctorAvailabilityService],
})
export class DoctorAvailabilityModule {}
