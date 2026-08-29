import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ClinicConfigService } from './clinic-config.service';
import { UpdateClinicConfigDto } from './dto/update-clinic-config.dto';

@ApiTags('Clinic Config')
@ApiBearerAuth()
@Controller(['clinic-config', 'admin/clinic-config'])
export class ClinicConfigController {
  constructor(private readonly clinicConfigService: ClinicConfigService) { }

  @Get()
  findOne() {
    return this.clinicConfigService.getClinicConfig();
  }

  @Patch()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Body() dto: UpdateClinicConfigDto) {
    return this.clinicConfigService.updateClinicConfig(dto);
  }
}

