import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
    }),
    PrismaModule,
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class SocketModule {}
