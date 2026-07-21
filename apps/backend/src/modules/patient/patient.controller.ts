import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
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

  @Get()
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByDoctor(@Query('doctorId') doctorId: string) {
    return this.patientService.findPatientsByDoctor(doctorId);
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
