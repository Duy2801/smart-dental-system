import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { TreatmentPlanService } from './treatment-plan.service';

@ApiTags('Treatment Plan')
@ApiBearerAuth()
@Controller(['treatment-plans', 'admin/treatment-plans'])
export class TreatmentPlanController {
  constructor(private service: TreatmentPlanService) {}

  @Get()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByDoctor(@Query('doctorId') doctorId: string) {
    return this.service.findByDoctor(doctorId);
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Query('doctorId') doctorId: string,
    @Body()
    dto: {
      patientId: string;
      title: string;
      description?: string;
      startDate?: string;
      expectedEndDate?: string;
      steps?: Array<{
        title: string;
        description?: string;
        targetTooth?: string;
        estimatedCost?: number;
        expectedDate?: string;
      }>;
    },
  ) {
    return this.service.create(doctorId, dto);
  }

  @Patch(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      title?: string;
      description?: string;
      status?: string;
      startDate?: string | null;
      expectedEndDate?: string | null;
      steps?: Array<{
        title: string;
        description?: string;
        targetTooth?: string;
        estimatedCost?: number;
        expectedDate?: string;
      }>;
    },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/steps/:stepId')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body()
    dto: {
      status?: string;
      title?: string;
      description?: string;
      targetTooth?: string;
      estimatedCost?: number;
      expectedDate?: string | null;
    },
  ) {
    return this.service.updateStep(id, stepId, dto);
  }
}
