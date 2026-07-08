import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Doctor Availability')
@Controller('doctor-availability')
export class DoctorAvailabilityController {}
