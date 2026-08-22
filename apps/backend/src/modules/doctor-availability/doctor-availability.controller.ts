import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AvailabilityApprovalStatus } from '../../../prisma/generated/client';
import { AutoWeeklyAvailabilityDto } from './dto/auto-weekly-availability.dto';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-availability.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-availability.dto';
import { DoctorAvailabilityService } from './doctor-availability.service';

@ApiTags('Doctor Availability')
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
  getMatrix() {
    return this.doctorAvailabilityService.getMatrixForAllDoctors();
  }

  @Get('check-conflicts')
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
  create(
    @Body() dto: CreateDoctorAvailabilityDto,
    @Query('force') force?: string,
  ) {
    return this.doctorAvailabilityService.create(dto, force === 'true');
  }

  @Post('auto-weekly')
  autoCreateWeekly(@Body() dto: AutoWeeklyAvailabilityDto) {
    return this.doctorAvailabilityService.autoCreateWeekly(dto);
  }

  @Patch(':id/approval')
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
  update(@Param('id') id: string, @Body() dto: UpdateDoctorAvailabilityDto) {
    return this.doctorAvailabilityService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('force') force?: string) {
    return this.doctorAvailabilityService.remove(id, force === 'true');
  }
}

