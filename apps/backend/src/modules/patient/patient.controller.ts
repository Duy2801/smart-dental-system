import {
  Body,
  Controller,
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
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientService } from './patient.service';

@ApiTags('Patient')
@ApiBearerAuth()
@Controller(['patients', 'admin/patients'])
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('me/records')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMyRecords(@CurrentUser() user: AuthenticatedUser) {
    return this.patientService.getMyRecords(user.userId);
  }

  @Patch('me')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientService.updateMyProfile(user.userId, dto);
  }

  @Get()
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('search') search?: string,
  ) {
    if (doctorId) {
      return this.patientService.findPatientsByDoctor(doctorId);
    }
    return this.patientService.findPatients(search);
  }

  @Post()
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreatePatientDto) {
    return this.patientService.createPatient(dto);
  }

  @Patch(':id')
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.updatePatient(id, dto);
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(
    @Param('id') id: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.patientService.findPatientDetail(id, doctorId);
  }
}
