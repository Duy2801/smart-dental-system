import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiClientService } from './ai-client.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiClientService, AiService],
  exports: [AiService, AiClientService],
})
export class AiModule {}
