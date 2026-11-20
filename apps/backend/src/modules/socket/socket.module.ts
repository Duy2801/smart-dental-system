import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
  imports: [
    // Secret được truyền khi verify (lấy từ ConfigService), không dùng giá trị mặc định
    JwtModule.register({}),
    PrismaModule,
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class SocketModule {}
