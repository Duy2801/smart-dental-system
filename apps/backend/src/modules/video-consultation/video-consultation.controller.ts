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
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { VideoConsultationService } from './video-consultation.service';

@ApiTags('Video Consultation')
@ApiBearerAuth()
@Controller(['video-consultations', 'admin/video-consultations'])
export class VideoConsultationController {
  constructor(private service: VideoConsultationService) {}

  @Get()
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByDoctor(
    @CurrentUser() user: AuthenticatedUser,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.service.findByDoctor(user, doctorId);
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN', 'PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/start')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  start(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.start(id, user);
  }

  @Patch(':id/complete')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.complete(id, user);
  }

  @Patch(':id/notes')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateNotes(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { notes?: string | null },
  ) {
    return this.service.updateNotes(id, user, body.notes ?? null);
  }
}
