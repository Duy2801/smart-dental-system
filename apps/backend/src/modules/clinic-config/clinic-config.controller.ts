import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClinicConfigService } from './clinic-config.service';
import { UpdateClinicConfigDto } from './dto/update-clinic-config.dto';

@ApiTags('Clinic Config')
@Controller(['clinic-config', 'admin/clinic-config'])
export class ClinicConfigController {
  constructor(private readonly clinicConfigService: ClinicConfigService) {}

  @Get()
  findOne() {
    return this.clinicConfigService.getClinicConfig();
  }

  @Patch()
  update(@Body() dto: UpdateClinicConfigDto) {
    return this.clinicConfigService.updateClinicConfig(dto);
  }
}
