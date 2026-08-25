import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateTreatmentMethodDto } from './dto/update-treatment-method.dto';
import { ServiceService } from './service.service';

@ApiTags('Service')
@Controller(['services', 'admin/services'])
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  findAll(@Query() query: ServiceQueryDto) {
    return this.serviceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceStatusDto) {
    return this.serviceService.updateStatus(id, dto.isActive);
  }

  @Patch(':serviceId/treatment-methods/:methodId')
  updateTreatmentMethod(
    @Param('serviceId') serviceId: string,
    @Param('methodId') methodId: string,
    @Body() dto: UpdateTreatmentMethodDto,
  ) {
    return this.serviceService.updateTreatmentMethod(
      serviceId,
      methodId,
      dto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }

  @Delete(':serviceId/treatment-methods/:methodId')
  removeTreatmentMethod(
    @Param('serviceId') serviceId: string,
    @Param('methodId') methodId: string,
  ) {
    return this.serviceService.removeTreatmentMethod(serviceId, methodId);
  }
}
