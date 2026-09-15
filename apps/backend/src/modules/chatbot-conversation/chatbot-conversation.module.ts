import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { PatientModule } from '../patient/patient.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatbotConversationController } from './chatbot-conversation.controller';
import { ChatbotConversationService } from './chatbot-conversation.service';
import { ChatbotServiceKeyGuard } from './chatbot-service-key.guard';

@Module({
  imports: [PrismaModule, AiModule, AppointmentModule, PatientModule],
  controllers: [ChatbotConversationController],
  providers: [ChatbotConversationService, ChatbotServiceKeyGuard],
  exports: [ChatbotConversationService],
})
export class ChatbotConversationModule {}
