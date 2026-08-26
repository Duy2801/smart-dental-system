import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { AiClientService } from './ai-client.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    SocketModule,
    BullModule.registerQueue({ name: 'mail-queue' }),
  ],
  controllers: [AiController],
  providers: [AiClientService, AiService],
  exports: [AiService, AiClientService],
})
export class AiModule {}
