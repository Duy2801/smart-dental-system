import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Patient')
@Controller('patients')
export class PatientController {}
