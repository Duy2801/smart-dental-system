import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const SUPPORT_STAFF_ROOM = 'support_staff';

export function supportConversationRoom(conversationId: string) {
  return `support_conversation_${conversationId}`;
}

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

  // userId -> set of connected socket ids, tracked only for RECEPTIONIST/ADMIN
  // connections so the support-conversation auto-assign algorithm can tell
  // who is actually online right now.
  private readonly onlineSupportStaff = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'secretKey',
        });
        const userId = payload?.sub;
        if (userId) {
          client.data.userId = userId;
          client.join(`user_${userId}`);
          this.logger.log(`Socket connected: ${client.id} for user ${userId}`);

          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: { select: { code: true } } },
          });
          const roleCode = user?.role.code;
          if (roleCode === 'RECEPTIONIST' || roleCode === 'ADMIN') {
            client.data.isSupportStaff = true;
            client.join(SUPPORT_STAFF_ROOM);
            this.addOnlineStaff(userId, client.id);
          }
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
    const userId = client.data?.userId as string | undefined;
    if (userId && client.data?.isSupportStaff) {
      this.removeOnlineStaff(userId, client.id);
    }
  }

  @SubscribeMessage('support:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId?: string },
  ) {
    if (data?.conversationId) {
      client.join(supportConversationRoom(data.conversationId));
    }
  }

  @SubscribeMessage('support:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId?: string },
  ) {
    if (data?.conversationId) {
      client.leave(supportConversationRoom(data.conversationId));
    }
  }

  private addOnlineStaff(userId: string, socketId: string) {
    const set = this.onlineSupportStaff.get(userId) ?? new Set<string>();
    set.add(socketId);
    this.onlineSupportStaff.set(userId, set);
  }

  private removeOnlineStaff(userId: string, socketId: string) {
    const set = this.onlineSupportStaff.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) this.onlineSupportStaff.delete(userId);
  }

  /** Ids of RECEPTIONIST/ADMIN users with at least one live socket connection. */
  getOnlineSupportStaffIds(): string[] {
    return Array.from(this.onlineSupportStaff.keys());
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
