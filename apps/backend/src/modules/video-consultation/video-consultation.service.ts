import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VideoConsultationStatus } from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';

const consultInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      medicalHistory: true,
      user: { select: { fullName: true, phone: true } },
    },
  },
} as const;

@Injectable()
export class VideoConsultationService {
  constructor(private prisma: PrismaService) {}

  async findByDoctor(doctorId: string) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }

    const rows = await this.prisma.videoConsultation.findMany({
      where: { doctorId },
      include: consultInclude,
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((row) => this.toSummary(row));
  }

  async findOne(id: string) {
    const row = await this.prisma.videoConsultation.findUnique({
      where: { id },
      include: consultInclude,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy buổi tư vấn');
    }

    const chats = await this.prisma.chatbotConversation.findMany({
      where: { patientId: row.patientId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return {
      ...this.toSummary(row),
      patientPhone: row.patient.user.phone,
      medicalHistory: row.patient.medicalHistory,
      chatbotSessions: chats.map((c) => ({
        id: c.id,
        status: c.status,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        messages: this.normalizeMessages(c.messages),
      })),
    };
  }

  async start(id: string) {
    const row = await this.prisma.videoConsultation.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Không tìm thấy buổi tư vấn');
    if (
      row.status !== VideoConsultationStatus.SCHEDULED &&
      row.status !== VideoConsultationStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Chỉ có thể bắt đầu buổi tư vấn đang chờ hoặc đang diễn ra',
      );
    }

    const meetingUrl = `https://meet.jit.si/smartdental-${id.replace(/-/g, '').slice(0, 16)}`;

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.IN_PROGRESS,
        meetingUrl,
      },
      include: consultInclude,
    });
    return this.toSummary(updated);
  }

  async complete(id: string) {
    const row = await this.prisma.videoConsultation.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Không tìm thấy buổi tư vấn');
    if (row.status !== VideoConsultationStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Chỉ có thể kết thúc buổi tư vấn đang diễn ra',
      );
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: { status: VideoConsultationStatus.COMPLETED },
      include: consultInclude,
    });
    return this.toSummary(updated);
  }

  async updateNotes(id: string, notes: string | null) {
    const exists = await this.prisma.videoConsultation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy buổi tư vấn');

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: { notes },
      include: consultInclude,
    });
    return this.toSummary(updated);
  }

  private toSummary(row: {
    id: string;
    patientId: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: VideoConsultationStatus;
    meetingUrl: string | null;
    fee: unknown;
    isPaid: boolean;
    notes: string | null;
    createdAt: Date;
    patient: {
      patientCode: string;
      user: { fullName: string; phone: string | null };
    };
  }) {
    return {
      id: row.id,
      patientId: row.patientId,
      patientName: row.patient.user.fullName,
      patientCode: row.patient.patientCode,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      status: row.status,
      meetingUrl: row.meetingUrl,
      fee: Number(row.fee),
      isPaid: row.isPaid,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  private normalizeMessages(raw: unknown): {
    role: string;
    content: string;
  }[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const msg = item as Record<string, unknown>;
        const role =
          typeof msg.role === 'string' ? msg.role : 'assistant';
        const content =
          typeof msg.content === 'string' ? msg.content : '';
        if (!content) return null;
        return { role, content };
      })
      .filter((m): m is { role: string; content: string } => m !== null);
  }
}
