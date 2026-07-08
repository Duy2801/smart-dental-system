import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Permission')
@Controller('permissions')
export class PermissionController {}
