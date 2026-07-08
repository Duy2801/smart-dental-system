import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatbotConversationController } from './chatbot-conversation.controller';
import { ChatbotConversationService } from './chatbot-conversation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotConversationController],
  providers: [ChatbotConversationService],
  exports: [ChatbotConversationService],
})
export class ChatbotConversationModule {}
