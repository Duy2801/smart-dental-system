import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'secretKey',
        });
        if (payload && payload.userId) {
          client.data.userId = payload.userId;
          client.join(`user_${payload.userId}`);
          this.logger.log(`Socket connected: ${client.id} for user ${payload.userId}`);
          return;
        }
      }
      this.logger.log(`Socket connected (anonymous): ${client.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auth error';
      this.logger.warn(`Socket auth warning: ${message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit(event, payload);
    }
  }

  emitToRoom(room: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(room).emit(event, payload);
    }
  }

  broadcast(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}
