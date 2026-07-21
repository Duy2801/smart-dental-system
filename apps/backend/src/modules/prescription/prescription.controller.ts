import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PrescriptionService } from './prescription.service';

@ApiTags('Prescription')
@ApiBearerAuth()
@Controller(['prescriptions', 'admin/prescriptions'])
export class PrescriptionController {
  constructor(private service: PrescriptionService) {}

  @Get()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByDoctor(@Query('doctorId') doctorId: string) {
    return this.service.findByDoctor(doctorId);
  }

  @Post()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Query('doctorId') doctorId: string,
    @Body()
    dto: {
      patientId: string;
      medicalRecordId: string;
      notes?: string;
      items: Array<{
        medicineName: string;
        dosage: string;
        frequency?: string;
        duration?: string;
        instruction?: string;
      }>;
    },
  ) {
    return this.service.create(doctorId, dto);
  }
}
