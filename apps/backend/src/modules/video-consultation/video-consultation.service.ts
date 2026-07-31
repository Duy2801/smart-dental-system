import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { VideoConsultationStatus } from '../../../prisma/generated/enums';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
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

type ConsultRow = {
  id: string;
  patientId: string;
  doctorId: string;
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
    medicalHistory?: string | null;
    user: { fullName: string; phone: string | null };
  };
};

/** meetingUrl DB format: `https://meet.jit.si/RoomName#sdsPin=123456` */
function packMeeting(roomSlug: string, pin: string) {
  return `https://meet.jit.si/${roomSlug}#sdsPin=${pin}`;
}

function unpackMeeting(raw: string | null): {
  meetingUrl: string | null;
  roomPin: string | null;
} {
  if (!raw) return { meetingUrl: null, roomPin: null };
  const [base, hash = ''] = raw.split('#');
  const pinMatch = /(?:^|&)sdsPin=(\d{6})(?:&|$)/.exec(hash);
  return {
    meetingUrl: base || null,
    roomPin: pinMatch?.[1] ?? null,
  };
}

@Injectable()
export class VideoConsultationService {
  constructor(private prisma: PrismaService) {}

  async findByDoctor(user: AuthenticatedUser, doctorIdQuery?: string) {
    const doctorId = await this.resolveDoctorIdForList(user, doctorIdQuery);

    const rows = await this.prisma.videoConsultation.findMany({
      where: { doctorId },
      include: consultInclude,
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((row) => this.toSummary(row, false));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user);

    const chats = await this.prisma.chatbotConversation.findMany({
      where: { patientId: row.patientId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return {
      ...this.toSummary(row, true),
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

  async start(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    if (
      row.status !== VideoConsultationStatus.SCHEDULED &&
      row.status !== VideoConsultationStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Chỉ có thể bắt đầu buổi tư vấn đang chờ hoặc đang diễn ra',
      );
    }

    // Phòng mới mỗi lần start từ SCHEDULED; giữ nguyên nếu đã IN_PROGRESS còn URL
    let meetingUrl = row.meetingUrl;
    if (row.status === VideoConsultationStatus.SCHEDULED || !meetingUrl) {
      const roomSlug = `SmartDental${randomUUID().replace(/-/g, '')}`;
      const pin = String(randomInt(100000, 1000000));
      meetingUrl = packMeeting(roomSlug, pin);
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.IN_PROGRESS,
        meetingUrl,
      },
      include: consultInclude,
    });
    return this.toSummary(updated, true);
  }

  async complete(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    if (row.status !== VideoConsultationStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Chỉ có thể kết thúc buổi tư vấn đang diễn ra',
      );
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.COMPLETED,
        // Hết hạn phòng: xoá URL + PIN đã pack
        meetingUrl: null,
      },
      include: consultInclude,
    });
    return this.toSummary(updated, true);
  }

  async updateNotes(id: string, user: AuthenticatedUser, notes: string | null) {
    await this.getAuthorizedRow(id, user, { doctorOnly: true });

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: { notes },
      include: consultInclude,
    });
    return this.toSummary(updated, true);
  }

  /** DOCTOR: luôn dùng hồ sơ bác sĩ của token. ADMIN: cho phép query doctorId. */
  private async resolveDoctorIdForList(
    user: AuthenticatedUser,
    doctorIdQuery?: string,
  ) {
    if (user.roles.includes('ADMIN') && doctorIdQuery) {
      return doctorIdQuery;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!doctor) {
      throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
    }

    if (
      doctorIdQuery &&
      doctorIdQuery !== doctor.id &&
      !user.roles.includes('ADMIN')
    ) {
      throw new ForbiddenException(
        'Không được xem lịch tư vấn của bác sĩ khác',
      );
    }

    return doctor.id;
  }

  private async getAuthorizedRow(
    id: string,
    user: AuthenticatedUser,
    opts?: { doctorOnly?: boolean },
  ): Promise<ConsultRow> {
    const row = await this.prisma.videoConsultation.findUnique({
      where: { id },
      include: consultInclude,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy buổi tư vấn');
    }

    if (user.roles.includes('ADMIN')) {
      return row;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (doctor && doctor.id === row.doctorId) {
      return row;
    }

    if (!opts?.doctorOnly) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (patient && patient.id === row.patientId) {
        return row;
      }
    }

    throw new ForbiddenException('Bạn không có quyền truy cập buổi tư vấn này');
  }

  /**
   * meetingUrl / roomPin chỉ trả khi buổi đang IN_PROGRESS.
   * List luôn ẩn secrets.
   */
  private toSummary(row: ConsultRow, includeSecrets: boolean) {
    const active = row.status === VideoConsultationStatus.IN_PROGRESS;
    const secrets =
      includeSecrets && active
        ? unpackMeeting(row.meetingUrl)
        : { meetingUrl: null, roomPin: null };

    return {
      id: row.id,
      patientId: row.patientId,
      patientName: row.patient.user.fullName,
      patientCode: row.patient.patientCode,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      status: row.status,
      meetingUrl: secrets.meetingUrl,
      roomPin: secrets.roomPin,
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
        const role = typeof msg.role === 'string' ? msg.role : 'assistant';
        const content = typeof msg.content === 'string' ? msg.content : '';
        if (!content) return null;
        return { role, content };
      })
      .filter((m): m is { role: string; content: string } => m !== null);
  }
}
