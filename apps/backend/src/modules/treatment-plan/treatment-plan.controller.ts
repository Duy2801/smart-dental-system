import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Treatment Plan')
@Controller('treatment-plans')
export class TreatmentPlanController {}
