import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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

  @Get('page')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findPageByDoctor(
    @CurrentUser() user: AuthenticatedUser,
    @Query('doctorId') doctorId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('search') search?: string,
    @Query('month') month?: string,
  ) {
    const resolved = await this.service.resolveListDoctorId(user, doctorId);
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safePageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(pageSize, 10) || 10),
    );
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('Tháng lọc không hợp lệ');
    }
    return this.service.findPageByDoctor(
      resolved,
      safePage,
      safePageSize,
      search,
      month,
    );
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(id, user);
  }

  @Post(':id/send-email')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  sendEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.sendPrescriptionToPatient(id, user);
  }
}
