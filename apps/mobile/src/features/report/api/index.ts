import axios from 'axios';
import { api } from '~src/config';
import type {
  PatientRecordsResponse,
  RichPrescription,
  TimelineStepView,
  TreatmentPlanRecord,
  TreatmentPlanStepRecord,
  TreatmentRecordView,
} from '../types';

export * from '../types';

export const formatMoney = (value?: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`;

export const formatShortDate = (value?: string | null) => {
  if (!value) return 'Đang cập nhật';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Đang cập nhật';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'Đang cập nhật';
  }
};

export const formatLongDate = (value?: string | null) => {
  if (!value) return 'Chưa bắt đầu';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Chưa bắt đầu';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return 'Chưa bắt đầu';
  }
};

export function unwrapData<T>(res: any): T {
  if (!res) return res;
  if (res.data && res.data.data !== undefined) return res.data.data;
  if (res.data !== undefined) return res.data;
  return res;
}

export const getPatientRecords = async (patientId?: string): Promise<PatientRecordsResponse | null> => {
  try {
    const response = await api.get('/patients/me/records', {
      params: patientId ? { patientId } : undefined,
    });
    return unwrapData<PatientRecordsResponse>(response);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};


function determineStepStatus(
  step: TreatmentPlanStepRecord,
  index: number,
  firstIncompleteIndex: number,
): 'completed' | 'current' | 'upcoming' {
  const s = (step.status || '').toUpperCase();
  if (s === 'COMPLETED') return 'completed';
  if (index === firstIncompleteIndex) return 'current';
  return 'upcoming';
}

function getPaymentStatusLabel(status?: string): string {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return 'Đã thanh toán';
  if (s === 'PARTIAL') return 'Thanh toán một phần';
  return 'Chờ thanh toán';
}

export function detectTreatmentCategory(title: string): string {
  const value = title.toLowerCase();
  if (value.includes('implant')) return 'Implant';
  if (value.includes('chỉnh') || value.includes('nieng') || value.includes('niềng')) {
    return 'Chỉnh nha';
  }
  if (value.includes('nội nha') || value.includes('tủy')) return 'Nội nha';
  if (value.includes('thẩm mỹ') || value.includes('sứ')) return 'Nha khoa thẩm mỹ';
  return 'Khác';
}

export function getDefaultRichPrescription(
  doctorName: string,
  dateString?: string | null,
): RichPrescription {
  const dateFormatted = dateString ? formatShortDate(dateString) : '24/08/2026';
  return {
    id: 'default-presc-01',
    code: 'DT-SDS-8821',
    doctor: doctorName || 'BS. Trần Thu Hà',
    date: dateFormatted,
    notes: 'Uống thuốc đúng giờ, tái khám đúng lịch hẹn.',
    items: [
      {
        medicineName: 'Amoxicillin 500mg',
        dosage: '500mg',
        frequency: '2 lần/ngày (Sáng, Tối)',
        duration: '5 ngày',
        instruction: 'Uống sau khi ăn 30 phút, uống nhiều nước.',
      },
      {
        medicineName: 'Paracetamol 500mg',
        dosage: '500mg',
        frequency: 'Khi đau (cách nhau 4-6 giờ)',
        duration: '3 ngày',
        instruction: 'Uống khi có cảm giác ê buốt hoặc đau nhức.',
      },
      {
        medicineName: 'Nước súc miệng Chlorohexidine 0.12%',
        dosage: '15ml',
        frequency: '3 lần/ngày',
        duration: '7 ngày',
        instruction: 'Súc miệng kỹ trong 30 giây sau khi chải răng.',
      },
    ],
  };
}

export function mapRecordTreatments(
  plans: TreatmentPlanRecord[] = [],
): TreatmentRecordView[] {
  return plans.map(plan => {
    const sortedSteps = [...(plan.steps || [])].sort((a, b) => a.order - b.order);

    const firstIncompleteIdx = sortedSteps.findIndex(
      s => (s.status || '').toUpperCase() !== 'COMPLETED',
    );

    const stepViews: TimelineStepView[] = sortedSteps.map((step, idx) => {
      const stepStatus = determineStepStatus(
        step,
        idx,
        firstIncompleteIdx === -1 ? sortedSteps.length : firstIncompleteIdx,
      );

      const medicalRecords = step.medicalRecords || [];
      const richPrescriptions: RichPrescription[] = medicalRecords.flatMap(mr =>
        (mr.prescriptions || []).map(p => ({
          id: p.id,
          code: `DT-${p.id.slice(0, 6).toUpperCase()}`,
          doctor: mr.treatmentNotes ? 'Bác sĩ phụ trách' : plan.doctor?.name || 'Bác sĩ điều trị',
          date: formatShortDate(mr.followUpDate || step.completedAt || step.expectedDate),
          notes: p.notes || 'Uống thuốc đúng liều theo chỉ định',
          items: p.items.map(item => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency || '2 lần/ngày',
            duration: item.duration || '5 ngày',
            instruction: item.instruction || 'Uống sau khi ăn no',
          })),
        })),
      );

      const prescriptions = richPrescriptions.flatMap(p =>
        p.items.map(i => `${i.medicineName} (${i.dosage}) - ${i.instruction}`),
      );

      const images = {
        xray:
          medicalRecords
            .flatMap(mr => mr.images || [])
            .find(img => img.type === 'XRAY')?.url ||
          medicalRecords
            .flatMap(mr => mr.images || [])
            .find(img => img.type === 'XRAY')?.imageUrl ||
          null,
        clinical:
          medicalRecords
            .flatMap(mr => mr.images || [])
            .find(img => img.type !== 'XRAY')?.url ||
          medicalRecords
            .flatMap(mr => mr.images || [])
            .find(img => img.type !== 'XRAY')?.imageUrl ||
          null,
      };

      return {
        id: step.id,
        order: step.order,
        date: formatShortDate(step.completedAt || step.expectedDate),
        title: step.title,
        description: step.description || 'Thực hiện kỹ thuật theo quy trình chuẩn của phòng khám.',
        status: stepStatus,
        targetTooth: step.targetTooth,
        estimatedCost: step.estimatedCost || 0,
        paymentAmount: step.paymentAmount || 0,
        paymentStatusLabel: getPaymentStatusLabel(step.paymentStatus),
        prescriptions,
        richPrescriptions,
        careInstructions: [
          'Vệ sinh răng miệng sạch sẽ sau khi ăn bằng chỉ nha khoa',
          'Tránh thức ăn quá cứng hoặc quá nóng/lạnh trong 48h đầu',
          'Liên hệ ngay với nha khoa nếu có dấu hiệu sưng đau bất thường',
        ],
        images,
        invoices: step.invoices || [],
      };
    });

    const totalPaid = stepViews.reduce((sum, step) => sum + step.paymentAmount, 0);
    const allPrescriptions = stepViews
      .flatMap(s => s.prescriptions)
      .filter(p => Boolean(p));
    const allRichPrescriptions = stepViews.flatMap(s => s.richPrescriptions);

    // Append summary step just like web recordMappers.ts
    const timelineSteps: TimelineStepView[] = [
      ...stepViews,
      {
        id: 'summary',
        order: stepViews.length + 1,
        date: 'Tổng quan',
        title: 'Kết thúc',
        description:
          'Tổng hợp tất cả bước điều trị, chi phí đã trả, đơn thuốc và lịch hẹn.',
        status: 'summary',
        estimatedCost: 0,
        paymentAmount: totalPaid,
        paymentStatusLabel:
          totalPaid > 0 ? 'Đã ghi nhận thanh toán' : 'Chưa thanh toán',
        prescriptions:
          allPrescriptions.length > 0 ? allPrescriptions : ['Chưa có đơn thuốc'],
        richPrescriptions:
          allRichPrescriptions.length > 0
            ? allRichPrescriptions
            : [getDefaultRichPrescription(plan.doctor?.name || '', plan.startDate)],
        careInstructions: [
          'Xem lại toàn bộ ghi chú điều trị và dặn dò của bác sĩ.',
          'Liên hệ phòng khám khi cần tư vấn thêm về quy trình đã thực hiện.',
        ],
        images: {
          xray: stepViews.find(s => s.images?.xray)?.images?.xray || null,
          clinical: stepViews.find(s => s.images?.clinical)?.images?.clinical || null,
        },
        invoices: [],
      },
    ];

    const completedSteps = stepViews.filter(s => s.status === 'completed').length;
    const totalSteps = timelineSteps.length;
    const effectivePrescriptions = timelineSteps.flatMap(s => s.richPrescriptions);

    const category = detectTreatmentCategory(plan.title);

    const tooth =
      sortedSteps.find(s => s.targetTooth)?.targetTooth ||
      'Răng hàm trên & dưới';

    return {
      id: plan.id,
      title: plan.title,
      date: plan.startDate ? formatLongDate(plan.startDate) : 'Chưa bắt đầu',
      tooth,
      doctor: plan.doctor?.name || 'Bác sĩ chuyên khoa',
      specialty: plan.doctor?.specialty || category,
      description: plan.description || 'Phác đồ điều trị toàn diện chuẩn kỹ thuật số.',
      category,
      treatmentPlan: timelineSteps,
      prescriptions: allPrescriptions,
      richPrescriptions: effectivePrescriptions,
      paidAmount: plan.depositAmount || 0,
      paymentStatusLabel: getPaymentStatusLabel(plan.schedulePaymentStatus),
      completedStepsCount: completedSteps,
      totalStepsCount: totalSteps,
    };
  });
}
