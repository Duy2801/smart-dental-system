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
import {
  AnalyzeXrayDto,
  ExplainTreatmentPlanDto,
  GenerateAftercareDto,
  PrescriptionReviewItemDto,
  ReviewPrescriptionDto,
  SendAftercareDto,
} from './dto/doctor-ai.dto';
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

type AiAftercareResponse = {
  instructions: string[];
  warning_signs: string[];
  medication_schedule: string[];
  follow_up: string | null;
  draft_text: string;
  disclaimer: string;
};

type AiTreatmentPlanExplanationResponse = {
  overview: string;
  steps: Array<{
    title: string;
    explanation: string;
    estimated_cost: number | null;
    duration_hint: string | null;
  }>;
  important_notes: string[];
  total_estimated_cost: number | null;
  timeline: string | null;
  draft_text: string;
  disclaimer: string;
};

type SafetySeverity = 'HIGH' | 'MEDIUM' | 'LOW';

type SafetyWarning = {
  severity: SafetySeverity;
  title: string;
  detail: string;
  medicineNames: string[];
};

const MEDICINE_ALIASES = {
  paracetamol: [
    'paracetamol',
    'acetaminophen',
    'apap',
    'panadol',
    'tylenol',
    'efferalgan',
  ],
  ibuprofen: ['ibuprofen', 'brufen'],
  diclofenac: ['diclofenac', 'voltaren'],
  naproxen: ['naproxen'],
  aspirin: ['aspirin', 'acetylsalicylic'],
  amoxicillin: ['amoxicillin', 'amoxycillin', 'augmentin'],
  ampicillin: ['ampicillin'],
  penicillin: ['penicillin'],
  cephalosporin: ['cephalexin', 'cefuroxime', 'cefixime', 'cefaclor'],
  metronidazole: ['metronidazole', 'flagyl'],
  clindamycin: ['clindamycin'],
} as const;

type MedicineKey = keyof typeof MEDICINE_ALIASES;

const NSAIDS: MedicineKey[] = [
  'ibuprofen',
  'diclofenac',
  'naproxen',
  'aspirin',
];
const PENICILLINS: MedicineKey[] = ['amoxicillin', 'ampicillin', 'penicillin'];
const ANTIBIOTICS: MedicineKey[] = [
  ...PENICILLINS,
  'cephalosporin',
  'metronidazole',
  'clindamycin',
];

const normalizeForRules = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('đ', 'd')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (text: string, terms: readonly string[]) =>
  terms.some((term) => text.includes(normalizeForRules(term)));

const medicineKeys = (name: string) => {
  const normalized = normalizeForRules(name);
  const keys = (
    Object.entries(MEDICINE_ALIASES) as Array<[MedicineKey, readonly string[]]>
  )
    .filter(([, aliases]) => hasAny(normalized, aliases))
    .map(([key]) => key);
  if (keys.length) return keys;
  const generic = normalized
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|ml|%)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return generic ? [`name:${generic}`] : [];
};

const doseInMg = (dosage?: string) => {
  const normalized = normalizeForRules(dosage).replace(',', '.');
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(mcg|mg|g)\b/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  if (match[2] === 'g') return amount * 1000;
  if (match[2] === 'mcg') return amount / 1000;
  return amount;
};

const dosesPerDay = (frequency?: string) => {
  const normalized = normalizeForRules(frequency).replace(',', '.');
  const explicit =
    normalized.match(/(\d+(?:\.\d+)?)\s*lan\s*\/?\s*ngay/) ??
    normalized.match(/ngay\s*(\d+(?:\.\d+)?)\s*lan/);
  if (explicit) return Number(explicit[1]);
  const intervalHours = normalized.match(/moi\s*(\d+(?:\.\d+)?)\s*gio/);
  if (!intervalHours) return null;
  const hours = Number(intervalHours[1]);
  return hours > 0 ? 24 / hours : null;
};

// FDA acetaminophen reference: max 1,000 mg per adult dose and 4,000 mg/24h.
// https://www.fda.gov/drugs/safe-use-over-counter-pain-relievers-and-fever-reducers/acetaminophen
// https://www.accessdata.fda.gov/drugsatfda_docs/label/2010/022450lbl.pdf

