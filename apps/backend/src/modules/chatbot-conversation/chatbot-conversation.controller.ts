import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ChatbotConversationService } from './chatbot-conversation.service';
import { ChatHistoryDto, PatientChatDto } from './dto/chat.dto';
import { ChatbotServiceKeyGuard } from './chatbot-service-key.guard';

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

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getHistory(user);
  }

  @Put('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  putHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChatHistoryDto,
  ) {
    return this.service.putHistory(user, dto);
  }

  @Delete('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteHistory(user);
  }

  @Get('internal/clinic')
  @UseGuards(ChatbotServiceKeyGuard)
  getClinicInternal() {
    return this.service.getInternalClinic();
  }

  @Get('internal/services')
  @UseGuards(ChatbotServiceKeyGuard)
  async getServicesInternal() {
    return this.service.getInternalServices();
  }

  @Get('internal/doctors')
  @UseGuards(ChatbotServiceKeyGuard)
  async getDoctorsInternal() {
    return this.service.getInternalDoctors();
  }

  @Get('internal/patients')
  @UseGuards(ChatbotServiceKeyGuard)
  async getPatientsInternal(@Query('userId') userId: string) {
    return this.service.getInternalPatients(userId);
  }

  @Post('internal/patients')
  @UseGuards(ChatbotServiceKeyGuard)
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
  @UseGuards(ChatbotServiceKeyGuard)
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
  @UseGuards(ChatbotServiceKeyGuard)
  async getAppointmentsInternal(@Query('userId') userId: string) {
    return this.service.getInternalAppointments(userId);
  }

  @Post('internal/book')
  @UseGuards(ChatbotServiceKeyGuard)
  async bookInternal(@Body() body: any) {
    return this.service.bookInternalAppointment(body);
  }
}
