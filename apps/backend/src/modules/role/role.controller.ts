import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Role')
@Controller('roles')
export class RoleController {}
