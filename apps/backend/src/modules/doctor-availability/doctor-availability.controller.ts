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

  @Post()
  create(@Body() dto: CreateDoctorAvailabilityDto) {
    return this.doctorAvailabilityService.create(dto);
  }

  @Post('auto-weekly')
  autoCreateWeekly(@Body() dto: AutoWeeklyAvailabilityDto) {
    return this.doctorAvailabilityService.autoCreateWeekly(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorAvailabilityDto) {
    return this.doctorAvailabilityService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorAvailabilityService.remove(id);
  }
}
