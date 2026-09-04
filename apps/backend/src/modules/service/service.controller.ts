import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateTreatmentMethodDto } from './dto/update-treatment-method.dto';
import { ServiceService } from './service.service';

@ApiTags('Service')
@ApiBearerAuth()
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
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceStatusDto) {
    return this.serviceService.updateStatus(id, dto.isActive);
  }

  @Patch(':serviceId/treatment-methods/:methodId')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }

  @Delete(':serviceId/treatment-methods/:methodId')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  removeTreatmentMethod(
    @Param('serviceId') serviceId: string,
    @Param('methodId') methodId: string,
  ) {
    return this.serviceService.removeTreatmentMethod(serviceId, methodId);
  }
}

