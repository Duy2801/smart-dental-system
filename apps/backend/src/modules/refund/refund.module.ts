import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
  ],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
