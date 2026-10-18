import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis, { type RedisOptions } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

export const SUPPORT_STAFF_ROOM = 'support_staff';

export function supportConversationRoom(conversationId: string) {
  return `support_conversation_${conversationId}`;
}

type SupportSocketData = {
  authReady?: Promise<void>;
  userId?: string;
  roleCode?: string;
  isSupportStaff?: boolean;
};

type SupportSocket = Omit<Socket, 'data'> & { data: SupportSocketData };

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  private redisPublisher?: Redis;
  private redisSubscriber?: Redis;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async afterInit(server: Server) {
    const url = this.config.get<string>('REDIS_URL');
    const options: RedisOptions = {
      username: this.config.get<string>('REDIS_USERNAME') || undefined,
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      tls: this.config.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
      connectTimeout: 10_000,
      maxRetriesPerRequest: 1,
    };
    const publisher = url
      ? new Redis(url, options)
      : new Redis({
          ...options,
          host: this.config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: this.config.get<number>('REDIS_PORT', 6379),
        });
    const subscriber = publisher.duplicate();
    let warningLogged = false;
    const handleRedisError = (error: Error) => {
      if (warningLogged) return;
      warningLogged = true;
      this.logger.warn(`Socket.IO Redis connection warning: ${error.message}`);
    };
    publisher.on('error', handleRedisError);
    subscriber.on('error', handleRedisError);
    publisher.on('ready', () => {
      warningLogged = false;
    });
    try {
      await Promise.all([publisher.ping(), subscriber.ping()]);
      server.adapter(
        createAdapter(publisher, subscriber, {
          publishOnSpecificResponseChannel: true,
        }),
      );
      this.redisPublisher = publisher;
      this.redisSubscriber = subscriber;
      this.logger.log('Socket.IO Redis adapter connected');
    } catch {
      publisher.disconnect();
      subscriber.disconnect();
      this.logger.warn(
        'Socket.IO Redis adapter unavailable; using local adapter',
      );
    }
  }

  onModuleDestroy() {
    this.redisPublisher?.disconnect();
    this.redisSubscriber?.disconnect();
  }

  async handleConnection(client: SupportSocket) {
    client.data.authReady = this.authenticate(client);
    await client.data.authReady;
  }

  private async authenticate(client: SupportSocket) {
    try {
      const authToken: unknown = client.handshake.auth?.token;
      const authorization = client.handshake.headers?.authorization;
      const token =
        typeof authToken === 'string'
          ? authToken
          : typeof authorization === 'string'
            ? authorization.replace(/^Bearer\s+/i, '')
            : undefined;

      if (token) {
        const payload: unknown = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'secretKey',
        });
        const userId =
          payload &&
          typeof payload === 'object' &&
          'sub' in payload &&
          typeof payload.sub === 'string'
            ? payload.sub
            : undefined;
        if (userId) {
          client.data.userId = userId;
          await client.join(`user_${userId}`);
          this.logger.log(`Socket connected: ${client.id} for user ${userId}`);

          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: { select: { code: true } } },
          });
          if (!client.connected) return;
          const roleCode = user?.role.code;
          client.data.roleCode = roleCode;
          if (roleCode === 'RECEPTIONIST' || roleCode === 'ADMIN') {
            client.data.isSupportStaff = true;
            await client.join(SUPPORT_STAFF_ROOM);
          }
          return;
        }
      }
      this.logger.log(`Socket connected (anonymous): ${client.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auth error';
      this.logger.warn(`Socket auth warning: ${message}`);
      client.emit('support:auth_error');
    }
  }

  handleDisconnect(client: SupportSocket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('support:join')
  async handleJoinConversation(
    @ConnectedSocket() client: SupportSocket,
    @MessageBody() data: { conversationId?: string },
  ) {
    await client.data.authReady;
    const userId = client.data.userId;
    if (!userId || !data?.conversationId) return;
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: data.conversationId },
      select: { assignedToId: true, patient: { select: { userId: true } } },
    });
    if (!conversation) return;
    if (
      conversation.patient.userId === userId ||
      conversation.assignedToId === userId ||
      client.data.roleCode === 'ADMIN'
    ) {
      await client.join(supportConversationRoom(data.conversationId));
    }
  }

  @SubscribeMessage('support:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: SupportSocket,
    @MessageBody() data: { conversationId?: string },
  ) {
    if (data?.conversationId) {
      await client.leave(supportConversationRoom(data.conversationId));
    }
  }

  /** Ids of support staff connected across all Socket.IO instances. */
  async getOnlineSupportStaffIds(): Promise<string[]> {
    if (!this.server) return [];
    const sockets = await this.server.in(SUPPORT_STAFF_ROOM).fetchSockets();
    return [
      ...new Set(
        sockets
          .map((socket) => (socket.data as { userId?: string }).userId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  removeUserFromConversation(userId: string, conversationId: string) {
    this.server
      ?.in(`user_${userId}`)
      .socketsLeave(supportConversationRoom(conversationId));
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
