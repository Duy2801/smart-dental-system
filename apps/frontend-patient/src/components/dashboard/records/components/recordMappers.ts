import type {
  PatientRecordsResponse,
  TreatmentPlanRecord,
  TreatmentPlanStepRecord,
} from "../api";

export type TimelineStepView = {
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
};

export type TreatmentRecordView = {
  id: string;
  title: string;
  date: string;
  tooth: string;
  doctor: string;
  specialty: string;
  description: string;
  active: boolean;
  treatmentPlan: TimelineStepView[];
  prescriptions: string[];
  paidAmount: number;
  paymentStatusLabel: string;
  careInstructions: string[];
  followUp: {
    stepIndex: number;
    dateLabel: string;
    time: string;
    doctor: string;
    description: string;
  } | null;
};

export function mapRecordTreatments(
  plans: PatientRecordsResponse["treatmentPlans"],
) {
  return plans.map((plan, index) => mapTreatmentPlan(plan, index === 0));
}

function mapTreatmentPlan(
  plan: TreatmentPlanRecord,
  active: boolean,
): TreatmentRecordView {
  const sortedSteps = [...plan.steps].sort((a, b) => a.order - b.order);
  const currentStepIndex = getCurrentStepIndex(sortedSteps);
  const firstRecord = sortedSteps.flatMap((step) => step.medicalRecords)[0];
  const prescriptions =
    firstRecord?.prescriptions.flatMap((prescription) =>
      prescription.items.map(
        (item) =>
          `${item.medicineName} ${item.dosage} · ${
            item.frequency ?? "Theo chỉ định"
          }`,
      ),
    ) ?? [];
  const paidAmount = sortedSteps.reduce(
    (total, step) =>
      total +
      step.invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0),
    0,
  );
  const followUpStepIndex = sortedSteps.findIndex(
    (step) =>
      step.status === "SCHEDULED" ||
      step.status === "IN_PROGRESS" ||
      step.appointments.some((appointment) => appointment.status !== "COMPLETED"),
  );
  const followUpStep =
    followUpStepIndex >= 0 ? sortedSteps[followUpStepIndex] : null;
  const followUpAppointment = followUpStep?.appointments[0];

  return {
    id: plan.id,
    title: plan.title,
    date: plan.startDate ? formatLongDate(plan.startDate) : "Chưa bắt đầu",
    tooth:
      sortedSteps.find((step) => step.targetTooth)?.targetTooth ??
      "Theo chỉ định",
    doctor: plan.doctor.name,
    specialty: plan.doctor.specialty,
    description:
      plan.description ??
      firstRecord?.treatmentNotes ??
      "Kế hoạch điều trị được bác sĩ lập và cập nhật theo từng lần khám.",
    active,
    treatmentPlan: sortedSteps.map((step, stepIndex) => ({
      date: formatStepDate(step),
      title: step.title,
      description: step.description ?? "Đang cập nhật nội dung điều trị.",
      status:
        step.status === "COMPLETED"
          ? "completed"
          : stepIndex === currentStepIndex
            ? "current"
            : "upcoming",
    })),
    prescriptions:
      prescriptions.length > 0 ? prescriptions : ["Chưa có đơn thuốc"],
    paidAmount,
    paymentStatusLabel: paidAmount > 0 ? "Thanh toán đủ" : "Chưa thanh toán",
    careInstructions: buildCareInstructions(firstRecord?.treatmentNotes),
    followUp:
      followUpStep && followUpAppointment
        ? {
            stepIndex: Math.max(followUpStepIndex, 0),
            dateLabel: formatLongDate(followUpAppointment.scheduledAt),
            time: formatTime(followUpAppointment.scheduledAt),
            doctor: followUpAppointment.doctor,
            description:
              followUpStep.description ??
              "Kiểm tra tình trạng điều trị và xác nhận bước tiếp theo.",
          }
        : null,
  };
}

function getCurrentStepIndex(steps: TreatmentPlanStepRecord[]) {
  const scheduledIndex = steps.findIndex((step) => step.status !== "COMPLETED");
  if (scheduledIndex >= 0) return scheduledIndex;
  return Math.max(steps.length - 1, 0);
}

function formatStepDate(step: TreatmentPlanStepRecord) {
  const value =
    step.completedAt ?? step.appointments[0]?.scheduledAt ?? step.expectedDate;
  return value ? formatShortDate(value) : "Chưa hẹn";
}

function buildCareInstructions(treatmentNotes?: string | null) {
  if (!treatmentNotes) {
    return [
      "Vệ sinh răng miệng nhẹ nhàng theo hướng dẫn của bác sĩ.",
      "Liên hệ phòng khám nếu đau, sưng hoặc có dấu hiệu bất thường.",
    ];
  }

  return [
    treatmentNotes,
    "Tái khám đúng lịch để bác sĩ đánh giá bước điều trị tiếp theo.",
  ];
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function getGenderLabel(
  gender: PatientRecordsResponse["patient"]["gender"],
) {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";
  return "Chưa cập nhật";
}
