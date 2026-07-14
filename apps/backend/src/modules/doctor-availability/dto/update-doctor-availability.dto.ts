import { PartialType } from '@nestjs/swagger';
import { CreateDoctorAvailabilityDto } from './create-doctor-availability.dto';

export class UpdateDoctorAvailabilityDto extends PartialType(
  CreateDoctorAvailabilityDto,
) {}
