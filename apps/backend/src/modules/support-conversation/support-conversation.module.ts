import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportConversationController } from './support-conversation.controller';
import { SupportConversationService } from './support-conversation.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupportConversationController],
  providers: [SupportConversationService],
  exports: [SupportConversationService],
})
export class SupportConversationModule {}
