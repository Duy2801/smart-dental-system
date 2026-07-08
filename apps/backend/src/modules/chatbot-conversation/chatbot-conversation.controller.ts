import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Chatbot Conversation')
@Controller('chatbot-conversations')
export class ChatbotConversationController {}
