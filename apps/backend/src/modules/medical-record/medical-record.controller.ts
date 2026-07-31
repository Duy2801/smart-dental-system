import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { MedicalRecordService } from './medical-record.service';

@ApiTags('Medical Record')
@ApiBearerAuth()
@Controller(['medical-records', 'admin/medical-records'])
export class MedicalRecordController {
  constructor(private service: MedicalRecordService) {}

  @Get()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByDoctor(
    @Query('doctorId') doctorId: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.service.findByDoctor(doctorId, patientId);
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      chiefComplaint?: string;
      diagnosis?: string;
      treatmentNotes?: string;
      internalNotes?: string;
      followUpDate?: string | null;
    },
  ) {
    return this.service.update(id, dto);
  }
}
