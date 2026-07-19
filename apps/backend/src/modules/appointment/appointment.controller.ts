import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentService } from './appointment.service';

@ApiTags('Appointment')
@ApiBearerAuth()
@Controller('appointments')
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

  @Patch(':id/cancel')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cancelForPatient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.appointmentService.cancelAppointmentForPatient(user.userId, id);
  }

  @Patch(':id/reschedule')
  @Roles('PATIENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  rescheduleForPatient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentService.rescheduleAppointmentForPatient(
      user.userId,
      id,
      dto,
    );
  }

  @Get('booking-options')
  getBookingOptions(
    @Query('serviceId') serviceId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    return this.appointmentService.getBookingOptions({
      serviceId,
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
}
