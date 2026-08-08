import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AiClientService } from './ai-client.service';
import { DraftMedicalRecordDto } from './dto/draft-medical-record.dto';
import { SummarizePatientDto } from './dto/summarize-patient.dto';

type AiSummarizeResponse = {
  bullet_points: string[];
  questions_to_ask: string[];
  risk_flags: string[];
  disclaimer: string;
};

type AiDraftResponse = {
  chief_complaint: string | null;
  diagnosis_draft: string | null;
  treatment_notes_draft: string | null;
  disclaimer: string;
};

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClientService,
  ) {}

  async summarizePatient(user: AuthenticatedUser, dto: SummarizePatientDto) {
    if (!dto.consultationId && !dto.patientId) {
      throw new BadRequestException(
        'Cần consultationId hoặc patientId',
      );
    }

    const ctx = await this.resolvePatientContext(user, dto);
    const raw = await this.aiClient.post<AiSummarizeResponse>(
      '/api/v1/doctor/summarize-patient',
      {
        patient_name: ctx.patientName,
        medical_history: ctx.medicalHistory,
        chatbot_messages: ctx.chatbotMessages,
        recent_diagnoses: ctx.recentDiagnoses,
        upcoming_service: ctx.upcomingService,
      },
    );

    return {
      patientId: ctx.patientId,
      patientName: ctx.patientName,
      bulletPoints: raw.bullet_points ?? [],
      questionsToAsk: raw.questions_to_ask ?? [],
      riskFlags: raw.risk_flags ?? [],
      disclaimer:
        raw.disclaimer ||
        'AI hỗ trợ chuẩn bị khám — quyết định lâm sàng thuộc bác sĩ.',
    };
  }

  async draftMedicalRecord(user: AuthenticatedUser, dto: DraftMedicalRecordDto) {
    let chatbotSummary = dto.chatbotSummary?.trim() || null;
    let serviceName = dto.serviceName?.trim() || null;

    if (dto.patientId) {
      await this.assertDoctorCanAccessPatient(user, dto.patientId);
      if (!chatbotSummary) {
        chatbotSummary = await this.buildChatbotSummary(dto.patientId);
      }
    }

    const raw = await this.aiClient.post<AiDraftResponse>(
      '/api/v1/doctor/draft-medical-record',
      {
        chief_complaint: dto.chiefComplaint ?? null,
        chatbot_summary: chatbotSummary,
        service_name: serviceName,
        doctor_notes_hint: dto.doctorNotesHint ?? null,
      },
    );

    return {
      chiefComplaint: raw.chief_complaint,
      diagnosisDraft: raw.diagnosis_draft,
      treatmentNotesDraft: raw.treatment_notes_draft,
      disclaimer:
        raw.disclaimer ||
        'Bản nháp AI — bác sĩ chỉnh sửa và xác nhận trước khi lưu.',
    };
  }

  private async resolvePatientContext(
    user: AuthenticatedUser,
    dto: SummarizePatientDto,
  ) {
    if (dto.consultationId) {
      const row = await this.prisma.videoConsultation.findUnique({
        where: { id: dto.consultationId },
        include: {
          patient: {
            select: {
              id: true,
              medicalHistory: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
      if (!row) throw new NotFoundException('Không tìm thấy buổi tư vấn');
      await this.assertDoctorOwnsConsult(user, row.doctorId);

      const [chatbotMessages, recentDiagnoses] = await Promise.all([
        this.loadChatMessages(row.patientId),
        this.loadRecentDiagnoses(row.patientId),
      ]);

      return {
        patientId: row.patientId,
        patientName: row.patient.user.fullName,
        medicalHistory: row.patient.medicalHistory,
        chatbotMessages,
        recentDiagnoses,
        upcomingService: 'Tư vấn trực tuyến',
      };
    }

    const patientId = dto.patientId!;
    await this.assertDoctorCanAccessPatient(user, patientId);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        medicalHistory: true,
        user: { select: { fullName: true } },
      },
    });
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân');

    const [chatbotMessages, recentDiagnoses] = await Promise.all([
      this.loadChatMessages(patientId),
      this.loadRecentDiagnoses(patientId),
    ]);

    return {
      patientId,
      patientName: patient.user.fullName,
      medicalHistory: patient.medicalHistory,
      chatbotMessages,
      recentDiagnoses,
      upcomingService: null as string | null,
    };
  }

  private async assertDoctorOwnsConsult(
    user: AuthenticatedUser,
    doctorId: string,
  ) {
    if (user.roles.includes('ADMIN')) return;
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!doctor || doctor.id !== doctorId) {
      throw new ForbiddenException('Không có quyền với buổi tư vấn này');
    }
  }

  private async assertDoctorCanAccessPatient(
    user: AuthenticatedUser,
    patientId: string,
  ) {
    if (user.roles.includes('ADMIN')) return;

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!doctor) {
      throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
    }

    const linked = await this.prisma.videoConsultation.findFirst({
      where: { doctorId: doctor.id, patientId },
      select: { id: true },
    });
    if (linked) return;

    const appt = await this.prisma.appointment.findFirst({
      where: { doctorId: doctor.id, patientId },
      select: { id: true },
    });
    if (appt) return;

    throw new ForbiddenException('Không có quyền xem bệnh nhân này');
  }

  private async loadChatMessages(patientId: string) {
    const chats = await this.prisma.chatbotConversation.findMany({
      where: { patientId },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    const out: { role: string; content: string }[] = [];
    for (const c of chats) {
      if (!Array.isArray(c.messages)) continue;
      for (const item of c.messages) {
        if (!item || typeof item !== 'object') continue;
        const msg = item as Record<string, unknown>;
        const role = typeof msg.role === 'string' ? msg.role : 'assistant';
        const content = typeof msg.content === 'string' ? msg.content : '';
        if (content) out.push({ role, content });
      }
    }
    return out.slice(0, 40);
  }

  private async loadRecentDiagnoses(patientId: string) {
    const rows = await this.prisma.medicalRecord.findMany({
      where: { patientId, diagnosis: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { diagnosis: true },
    });
    return rows
      .map((r) => r.diagnosis?.trim())
      .filter((d): d is string => !!d);
  }

  private async buildChatbotSummary(patientId: string) {
    const msgs = await this.loadChatMessages(patientId);
    const patientLines = msgs
      .filter((m) => m.role === 'patient' || m.role === 'user')
      .map((m) => m.content)
      .slice(0, 8);
    return patientLines.join('\n') || null;
  }
}
