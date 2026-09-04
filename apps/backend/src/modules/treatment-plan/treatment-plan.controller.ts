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
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { UpdateTreatmentPlanStepDto } from './dto/update-treatment-plan-step.dto';
import { TreatmentPlanService } from './treatment-plan.service';

@ApiTags('Treatment Plan')
@ApiBearerAuth()
@Controller(['treatment-plans', 'admin/treatment-plans'])
export class TreatmentPlanController {
  constructor(private service: TreatmentPlanService) {}

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
    @Body() dto: CreateTreatmentPlanDto,
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
    @Body() dto: UpdateTreatmentPlanDto,
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

  @Patch(':id/steps/:stepId')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStep(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateTreatmentPlanStepDto,
  ) {
    return this.service.updateStep(id, stepId, dto, user);
  }

  @Post(':id/send-email')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  sendEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.sendTreatmentPlanEmail(id, user);
  }
}
