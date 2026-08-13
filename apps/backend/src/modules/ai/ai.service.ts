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
import { DraftPrescriptionDto } from './dto/draft-prescription.dto';
import { DraftTreatmentPlanDto } from './dto/draft-treatment-plan.dto';
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

type AiPrescriptionDraftResponse = {
  notes: string | null;
  items: Array<{
    medicine_name: string;
    dosage: string;
    frequency?: string | null;
    duration?: string | null;
    instruction?: string | null;
  }>;
  allergy_warnings: string[];
  disclaimer: string;
};

type AiTreatmentPlanDraftResponse = {
  title: string | null;
  description: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  steps: Array<{
    title: string;
    description?: string | null;
    target_tooth?: string | null;
    estimated_cost?: number | null;
    expected_date?: string | null;
    duration_hint?: string | null;
  }>;
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

  async draftPrescription(user: AuthenticatedUser, dto: DraftPrescriptionDto) {
    const ctx = await this.resolvePrescriptionContext(user, dto);
    const raw = await this.aiClient.post<AiPrescriptionDraftResponse>(
      '/api/v1/doctor/draft-prescription',
      {
        diagnosis: ctx.diagnosis,
        chief_complaint: ctx.chiefComplaint,
        treatment_notes: ctx.treatmentNotes,
        medical_history: ctx.medicalHistory,
        service_name: ctx.serviceName,
        doctor_notes_hint: dto.doctorNotesHint ?? null,
      },
    );

    return {
      patientId: ctx.patientId,
      medicalRecordId: ctx.medicalRecordId,
      notes: raw.notes,
      items: (raw.items ?? []).map((it) => ({
        medicineName: it.medicine_name ?? '',
        dosage: it.dosage ?? '',
        frequency: it.frequency ?? null,
        duration: it.duration ?? null,
        instruction: it.instruction ?? null,
      })),
      allergyWarnings: raw.allergy_warnings ?? [],
      disclaimer:
        raw.disclaimer ||
        'Bản nháp đơn thuốc AI — bác sĩ kiểm tra dị ứng và xác nhận trước khi lưu.',
    };
  }

  async draftTreatmentPlan(user: AuthenticatedUser, dto: DraftTreatmentPlanDto) {
    let diagnosis = dto.diagnosis;
    let chiefComplaint = dto.chiefComplaint;
    let treatmentNotes = dto.treatmentNotes;
    if (dto.patientId && !dto.medicalRecordId && !diagnosis) {
      await this.assertDoctorCanAccessPatient(user, dto.patientId);
      const latest = await this.prisma.medicalRecord.findFirst({
        where: { patientId: dto.patientId },
        orderBy: { createdAt: 'desc' },
        select: {
          diagnosis: true,
          chiefComplaint: true,
          treatmentNotes: true,
        },
      });
      diagnosis = diagnosis || latest?.diagnosis || undefined;
      chiefComplaint = chiefComplaint || latest?.chiefComplaint || undefined;
      treatmentNotes = treatmentNotes || latest?.treatmentNotes || undefined;
    }
    const ctx = await this.resolvePrescriptionContext(user, {
      patientId: dto.patientId,
      medicalRecordId: dto.medicalRecordId,
      diagnosis,
      chiefComplaint,
      treatmentNotes,
      medicalHistory: dto.medicalHistory,
      serviceName: dto.serviceName,
      doctorNotesHint: dto.doctorNotesHint,
    });
    const catalog = await this.buildServiceCatalog(dto.serviceName || ctx.serviceName);
    const raw = await this.aiClient.post<AiTreatmentPlanDraftResponse>(
      '/api/v1/doctor/draft-treatment-plan',
      {
        diagnosis: ctx.diagnosis,
        chief_complaint: ctx.chiefComplaint,
        treatment_notes: ctx.treatmentNotes,
        medical_history: ctx.medicalHistory,
        service_name: ctx.serviceName,
        doctor_notes_hint: dto.doctorNotesHint ?? null,
        catalog,
      },
    );

    return {
      patientId: ctx.patientId,
      medicalRecordId: ctx.medicalRecordId,
      title: raw.title,
      description: raw.description,
      startDate: raw.start_date,
      expectedEndDate: raw.expected_end_date,
      steps: (raw.steps ?? []).map((s) => ({
        title: s.title ?? '',
        description: s.description ?? null,
        targetTooth: s.target_tooth ?? null,
        estimatedCost:
          s.estimated_cost === null || s.estimated_cost === undefined
            ? null
            : Number(s.estimated_cost),
        expectedDate: s.expected_date ?? null,
        durationHint: s.duration_hint ?? null,
      })),
      disclaimer:
        raw.disclaimer ||
        'Bản nháp kế hoạch AI — bác sĩ chỉnh sửa trước khi lưu.',
    };
  }

  /** Catalog ngắn từ DB — AI bám giá/thời lượng thật phòng khám. */
  private async buildServiceCatalog(serviceHint?: string | null) {
    const methods = await this.prisma.treatmentMethod.findMany({
      where: { isActive: true },
      take: 25,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        basePrice: true,
        durationMinutes: true,
        service: { select: { name: true } },
      },
    });
    if (!methods.length) return null;
    const hint = serviceHint?.toLowerCase() ?? '';
    const ranked = hint
      ? [
          ...methods.filter(
            (m) =>
              m.name.toLowerCase().includes(hint) ||
              m.service.name.toLowerCase().includes(hint),
          ),
          ...methods.filter(
            (m) =>
              !m.name.toLowerCase().includes(hint) &&
              !m.service.name.toLowerCase().includes(hint),
          ),
        ]
      : methods;
    return ranked
      .slice(0, 15)
      .map(
        (m) =>
          `- ${m.service.name} / ${m.name}: ${m.basePrice.toString()} VND` +
          (m.durationMinutes ? `, ~${m.durationMinutes} phút` : ''),
      )
      .join('\n');
  }

  private async resolvePrescriptionContext(
    user: AuthenticatedUser,
    dto: DraftPrescriptionDto,
  ) {
    if (dto.medicalRecordId) {
      const record = await this.prisma.medicalRecord.findUnique({
        where: { id: dto.medicalRecordId },
        select: {
          id: true,
          doctorId: true,
          patientId: true,
          diagnosis: true,
          chiefComplaint: true,
          treatmentNotes: true,
          appointment: { select: { service: { select: { name: true } } } },
          patient: { select: { medicalHistory: true } },
        },
      });
      if (!record) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
      await this.assertDoctorOwnsRecord(user, record.doctorId);

      return {
        patientId: record.patientId,
        medicalRecordId: record.id,
        diagnosis: dto.diagnosis?.trim() || record.diagnosis,
        chiefComplaint: dto.chiefComplaint?.trim() || record.chiefComplaint,
        treatmentNotes: dto.treatmentNotes?.trim() || record.treatmentNotes,
        medicalHistory:
          dto.medicalHistory?.trim() || record.patient.medicalHistory,
        serviceName:
          dto.serviceName?.trim() ||
          record.appointment?.service?.name ||
          null,
      };
    }

    if (!dto.patientId) {
      throw new BadRequestException('Cần medicalRecordId hoặc patientId');
    }
    await this.assertDoctorCanAccessPatient(user, dto.patientId);
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      select: { id: true, medicalHistory: true },
    });
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân');

    return {
      patientId: patient.id,
      medicalRecordId: null as string | null,
      diagnosis: dto.diagnosis?.trim() || null,
      chiefComplaint: dto.chiefComplaint?.trim() || null,
      treatmentNotes: dto.treatmentNotes?.trim() || null,
      medicalHistory: dto.medicalHistory?.trim() || patient.medicalHistory,
      serviceName: dto.serviceName?.trim() || null,
    };
  }

  private async assertDoctorOwnsRecord(
    user: AuthenticatedUser,
    doctorId: string,
  ) {
    if (user.roles.includes('ADMIN')) return;
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!doctor || doctor.id !== doctorId) {
      throw new ForbiddenException('Không có quyền với hồ sơ bệnh án này');
    }
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
              fullName: true,
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
        patientName: row.patient.fullName ?? row.patient.user?.fullName ?? 'Benh nhan',
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
        fullName: true,
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
      patientName: patient.fullName ?? patient.user?.fullName ?? 'Benh nhan',
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
