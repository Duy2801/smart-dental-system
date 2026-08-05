import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateStaffAppointmentDto } from './dto/create-staff-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentService } from './appointment.service';

@ApiTags('Appointment')
@ApiBearerAuth()
@Controller(['appointments', 'admin/appointments'])
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createForPatient(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentService.createAppointmentForPatient(
      user.userId,
      dto,
    );
  }

  @Post('staff')
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createForStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStaffAppointmentDto,
  ) {
    return this.appointmentService.createAppointmentForReceptionist(
      user.userId,
      dto,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (
      user.roles.includes('PATIENT') &&
      !user.roles.includes('RECEPTIONIST') &&
      !user.roles.includes('ADMIN')
    ) {
      return this.appointmentService.cancelAppointmentForPatient(
        user.userId,
        id,
      );
    }
    return this.appointmentService.cancelByStaff(id);
  }

  @Patch(':id/reschedule')
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  reschedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const isPatientOnly =
      user.roles.includes('PATIENT') &&
      !user.roles.includes('RECEPTIONIST') &&
      !user.roles.includes('ADMIN');
    if (isPatientOnly) {
      return this.appointmentService.rescheduleAppointmentForPatient(
        user.userId,
        id,
        dto,
      );
    }
    return this.appointmentService.rescheduleByStaff(id, dto);
  }

  @Patch(':id/restore')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  restoreAppointment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.appointmentService.restoreAppointmentForPatient(
      user.userId,
      id,
    );
  }

  @Patch(':id/confirm')
  @Roles('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  confirmAppointment(@Param('id') id: string) {
    return this.appointmentService.confirmAppointment(id);
  }

  @Patch(':id/check-in')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  checkInAppointment(
    @Param('id') id: string,
    @Body() body?: { notes?: string },
  ) {
    return this.appointmentService.checkInAppointment(id, body?.notes);
  }

  @Patch(':id/no-show')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  markNoShow(@Param('id') id: string) {
    return this.appointmentService.markNoShow(id);
  }

  @Patch(':id/start')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  startAppointment(@Param('id') id: string) {
    return this.appointmentService.startAppointment(id);
  }

  @Patch(':id/complete')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  completeAppointment(@Param('id') id: string) {
    return this.appointmentService.completeAppointment(id);
  }

  @Get()
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findMany(
    @Query('doctorId') doctorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
    @Query('search') search?: string,
  ) {
    if (date || search || (from && to && !doctorId)) {
      return this.appointmentService.findByDate({
        date,
        from,
        to,
        doctorId,
        search,
      });
    }
    return this.appointmentService.findByDoctorAndWeek(
      doctorId as string,
      from as string,
      to as string,
    );
  }

  @Get('booking-options')
  getBookingOptions(
    @Query('serviceId') serviceId?: string,
    @Query('treatmentMethodId') treatmentMethodId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    return this.appointmentService.getBookingOptions({
      serviceId,
      treatmentMethodId,
      doctorId,
      date,
      time,
    });
  }

  @Get('upcoming')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findUpcomingForPatient(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentService.findUpcomingForPatient(user.userId);
  }

  @Get('history')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findHistoryForPatient(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentService.findHistoryForPatient(user.userId);
  }

  @Get(':id')
  @Roles('DOCTOR', 'ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }
}
