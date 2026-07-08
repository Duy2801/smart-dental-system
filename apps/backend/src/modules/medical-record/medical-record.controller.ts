import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Medical Record')
@Controller('medical-records')
export class MedicalRecordController {}
