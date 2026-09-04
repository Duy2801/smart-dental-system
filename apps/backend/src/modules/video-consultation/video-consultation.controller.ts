import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateVideoConsultationDto } from './dto/create-video-consultation.dto';
import { UpdateVideoConsultationNotesDto } from './dto/update-video-consultation-notes.dto';
import { VideoConsultationService } from './video-consultation.service';

@ApiTags('Video Consultation')
@ApiBearerAuth()
@Controller(['video-consultations', 'admin/video-consultations'])
export class VideoConsultationController {
  constructor(private service: VideoConsultationService) {}

  @Get('packages')
  @Roles('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getConsultationPackages() {
    return this.service.getConsultationPackages();
  }

  @Get('consultation-doctors')
  @Roles('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findDoctorsForConsultation() {
    return this.service.findDoctorsForConsultation();
  }

  @Get('available-slots')
  @Roles('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('durationMinutes') durationMinutes?: string,
  ) {
    const duration = durationMinutes ? parseInt(durationMinutes, 10) : 30;
    return this.service.getAvailableSlots(doctorId, date, duration);
  }

  @Get('patient/my-consultations')
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByPatient(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findByPatient(user);
  }

  @Post('booking')
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVideoConsultationDto,
  ) {
    return this.service.createBooking(user, dto);
  }

  @Patch('patient/:id/cancel')
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cancelBookingByPatient(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancelBookingByPatient(user, id);
  }

  @Get('patient/:id/payment-info')
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getPaymentInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getConsultationPaymentInfo(user, id);
  }

  @Post('patient/:id/join')
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  joinPatientRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.joinPatientRoom(user, id);
  }

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
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/start')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.start(id, user);
  }

  @Patch(':id/complete')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.complete(id, user);
  }

  @Patch(':id/cancel')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(id, user);
  }

  @Patch(':id/notes')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateVideoConsultationNotesDto,
  ) {
    return this.service.updateNotes(id, user, body.notes ?? null);
  }

  @Post(':id/send-reminder')
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  sendReminder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.sendConsultationReminderToPatient(id, user);
  }
}
