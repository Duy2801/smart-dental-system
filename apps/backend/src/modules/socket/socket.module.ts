import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class SocketModule {}
