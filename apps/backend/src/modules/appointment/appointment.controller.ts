import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Appointment')
@Controller('appointments')
export class AppointmentController {}
