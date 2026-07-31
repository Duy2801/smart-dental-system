import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { VideoConsultationService } from './video-consultation.service';

@ApiTags('Video Consultation')
@ApiBearerAuth()
@Controller(['video-consultations', 'admin/video-consultations'])
export class VideoConsultationController {
  constructor(private service: VideoConsultationService) {}

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

  @Patch(':id/start')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  start(@Param('id') id: string) {
    return this.service.start(id);
  }

  @Patch(':id/complete')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Patch(':id/notes')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateNotes(
    @Param('id') id: string,
    @Body() body: { notes?: string | null },
  ) {
    return this.service.updateNotes(id, body.notes ?? null);
  }
}
