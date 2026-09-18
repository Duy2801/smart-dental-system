import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventsGateway,
  supportConversationRoom,
  SUPPORT_STAFF_ROOM,
} from '../socket/events.gateway';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

// How long an auto-assigned conversation waits for the assigned staff
// member to send their first message before it gets requeued so someone
// else can claim it manually.
const AUTO_ASSIGN_TIMEOUT_MS = 90_000;

// Soft cap so an auto-assign doesn't keep piling every new conversation on
// the only online receptionist. Once someone hits this many concurrently
// assigned conversations they're skipped by the algorithm (not blocked from
// claiming manually).
const MAX_CONCURRENT_ASSIGNED = 6;

@Injectable()
export class SupportConversationService {
  private readonly logger = new Logger(SupportConversationService.name);

  // conversationId -> pending requeue timer, cleared once the assigned
  // staff member sends a message or the conversation is claimed/closed.
  private readonly pendingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async resolvePatientId(userId: string): Promise<string> {
    const patient = await this.prisma.patient.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('support_conversation.patient_not_found');
    }
    return patient.id;
  }

  private isStaff(user: AuthenticatedUser) {
    return user.roles.some(
      (role) => role === 'RECEPTIONIST' || role === 'ADMIN',
    );
  }

  /**
   * Patients without a linked User account (walk-in profiles created by
   * reception) can't have a socket session, so this is a no-op for them.
   */
  private notifyPatient(
    conversation: { patient: { userId: string | null } },
    event: string,
    payload: unknown,
  ) {
    const patientUserId = conversation.patient.userId;
    if (patientUserId) {
      this.eventsGateway.emitToUser(patientUserId, event, payload);
    }
  }

  private conversationSelect = {
    id: true,
    patientId: true,
    status: true,
    assignedToId: true,
    assignedAt: true,
    lastMessageAt: true,
    createdAt: true,
    closedAt: true,
    patient: {
      select: { id: true, userId: true, fullName: true, phone: true, email: true },
    },
    assignedTo: { select: { id: true, fullName: true } },
  } as const;

  /**
   * Returns the patient's currently open conversation (WAITING/ASSIGNED)
   * without creating anything — used when the chat panel opens so an empty
   * "I want to chat" click doesn't create a row or notify staff by itself.
   */
  async getCurrentForPatient(userId: string) {
    const patientId = await this.resolvePatientId(userId);
    return this.prisma.supportConversation.findFirst({
      where: { patientId, status: { in: ['WAITING', 'ASSIGNED'] } },
      orderBy: { createdAt: 'desc' },
      select: this.conversationSelect,
    });
  }

  /**
   * Returns the patient's currently open conversation if one exists,
   * otherwise creates a new (empty, WAITING, unassigned) one. Staff are not
   * notified and auto-assign does not run yet — that only happens once the
   * patient actually sends a first message (see `sendMessage`), so nobody
   * gets assigned a conversation with nothing to respond to.
   */
  async getOrCreateForPatient(userId: string) {
    const existing = await this.getCurrentForPatient(userId);
    if (existing) return existing;

    const patientId = await this.resolvePatientId(userId);
    return this.prisma.supportConversation.create({
      data: { patientId },
      select: this.conversationSelect,
    });
  }

  /** Least-workload auto-assignment among currently online staff. */
  private async autoAssign(conversationId: string) {
    const onlineStaffIds = this.eventsGateway.getOnlineSupportStaffIds();
    if (onlineStaffIds.length === 0) return null;

    const workloadCounts = await this.prisma.supportConversation.groupBy({
      by: ['assignedToId'],
      where: { assignedToId: { in: onlineStaffIds }, status: 'ASSIGNED' },
      _count: { _all: true },
    });
    const workloadByStaff = new Map<string, number>(
      onlineStaffIds.map((id) => [id, 0]),
    );
    for (const row of workloadCounts) {
      if (row.assignedToId) workloadByStaff.set(row.assignedToId, row._count._all);
    }

    const eligible = onlineStaffIds.filter(
      (id) => (workloadByStaff.get(id) ?? 0) < MAX_CONCURRENT_ASSIGNED,
    );
    if (eligible.length === 0) return null;

    const minLoad = Math.min(...eligible.map((id) => workloadByStaff.get(id) ?? 0));
    const candidates = eligible.filter(
      (id) => (workloadByStaff.get(id) ?? 0) === minLoad,
    );
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    return this.assignTo(conversationId, chosen, { auto: true });
  }

  /** Manual claim from the "unclaimed" queue — atomic so two staff can't both win. */
  async claim(conversationId: string, user: AuthenticatedUser) {
    if (!this.isStaff(user)) {
      throw new ForbiddenException('support_conversation.staff_only');
    }
    const result = await this.assignTo(conversationId, user.userId, {
      auto: false,
    });
    if (!result) {
      throw new ConflictException('support_conversation.already_claimed');
    }
    return result;
  }

  private async assignTo(
    conversationId: string,
    staffUserId: string,
    { auto }: { auto: boolean },
  ) {
    const { count } = await this.prisma.supportConversation.updateMany({
      where: { id: conversationId, status: 'WAITING' },
      data: { status: 'ASSIGNED', assignedToId: staffUserId, assignedAt: new Date() },
    });
    if (count === 0) return null;

    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: this.conversationSelect,
    });
    if (!conversation) return null;

    this.eventsGateway.emitToRoom(SUPPORT_STAFF_ROOM, 'support:claimed', {
      conversationId,
      assignedTo: conversation.assignedTo,
    });
    this.eventsGateway.emitToUser(staffUserId, 'support:assigned', conversation);
    this.notifyPatient(conversation, 'support:assigned', conversation);

    if (auto) {
      this.scheduleTimeout(conversationId, staffUserId);
    } else {
      this.clearTimeout(conversationId);
    }

    return conversation;
  }

  private scheduleTimeout(conversationId: string, staffUserId: string) {
    this.clearTimeout(conversationId);
    const timer = setTimeout(() => {
      void this.requeueIfUnanswered(conversationId, staffUserId);
    }, AUTO_ASSIGN_TIMEOUT_MS);
    this.pendingTimeouts.set(conversationId, timer);
  }

  private clearTimeout(conversationId: string) {
    const timer = this.pendingTimeouts.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      this.pendingTimeouts.delete(conversationId);
    }
  }

  private async requeueIfUnanswered(conversationId: string, staffUserId: string) {
    this.pendingTimeouts.delete(conversationId);

    const hasStaffReply = await this.prisma.supportMessage.findFirst({
      where: { conversationId, senderType: 'STAFF' },
      select: { id: true },
    });
    if (hasStaffReply) return;

    const { count } = await this.prisma.supportConversation.updateMany({
      where: { id: conversationId, status: 'ASSIGNED', assignedToId: staffUserId },
      data: { status: 'WAITING', assignedToId: null, assignedAt: null },
    });
    if (count === 0) return;

    this.logger.log(
      `Conversation ${conversationId} requeued: staff ${staffUserId} did not respond in time`,
    );
    this.eventsGateway.emitToUser(staffUserId, 'support:requeued', { conversationId });
    this.eventsGateway.emitToRoom(SUPPORT_STAFF_ROOM, 'support:new', {
      id: conversationId,
      requeued: true,
    });
  }

  async listUnclaimed() {
    return this.prisma.supportConversation.findMany({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      select: this.conversationSelect,
    });
  }

  async listMine(user: AuthenticatedUser) {
    if (!this.isStaff(user)) {
      throw new ForbiddenException('support_conversation.staff_only');
    }
    const conversations = await this.prisma.supportConversation.findMany({
      where: { assignedToId: user.userId, status: 'ASSIGNED' },
      orderBy: { lastMessageAt: 'desc' },
      select: this.conversationSelect,
    });

    const unreadCounts = await this.prisma.supportMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderType: 'PATIENT',
        readAt: null,
      },
      _count: { _all: true },
    });
    const unreadByConversation = new Map(
      unreadCounts.map((row) => [row.conversationId, row._count._all]),
    );

    return conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    }));
  }

  private async assertAccess(conversationId: string, user: AuthenticatedUser) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: this.conversationSelect,
    });
    if (!conversation) {
      throw new NotFoundException('support_conversation.not_found');
    }

    if (user.roles.includes('ADMIN')) return conversation;

    if (this.isStaff(user)) {
      if (conversation.assignedToId !== user.userId) {
        throw new ForbiddenException('support_conversation.not_assigned_to_you');
      }
      return conversation;
    }

    const patientId = await this.resolvePatientId(user.userId);
    if (conversation.patientId !== patientId) {
      throw new ForbiddenException('support_conversation.unauthorized_access');
    }
    return conversation;
  }

  async getMessages(conversationId: string, user: AuthenticatedUser, limit = 50) {
    await this.assertAccess(conversationId, user);
    const messages = await this.prisma.supportMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
    return messages.reverse();
  }

  async sendMessage(
    conversationId: string,
    user: AuthenticatedUser,
    content: string,
  ) {
    const conversation = await this.assertAccess(conversationId, user);
    if (conversation.status === 'CLOSED') {
      throw new BadRequestException('support_conversation.already_closed');
    }

    const isStaffSender = this.isStaff(user);
    const message = await this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderType: isStaffSender ? 'STAFF' : 'PATIENT',
        senderId: user.userId,
        content,
      },
    });

    await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    if (isStaffSender) {
      this.clearTimeout(conversationId);
    } else if (conversation.status === 'WAITING') {
      // First message from the patient on a still-unassigned conversation:
      // this is the moment staff should actually learn about it and the
      // auto-assign algorithm should run — not at the earlier "I want to
      // chat" click, which may never turn into a real question.
      const messageCount = await this.prisma.supportMessage.count({
        where: { conversationId },
      });
      if (messageCount === 1) {
        this.eventsGateway.emitToRoom(SUPPORT_STAFF_ROOM, 'support:new', conversation);
        await this.autoAssign(conversationId);
      }
    }

    this.eventsGateway.emitToRoom(
      supportConversationRoom(conversationId),
      'support:message',
      message,
    );
    // Also deliver to whichever side isn't currently viewing the thread so
    // the receptionist's conversation list (and the patient widget) can
    // update its badge/preview without having that room open.
    if (conversation.assignedToId) {
      this.eventsGateway.emitToUser(conversation.assignedToId, 'support:message', message);
    }
    this.notifyPatient(conversation, 'support:message', message);

    return message;
  }

  async markRead(conversationId: string, user: AuthenticatedUser) {
    await this.assertAccess(conversationId, user);
    await this.prisma.supportMessage.updateMany({
      where: { conversationId, senderType: 'PATIENT', readAt: null },
      data: { readAt: new Date() },
    });
    this.eventsGateway.emitToRoom(
      supportConversationRoom(conversationId),
      'support:read',
      { conversationId },
    );
    return { success: true };
  }

  async close(conversationId: string, user: AuthenticatedUser) {
    const conversation = await this.assertAccess(conversationId, user);
    if (!this.isStaff(user)) {
      throw new ForbiddenException('support_conversation.staff_only');
    }

    this.clearTimeout(conversationId);
    const closed = await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: 'CLOSED', closedAt: new Date() },
      select: this.conversationSelect,
    });
    await this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderType: 'SYSTEM',
        content: 'Hội thoại đã được đóng.',
      },
    });

    this.eventsGateway.emitToRoom(
      supportConversationRoom(conversationId),
      'support:closed',
      { conversationId },
    );
    this.notifyPatient(conversation, 'support:closed', { conversationId });

    return closed;
  }
}
