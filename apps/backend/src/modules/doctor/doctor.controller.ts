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
import { CreateDoctorDto } from './dto/create-doctor-dto';
import { UpdateDoctorDto } from './dto/update-doctor-dto';
import { DoctorService } from './doctor.service';

@ApiTags('Doctor')
@Controller(['doctors', 'admin/doctors'])
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('specializationId') specializationId?: string,
    @Query('view') view?: 'full' | 'summary',
  ) {
    return this.doctorService.getAllDoctors(
      serviceId,
      specializationId,
      view === 'summary' ? 'summary' : 'full',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorService.createDoctor(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorService.updateDoctor(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorService.deleteDoctor(id);
  }
}
