import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Service')
@Controller('services')
export class ServiceController {}