/** Deterministic checks only. The LLM is deliberately not part of medication safety. */
export function reviewPrescriptionSafety(
  items: PrescriptionReviewItemDto[],
  medicalHistory?: string | null,
) {
  const history = normalizeForRules(medicalHistory);
  const allergyHistory = history.replace(/\bkhong(?: co)? di ung[^\n.;]*/g, '');
  const keyed = items.map((item) => ({
    name: item.medicineName.trim() || 'Thuốc chưa có tên',
    keys: medicineKeys(item.medicineName),
  }));
  const warnings: SafetyWarning[] = [];
  const warningKeys = new Set<string>();
  const addWarning = (warning: SafetyWarning) => {
    const key = `${warning.title}:${[...warning.medicineNames].sort().join('|')}`;
    if (!warningKeys.has(key)) {
      warningKeys.add(key);
      warnings.push(warning);
    }
  };
  const namesFor = (keys: string[]) =>
    keyed
      .filter((item) => item.keys.some((key) => keys.includes(key)))
      .map((item) => item.name);

  const unnamedMedicines = items
    .map((item, index) =>
      !item.medicineName.trim() ? keyed[index].name : null,
    )
    .filter((name): name is string => name !== null);
  if (unnamedMedicines.length) {
    addWarning({
      severity: 'MEDIUM',
      title: 'Thiếu tên thuốc',
      detail: 'Có mục chưa ghi tên thuốc nên chưa thể kiểm tra an toàn.',
      medicineNames: unnamedMedicines,
    });
  }

  const byIngredient = new Map<string, string[]>();
  for (const item of keyed) {
    for (const key of item.keys) {
      const names = byIngredient.get(key) ?? [];
      names.push(item.name);
      byIngredient.set(key, names);
    }
  }
  for (const [ingredient, names] of byIngredient) {
    if (names.length < 2) continue;
    addWarning({
      severity: 'HIGH',
      title: 'Trùng hoạt chất',
      detail: `Có ${names.length} mục cùng hoạt chất ${ingredient.replace('name:', '')}. Cần kiểm tra tổng liều trước khi kê.`,
      medicineNames: names,
    });
  }

  const medicinesOutsideCatalog = keyed
    .filter((item) => item.keys.some((key) => key.startsWith('name:')))
    .map((item) => item.name);
  if (medicinesOutsideCatalog.length) {
    addWarning({
      severity: 'MEDIUM',
      title: 'Hoạt chất ngoài danh mục quy tắc',
      detail:
        'Bộ quy tắc hiện chưa kiểm tra đầy đủ dị ứng, chống chỉ định và tương tác cho các thuốc này. Cần đối chiếu nguồn dược lâm sàng trước khi kê.',
      medicineNames: medicinesOutsideCatalog,
    });
  }
  if (!history) {
    addWarning({
      severity: 'MEDIUM',
      title: 'Thiếu tiền sử y khoa',
      detail:
        'Hồ sơ chưa có tiền sử dị ứng, bệnh nền hoặc thuốc đang dùng để đối chiếu. Cần hỏi và cập nhật trước khi kê.',
      medicineNames: keyed.map((item) => item.name),
    });
  }

  const allergyTerms = ['dị ứng', 'quá mẫn', 'phản vệ'];
  const allergyStatements = [
    ...allergyHistory.matchAll(/(?:di ung|qua man|phan ve)[^\n.;]*/g),
  ]
    .map((match) => match[0])
    .join(' ');
  const allergyDeclared = hasAny(allergyStatements, allergyTerms);
  if (allergyDeclared) {
    for (const item of keyed) {
      const exactMatch = item.keys.some((key) => {
        if (key.startsWith('name:')) {
          const genericName = key.slice('name:'.length);
          return (
            genericName.length >= 4 && allergyStatements.includes(genericName)
          );
        }
        return hasAny(
          allergyStatements,
          MEDICINE_ALIASES[key as MedicineKey] ?? [],
        );
      });
      if (exactMatch) {
        addWarning({
          severity: 'HIGH',
          title: 'Nguy cơ dị ứng thuốc',
          detail: `Tên thuốc ${item.name} trùng với thuốc được ghi trong tiền sử dị ứng. Cần xác minh trước khi kê.`,
          medicineNames: [item.name],
        });
      }
    }

    const allergyGroups: Array<{
      terms: string[];
      keys: MedicineKey[];
      label: string;
    }> = [
      {
        terms: [
          'penicillin',
          'beta lactam',
          'amoxicillin',
          'ampicillin',
          'augmentin',
        ],
        keys: PENICILLINS,
        label: 'nhóm penicillin',
      },
      {
        terms: ['cephalosporin', 'cephalexin', 'cefuroxime', 'cefixime'],
        keys: ['cephalosporin'],
        label: 'nhóm cephalosporin',
      },
      {
        terms: [
          'nsaid',
          'chống viêm không steroid',
          'aspirin',
          'ibuprofen',
          'diclofenac',
          'naproxen',
        ],
        keys: NSAIDS,
        label: 'nhóm chống viêm không steroid',
      },
      {
        terms: ['paracetamol', 'acetaminophen'],
        keys: ['paracetamol'],
        label: 'paracetamol',
      },
      {
        terms: ['metronidazole'],
        keys: ['metronidazole'],
        label: 'metronidazole',
      },
      {
        terms: ['clindamycin'],
        keys: ['clindamycin'],
        label: 'clindamycin',
      },
      {
        terms: ['kháng sinh'],
        keys: ANTIBIOTICS,
        label: 'kháng sinh',
      },
    ];
    for (const group of allergyGroups) {
      if (!hasAny(allergyStatements, group.terms)) continue;
      const names = namesFor(group.keys);
      if (!names.length) continue;
      addWarning({
        severity: 'HIGH',
        title: 'Nguy cơ dị ứng thuốc',
        detail: `Tiền sử có từ khóa dị ứng ${group.label}. Cần xác minh trước khi kê.`,
        medicineNames: names,
      });
    }
  }

  const contraindications: Array<{
    historyTerms: string[];
    medicineKeys: MedicineKey[];
    severity: SafetySeverity;
    title: string;
    detail: string;
  }> = [
    {
      historyTerms: ['mang thai', 'thai kỳ', 'thai nhi'],
      medicineKeys: NSAIDS,
      severity: 'HIGH',
      title: 'Cần kiểm tra khi mang thai',
      detail:
        'Tiền sử nhắc đến thai kỳ và đơn có thuốc chống viêm không steroid.',
    },
    {
      historyTerms: ['loét dạ dày', 'xuất huyết tiêu hóa', 'viêm loét dạ dày'],
      medicineKeys: NSAIDS,
      severity: 'MEDIUM',
      title: 'Nguy cơ trên dạ dày',
      detail:
        'Tiền sử tiêu hóa có thể không phù hợp với thuốc chống viêm không steroid.',
    },
    {
      historyTerms: ['suy thận', 'bệnh thận', 'lọc máu'],
      medicineKeys: NSAIDS,
      severity: 'HIGH',
      title: 'Cần kiểm tra chức năng thận',
      detail: 'Tiền sử bệnh thận và đơn có thuốc chống viêm không steroid.',
    },
    {
      historyTerms: ['suy gan', 'bệnh gan', 'xơ gan', 'viêm gan'],
      medicineKeys: ['paracetamol'],
      severity: 'MEDIUM',
      title: 'Cần kiểm tra chức năng gan',
      detail: 'Tiền sử bệnh gan và đơn có paracetamol. Cần xác minh tổng liều.',
    },
  ];
  for (const rule of contraindications) {
    if (!hasAny(history, rule.historyTerms)) continue;
    const names = namesFor(rule.medicineKeys);
    if (!names.length) continue;
    addWarning({
      severity: rule.severity,
      title: rule.title,
      detail: rule.detail,
      medicineNames: names,
    });
  }

  const interactions: Array<{
    historyTerms: string[];
    medicineKeys: MedicineKey[];
    title: string;
    detail: string;
  }> = [
    {
      historyTerms: [
        'thuốc chống đông',
        'warfarin',
        'rivaroxaban',
        'apixaban',
        'dabigatran',
        'heparin',
      ],
      medicineKeys: [...NSAIDS, 'metronidazole'],
      title: 'Tương tác với thuốc chống đông',
      detail:
        'Tiền sử nhắc đến thuốc chống đông. Cần kiểm tra nguy cơ chảy máu hoặc thay đổi tác dụng thuốc.',
    },
    {
      historyTerms: ['methotrexate'],
      medicineKeys: [...NSAIDS, 'amoxicillin'],
      title: 'Tương tác với methotrexate',
      detail: 'Cần kiểm tra tương tác và điều chỉnh theo chức năng gan thận.',
    },
    {
      historyTerms: ['lithium'],
      medicineKeys: NSAIDS,
      title: 'Tương tác với lithium',
      detail:
        'Thuốc chống viêm không steroid có thể làm thay đổi nồng độ lithium.',
    },
    {
      historyTerms: ['disulfiram', 'đang uống rượu', 'sử dụng rượu'],
      medicineKeys: ['metronidazole'],
      title: 'Tương tác với metronidazole',
      detail:
        'Tiền sử có từ khóa disulfiram hoặc rượu. Cần xác minh trước khi kê.',
    },
  ];
  for (const rule of interactions) {
    if (!hasAny(history, rule.historyTerms)) continue;
    const names = namesFor(rule.medicineKeys);
    if (!names.length) continue;
    addWarning({
      severity: 'HIGH',
      title: rule.title,
      detail: rule.detail,
      medicineNames: names,
    });
  }

  for (const [index, item] of items.entries()) {
    if (!keyed[index].keys.includes('paracetamol')) continue;
    const singleDoseMg = doseInMg(item.dosage);
    if (singleDoseMg === null) continue;
    const dailyFrequency = dosesPerDay(item.frequency);
    const estimatedDailyMg = dailyFrequency
      ? singleDoseMg * dailyFrequency
      : null;
    if (singleDoseMg <= 1000 && (estimatedDailyMg ?? 0) <= 4000) continue;
    addWarning({
      severity: 'HIGH',
      title: 'Liều paracetamol cần kiểm tra ngay',
      detail:
        estimatedDailyMg && estimatedDailyMg > 4000
          ? `Liều nhập tương đương khoảng ${estimatedDailyMg.toLocaleString('vi-VN')} mg trong 24 giờ, vượt ngưỡng tham chiếu 4.000 mg/ngày cho người từ 12 tuổi. Cần xác minh tuổi, cân nặng và tổng liều từ mọi nguồn.`
          : `Liều mỗi lần ${singleDoseMg.toLocaleString('vi-VN')} mg vượt ngưỡng tham chiếu 1.000 mg/lần cho người lớn. Cần xác minh tuổi, cân nặng, dạng bào chế và tổng liều 24 giờ.`,
      medicineNames: [keyed[index].name],
    });
  }

  const missingInformation = items.flatMap((item, itemIndex) => {
    const fields = (['dosage', 'frequency', 'duration'] as const).filter(
      (field) => !item[field]?.trim(),
    );
    return fields.length
      ? [{ itemIndex, medicineName: item.medicineName.trim(), fields }]
      : [];
  });
  const needsReview = warnings.length > 0 || missingInformation.length > 0;
  return {
    status: needsReview ? ('REVIEW_REQUIRED' as const) : ('CLEAR' as const),
    warnings,
    missingInformation,
    summary: needsReview
      ? `${warnings.length} cảnh báo và ${missingInformation.length} mục thiếu thông tin cần bác sĩ kiểm tra.`
      : 'Chưa phát hiện cảnh báo theo bộ quy tắc hiện có.',
    disclaimer:
      'Kiểm tra tự động chỉ hỗ trợ sàng lọc. Bác sĩ phải đối chiếu hồ sơ, hướng dẫn thuốc và xác nhận trước khi kê.',
  };
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClientService,
  ) {}

  async summarizePatient(user: AuthenticatedUser, dto: SummarizePatientDto) {
    if (!dto.consultationId && !dto.patientId) {
      throw new BadRequestException('Cần consultationId hoặc patientId');
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
        latest_medical_record: ctx.latestMedicalRecord,
        recent_prescriptions: ctx.recentPrescriptions,
        active_treatment_plan: ctx.activeTreatmentPlan,
        follow_up: ctx.followUp,
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
        'AI hỗ trợ chuẩn bị khám. Quyết định lâm sàng thuộc bác sĩ.',
    };
  }

  async draftMedicalRecord(
    user: AuthenticatedUser,
    dto: DraftMedicalRecordDto,
  ) {
    let chatbotSummary = dto.chatbotSummary?.trim() || null;
    const serviceName = dto.serviceName?.trim() || null;

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
        transcript: dto.transcript?.trim() || null,
      },
    );

    return {
      chiefComplaint: raw.chief_complaint,
      diagnosisDraft: raw.diagnosis_draft,
      treatmentNotesDraft: raw.treatment_notes_draft,
      disclaimer:
        raw.disclaimer ||
        'Bản nháp AI. Bác sĩ chỉnh sửa và xác nhận trước khi lưu.',
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
        'Bản nháp đơn thuốc AI. Bác sĩ kiểm tra dị ứng và xác nhận trước khi lưu.',
    };
  }

  async draftTreatmentPlan(
    user: AuthenticatedUser,
    dto: DraftTreatmentPlanDto,
  ) {
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
    const catalog = await this.buildServiceCatalog(
      dto.serviceName || ctx.serviceName,
    );
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
        'Bản nháp kế hoạch AI. Bác sĩ chỉnh sửa trước khi lưu.',
    };
  }

  async reviewPrescription(
    user: AuthenticatedUser,
    dto: ReviewPrescriptionDto,
  ) {
    if (!dto.medicalRecordId && !dto.patientId) {
      throw new BadRequestException('Cần medicalRecordId hoặc patientId');
    }
    const context = await this.resolvePrescriptionContext(user, {
      medicalRecordId: dto.medicalRecordId,
      patientId: dto.patientId,
    });
    return reviewPrescriptionSafety(dto.items, context.medicalHistory);
  }

  async generateAftercare(user: AuthenticatedUser, dto: GenerateAftercareDto) {
    const record = await this.findOwnedRecordForAftercare(
      user,
      dto.medicalRecordId,
    );
    const raw = await this.aiClient.post<AiAftercareResponse>(
      '/api/v1/doctor/generate-aftercare',
      {
        medical_record: {
          chief_complaint: record.chiefComplaint,
          diagnosis: record.diagnosis,
          treatment_notes: record.treatmentNotes,
        },
        service_name: record.appointment.service.name,
        service_aftercare_notes: this.toTextList(
          record.appointment.service.aftercareNotes,
        ),
        treatment_plan:
          record.treatmentPlanStep &&
          record.treatmentPlanStep.treatmentPlan.status !== 'CANCELLED'
            ? {
                title: record.treatmentPlanStep.treatmentPlan.title,
                description: record.treatmentPlanStep.treatmentPlan.description,
                status: record.treatmentPlanStep.treatmentPlan.status,
                current_step: record.treatmentPlanStep.title,
                step_description: record.treatmentPlanStep.description,
                target_tooth: record.treatmentPlanStep.targetTooth,
              }
            : null,
        prescriptions: record.prescriptionRecords.flatMap((prescription) =>
          prescription.items.map((item) => ({
            medicine_name: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instruction: item.instruction,
          })),
        ),
        follow_up_date: record.followUpDate?.toISOString().slice(0, 10) ?? null,
      },
    );

    return {
      instructions: raw.instructions ?? [],
      warningSigns: raw.warning_signs ?? [],
      medicationSchedule: raw.medication_schedule ?? [],
      followUp: raw.follow_up ?? null,
      draftText: raw.draft_text ?? '',
      disclaimer:
        raw.disclaimer ||
        'Nội dung do AI soạn là bản nháp. Bác sĩ phải kiểm tra trước khi gửi cho bệnh nhân.',
    };
  }

  async sendAftercare(user: AuthenticatedUser, dto: SendAftercareDto) {
    const content = dto.content.trim();
    if (!content)
      throw new BadRequestException('Nội dung hướng dẫn đang trống');

    const record = await this.findOwnedRecordForAftercare(
      user,
      dto.medicalRecordId,
    );
    const recipientId =
      record.patient.userId ?? record.patient.patientAccounts[0]?.userId;
    if (!recipientId) {
      throw new BadRequestException(
        'Bệnh nhân chưa có tài khoản để nhận thông báo',
      );
    }

    const duplicate = await this.prisma.notification.findFirst({
      where: {
        userId: recipientId,
        appointmentId: record.appointmentId,
        type: 'AFTERCARE',
        content,
        status: 'SENT',
      },
      select: { id: true },
    });
    if (duplicate) {
      return {
        sent: true,
        message: 'Hướng dẫn này đã được gửi cho bệnh nhân.',
      };
    }

    await this.prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'AFTERCARE',
        title: 'Hướng dẫn chăm sóc sau điều trị',
        content,
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: new Date(),
        appointmentId: record.appointmentId,
        treatmentPlanId:
          record.treatmentPlanStep?.treatmentPlan.id ?? undefined,
      },
    });

    return {
      sent: true,
      message: 'Đã gửi hướng dẫn chăm sóc cho bệnh nhân.',
    };
  }

  async explainTreatmentPlan(
    user: AuthenticatedUser,
    dto: ExplainTreatmentPlanDto,
  ) {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: dto.treatmentPlanId },
      select: {
        doctorId: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        expectedEndDate: true,
        steps: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { stepOrder: 'asc' },
          select: {
            title: true,
            description: true,
            targetTooth: true,
            status: true,
            estimatedCost: true,
            expectedDate: true,
            appointments: {
              orderBy: { scheduledAt: 'desc' },
              take: 1,
              select: {
                service: {
                  select: {
                    name: true,
                    basePrice: true,
                    durationMinutes: true,
                  },
                },
                treatmentMethod: {
                  select: {
                    name: true,
                    basePrice: true,
                    durationMinutes: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy kế hoạch điều trị');
    await this.assertDoctorOwnsPlan(user, plan.doctorId);
    if (plan.status === 'CANCELLED') {
      throw new BadRequestException('Không thể giải thích kế hoạch đã hủy');
    }

    const trustedSteps = plan.steps.map((step) => {
      const appointment = step.appointments[0];
      const cost =
        step.estimatedCost ??
        appointment?.treatmentMethod?.basePrice ??
        appointment?.service.basePrice ??
        null;
      const durationMinutes =
        appointment?.treatmentMethod?.durationMinutes ??
        appointment?.service.durationMinutes ??
        null;
      return {
        title: step.title,
        description: step.description,
        target_tooth: step.targetTooth,
        status: step.status,
        estimated_cost: cost === null ? null : Number(cost),
        expected_date: step.expectedDate?.toISOString().slice(0, 10) ?? null,
        duration_minutes: durationMinutes,
        service_name: appointment?.service.name ?? null,
        treatment_method_name: appointment?.treatmentMethod?.name ?? null,
      };
    });
    const raw = await this.aiClient.post<AiTreatmentPlanExplanationResponse>(
      '/api/v1/doctor/explain-treatment-plan',
      {
        plan_title: plan.title,
        plan_description: plan.description,
        status: plan.status,
        start_date: plan.startDate?.toISOString().slice(0, 10) ?? null,
        expected_end_date:
          plan.expectedEndDate?.toISOString().slice(0, 10) ?? null,
        steps: trustedSteps,
        catalog: await this.buildServiceCatalog(plan.title),
      },
    );
    const costs = trustedSteps
      .map((step) => step.estimated_cost)
      .filter((cost): cost is number => cost !== null);

    return {
      overview: raw.overview ?? '',
      steps: trustedSteps.map((step, index) => ({
        title: step.title,
        explanation: raw.steps?.[index]?.explanation ?? step.description ?? '',
        estimatedCost: step.estimated_cost,
        durationHint:
          step.duration_minutes === null
            ? null
            : `${step.duration_minutes} phút`,
      })),
      importantNotes: raw.important_notes ?? [],
      totalEstimatedCost:
        costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) : null,
      timeline: raw.timeline ?? null,
      draftText: raw.draft_text ?? '',
      disclaimer:
        raw.disclaimer ||
        'Bản giải thích chỉ hỗ trợ trao đổi. Bác sĩ xác nhận nội dung trước khi gửi cho bệnh nhân.',
    };
  }

  async analyzeXray(user: AuthenticatedUser, dto: AnalyzeXrayDto) {
    if (dto.patientId) {
      await this.assertDoctorCanAccessPatient(user, dto.patientId);
    }

    const raw = await this.aiClient.post<{
      is_radiograph?: boolean;
      status?: string;
      findings: Array<{
        fdi_tooth_number: number;
        finding_type: string;
        confidence: number;
        bounding_box: { x: number; y: number; width: number; height: number };
        severity: string;
      }>;
      total_findings: number;
      summary: string;
      diagnosis_suggestion?: string | null;
      treatment_recommendations?: string[];
      annotated_image_url?: string | null;
      disclaimer: string;
    }>('/api/v1/doctor/analyze-xray', {
      image_url: dto.imageUrl ?? null,
      image_base64: dto.imageBase64 ?? null,
      patient_id: dto.patientId ?? null,
      clinical_note_hint: dto.clinicalNoteHint ?? null,
    });

    const isRadiograph = raw.is_radiograph !== false;
    const status = raw.status || (isRadiograph ? 'PATHOLOGY_DETECTED' : 'INVALID_IMAGE');

    return {
      isRadiograph,
      status,
      findings: (raw.findings ?? []).map((f) => ({
        fdiToothNumber: f.fdi_tooth_number,
        findingType: f.finding_type,
        confidence: f.confidence,
        boundingBox: f.bounding_box,
        severity: f.severity,
      })),
      totalFindings: raw.total_findings ?? (raw.findings ?? []).length,
      summary: raw.summary ?? '',
      diagnosisSuggestion: raw.diagnosis_suggestion ?? null,
      treatmentRecommendations: raw.treatment_recommendations ?? [],
      annotatedImageUrl: raw.annotated_image_url ?? null,
      disclaimer:
        raw.disclaimer ||
        'Kết quả phân tích X-quang bởi Dental Vision AI (Hybrid Cloud Pipeline). Bác sĩ cần đối chiếu lâm sàng.',
    };
  }


  /** Catalog ngắn từ DB để AI bám giá và thời lượng thật của phòng khám. */
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

  private async findOwnedRecordForAftercare(
    user: AuthenticatedUser,
    medicalRecordId: string,
  ) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId },
      select: {
        id: true,
        appointmentId: true,
        doctorId: true,
        chiefComplaint: true,
        diagnosis: true,
        treatmentNotes: true,
        followUpDate: true,
        patient: {
          select: {
            userId: true,
            patientAccounts: {
              orderBy: { isPrimary: 'desc' },
              take: 1,
              select: { userId: true },
            },
          },
        },
        appointment: {
          select: {
            service: {
              select: { name: true, aftercareNotes: true },
            },
          },
        },
        prescriptionRecords: {
          orderBy: { createdAt: 'desc' },
          select: {
            items: {
              select: {
                medicineName: true,
                dosage: true,
                frequency: true,
                duration: true,
                instruction: true,
              },
            },
          },
        },
        treatmentPlanStep: {
          select: {
            title: true,
            description: true,
            targetTooth: true,
            treatmentPlan: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!record) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    await this.assertDoctorOwnsRecord(user, record.doctorId);
    return record;
  }

  private toTextList(value: unknown) {
    if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
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
          dto.serviceName?.trim() || record.appointment?.service?.name || null,
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

  private async assertDoctorOwnsPlan(
    user: AuthenticatedUser,
    doctorId: string,
  ) {
    if (user.roles.includes('ADMIN')) return;
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!doctor || doctor.id !== doctorId) {
      throw new ForbiddenException('Không có quyền với kế hoạch điều trị này');
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

      const [chatbotMessages, recentDiagnoses, clinical] = await Promise.all([
        this.loadChatMessages(row.patientId),
        this.loadRecentDiagnoses(row.patientId),
        this.loadClinicalBriefContext(row.patientId),
      ]);

      return {
        patientId: row.patientId,
        patientName:
          row.patient.fullName ?? row.patient.user?.fullName ?? 'Benh nhan',
        medicalHistory: row.patient.medicalHistory,
        chatbotMessages,
        recentDiagnoses,
        ...clinical,
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

    const [chatbotMessages, recentDiagnoses, clinical] = await Promise.all([
      this.loadChatMessages(patientId),
      this.loadRecentDiagnoses(patientId),
      this.loadClinicalBriefContext(patientId),
    ]);

    return {
      patientId,
      patientName: patient.fullName ?? patient.user?.fullName ?? 'Benh nhan',
      medicalHistory: patient.medicalHistory,
      chatbotMessages,
      recentDiagnoses,
      ...clinical,
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
    for (const c of [...chats].reverse()) {
      if (!Array.isArray(c.messages)) continue;
      for (const item of c.messages) {
        if (!item || typeof item !== 'object') continue;
        const msg = item as Record<string, unknown>;
        const role = typeof msg.role === 'string' ? msg.role : 'assistant';
        const content = typeof msg.content === 'string' ? msg.content : '';
        if (content) out.push({ role, content });
      }
    }
    return out.slice(-40);
  }

  private async loadRecentDiagnoses(patientId: string) {
    const rows = await this.prisma.medicalRecord.findMany({
      where: { patientId, diagnosis: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { diagnosis: true },
    });
    return rows.map((r) => r.diagnosis?.trim()).filter((d): d is string => !!d);
  }

  private async loadClinicalBriefContext(patientId: string) {
    const [latestRecord, recentPrescriptionRecords, plans, nextAppointment] =
      await Promise.all([
        this.prisma.medicalRecord.findFirst({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
          select: {
            chiefComplaint: true,
            diagnosis: true,
            treatmentNotes: true,
            followUpDate: true,
            appointment: {
              select: {
                scheduledAt: true,
                service: { select: { name: true } },
              },
            },
          },
        }),
        this.prisma.prescription.findMany({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            items: {
              select: {
                medicineName: true,
                dosage: true,
                frequency: true,
                duration: true,
              },
            },
          },
        }),
        this.prisma.treatmentPlan.findMany({
          where: { patientId, status: { in: ['IN_PROGRESS', 'PLANNED'] } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            title: true,
            description: true,
            status: true,
            expectedEndDate: true,
            steps: {
              where: { status: { not: 'CANCELLED' } },
              orderBy: { stepOrder: 'asc' },
              take: 8,
              select: {
                title: true,
                status: true,
                expectedDate: true,
              },
            },
          },
        }),
        this.prisma.appointment.findFirst({
          where: {
            patientId,
            scheduledAt: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          },
          orderBy: { scheduledAt: 'asc' },
          select: {
            scheduledAt: true,
            service: { select: { name: true } },
          },
        }),
      ]);
    const activePlan =
      plans.find((plan) => plan.status === 'IN_PROGRESS') ?? plans[0] ?? null;
    const latestMedicalRecord = latestRecord
      ? [
          `Ngày khám: ${latestRecord.appointment.scheduledAt.toISOString().slice(0, 10)}`,
          `Dịch vụ: ${latestRecord.appointment.service.name}`,
          latestRecord.chiefComplaint
            ? `Lý do khám: ${latestRecord.chiefComplaint}`
            : null,
          latestRecord.diagnosis
            ? `Chẩn đoán: ${latestRecord.diagnosis}`
            : null,
          latestRecord.treatmentNotes
            ? `Ghi chú điều trị: ${latestRecord.treatmentNotes}`
            : null,
        ]
          .filter(Boolean)
          .join('\n')
      : null;
    const recentPrescriptions = recentPrescriptionRecords
      .flatMap((prescription) => prescription.items)
      .slice(0, 10)
      .map((item) =>
        [item.medicineName, item.dosage, item.frequency, item.duration]
          .filter(Boolean)
          .join(', '),
      );
    const activeTreatmentPlan = activePlan
      ? [
          `${activePlan.title} (${activePlan.status})`,
          activePlan.description,
          ...activePlan.steps.map(
            (step) =>
              `${step.title}: ${step.status}` +
              (step.expectedDate
                ? `, dự kiến ${step.expectedDate.toISOString().slice(0, 10)}`
                : ''),
          ),
          activePlan.expectedEndDate
            ? `Kết thúc dự kiến: ${activePlan.expectedEndDate.toISOString().slice(0, 10)}`
            : null,
        ]
          .filter(Boolean)
          .join('\n')
      : null;
    const followUp = [
      latestRecord?.followUpDate
        ? `Ngày tái khám trong hồ sơ: ${latestRecord.followUpDate.toISOString().slice(0, 10)}`
        : null,
      nextAppointment
        ? `Lịch hẹn tiếp theo: ${nextAppointment.scheduledAt.toISOString()} (${nextAppointment.service.name})`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      latestMedicalRecord,
      recentPrescriptions,
      activeTreatmentPlan,
      followUp: followUp || null,
      upcomingService: nextAppointment?.service.name ?? null,
    };
  }

  private async buildChatbotSummary(patientId: string) {
    const msgs = await this.loadChatMessages(patientId);
    const patientLines = msgs
      .filter((m) => m.role === 'patient' || m.role === 'user')
      .map((m) => m.content)
      .slice(-8);
    return patientLines.join('\n') || null;
  }
}
