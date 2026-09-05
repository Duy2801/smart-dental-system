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
import { AvailabilityApprovalStatus } from '../../../prisma/generated/client';
import { AutoWeeklyAvailabilityDto } from './dto/auto-weekly-availability.dto';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-availability.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-availability.dto';
import { DoctorAvailabilityService } from './doctor-availability.service';

@ApiTags('Doctor Availability')
@ApiBearerAuth()
@Controller(['doctor-availability', 'admin/doctor-availability'])
export class DoctorAvailabilityController {
  constructor(
    private readonly doctorAvailabilityService: DoctorAvailabilityService,
  ) {}

  @Get()
  findByDoctor(@Query('doctorId') doctorId: string) {
    return this.doctorAvailabilityService.findByDoctor(doctorId);
  }

  @Get('matrix')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMatrix() {
    return this.doctorAvailabilityService.getMatrixForAllDoctors();
  }

  @Get('check-conflicts')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  checkConflicts(
    @Query('doctorId') doctorId: string,
    @Query('specificDate') specificDate?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.doctorAvailabilityService.checkConflicts({
      doctorId,
      specificDate,
      dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : undefined,
      startTime: startTime ?? '00:00',
      endTime: endTime ?? '23:59',
    });
  }

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDoctorAvailabilityDto,
    @Query('force') force?: string,
  ) {
    return this.doctorAvailabilityService.create(user, dto, force === 'true');
  }

  @Post('auto-weekly')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  autoCreateWeekly(@Body() dto: AutoWeeklyAvailabilityDto) {
    return this.doctorAvailabilityService.autoCreateWeekly(dto);
  }

  @Patch(':id/approval')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateApproval(
    @Param('id') id: string,
    @Body('approvalStatus') approvalStatus: AvailabilityApprovalStatus,
  ) {
    return this.doctorAvailabilityService.updateApprovalStatus(
      id,
      approvalStatus,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateDoctorAvailabilityDto) {
    return this.doctorAvailabilityService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string, @Query('force') force?: string) {
    return this.doctorAvailabilityService.remove(id, force === 'true');
  }
}


