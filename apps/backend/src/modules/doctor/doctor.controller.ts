import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Doctor')
@Controller('doctors')
export class DoctorController {}
