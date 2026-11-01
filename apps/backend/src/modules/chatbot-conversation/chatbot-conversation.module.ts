import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { PatientModule } from '../patient/patient.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatbotConversationController } from './chatbot-conversation.controller';
import { ChatbotConversationService } from './chatbot-conversation.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    AppointmentModule,
    PatientModule,
    ClinicConfigModule,
  ],
  controllers: [ChatbotConversationController],
  providers: [ChatbotConversationService],
  exports: [ChatbotConversationService],
})
export class ChatbotConversationModule {}
