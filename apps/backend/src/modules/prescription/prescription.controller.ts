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
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionService } from './prescription.service';

@ApiTags('Prescription')
@ApiBearerAuth()
@Controller(['prescriptions', 'admin/prescriptions'])
export class PrescriptionController {
  constructor(private service: PrescriptionService) {}

  @Get()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByDoctor(
    @CurrentUser() user: AuthenticatedUser,
    @Query('doctorId') doctorId?: string,
  ) {
    const resolved = await this.service.resolveListDoctorId(user, doctorId);
    return this.service.findByDoctor(resolved);
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Query('doctorId') doctorId: string | undefined,
    @Body() dto: CreatePrescriptionDto,
  ) {
    const resolved = await this.service.resolveListDoctorId(user, doctorId);
    return this.service.create(resolved, dto, user);
  }

  @Patch(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.remove(id, user);
  }

  @Post(':id/send-email')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  sendEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.sendPrescriptionToPatient(id, user);
  }
}
