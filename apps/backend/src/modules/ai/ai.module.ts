import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { AdminAiController } from './admin-ai.controller';
import { AiClientService } from './ai-client.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { ReceptionistAiController } from './receptionist-ai.controller';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SocketModule,
  ],
  controllers: [AiController, ReceptionistAiController, AdminAiController],
  providers: [AiClientService, AiRateLimitService, AiService],
  exports: [AiService, AiClientService],
})
export class AiModule {}
