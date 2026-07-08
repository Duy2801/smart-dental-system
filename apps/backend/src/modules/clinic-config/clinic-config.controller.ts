import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Clinic Config')
@Controller('clinic-config')
export class ClinicConfigController {}
