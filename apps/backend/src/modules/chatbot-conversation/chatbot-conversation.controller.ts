import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { ChatbotConversationService } from './chatbot-conversation.service';
import { PatientChatDto } from './dto/chat.dto';

@ApiTags('Chatbot Conversation')
@Controller('chatbot-conversations')
export class ChatbotConversationController {
  constructor(private readonly service: ChatbotConversationService) {}

  @Post('chat')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async chat(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: PatientChatDto,
  ) {
    return this.service.handlePatientChat(user, dto);
  }

  @Post('public-chat')
  async publicChat(@Body() dto: PatientChatDto) {
    return this.service.handlePatientChat(null, dto);
  }

  /** Booking Agent — bệnh nhân đã đăng nhập */
  @Post('agent-chat')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async agentChat(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: PatientChatDto,
  ) {
    return this.service.handlePatientAgentChat(user, dto);
  }

  /** Booking Agent — không cần đăng nhập */
  @Post('public-agent-chat')
  async publicAgentChat(@Body() dto: PatientChatDto) {
    return this.service.handlePatientAgentChat(null, dto);
  }

  @Get('internal/services')
  async getServicesInternal() {
    return this.service.getInternalServices();
  }

  @Get('internal/doctors')
  async getDoctorsInternal() {
    return this.service.getInternalDoctors();
  }

  @Get('internal/patients')
  async getPatientsInternal(@Query('userId') userId: string) {
    return this.service.getInternalPatients(userId);
  }

  @Post('internal/patients')
  async createPatientInternal(@Body() body: any) {
    return this.service.createInternalPatient(body.userId, {
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      phone: body.phone,
      relationship: body.relationship,
    });
  }

  @Get('internal/slots')
  async getSlotsInternal(
    @Query('date') date: string,
    @Query('doctorId') doctorId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('treatmentMethodId') treatmentMethodId?: string,
    @Query('time') time?: string,
  ) {
    return this.service.getInternalSlots({
      date,
      doctorId,
      serviceId,
      treatmentMethodId,
      time,
    });
  }

  @Get('internal/appointments')
  async getAppointmentsInternal(@Query('userId') userId: string) {
    return this.service.getInternalAppointments(userId);
  }

  @Post('internal/book')
  async bookInternal(@Body() body: any) {
    return this.service.bookInternalAppointment(body);
  }
}
