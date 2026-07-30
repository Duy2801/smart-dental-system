import type {
  ClinicalImageRecord,
  PatientRecordsResponse,
  TreatmentPlanRecord,
  TreatmentPlanStepRecord,
} from "../api";

export type TimelineStepView = {
  id: string;
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "summary";
  paidAmount: number;
  paymentStatusLabel: string;
  prescriptions: string[];
  careInstructions: string[];
  images: {
    xray: string | null;
    clinical: string | null;
  };
  medicalRecordId: string | null;
  appointment: {
    dateLabel: string;
    time: string;
    doctor: string;
    description: string;
    completed: boolean;
  } | null;
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
  category: string;
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

const NO_PRESCRIPTION = "Chưa có đơn thuốc";

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
  const treatmentPlan = buildTimelineSteps(sortedSteps, currentStepIndex);
  const paidAmount = treatmentPlan.at(-1)?.paidAmount ?? 0;
  const prescriptions = treatmentPlan
    .flatMap((step) => step.prescriptions)
    .filter((item) => item !== NO_PRESCRIPTION);
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
    category: detectTreatmentCategory(plan.title),
    treatmentPlan,
    prescriptions:
      prescriptions.length > 0 ? prescriptions : [NO_PRESCRIPTION],
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

function buildTimelineSteps(
  sortedSteps: TreatmentPlanStepRecord[],
  currentStepIndex: number,
): TimelineStepView[] {
  const stepViews = sortedSteps.map((step, stepIndex) => {
    const firstRecord = step.medicalRecords[0];
    const prescriptions = step.medicalRecords.flatMap((record) =>
      record.prescriptions.flatMap((prescription) =>
        prescription.items.map(
          (item) =>
            `${item.medicineName} ${item.dosage} - ${
              item.frequency ?? "Theo chỉ định"
            }`,
        ),
      ),
    );
    const paidAmount = step.invoices.reduce(
      (sum, invoice) => sum + invoice.paidAmount,
      0,
    );
    const appointment = step.appointments[0] ?? null;
    const status: TimelineStepView["status"] =
      step.status === "COMPLETED"
        ? "completed"
        : stepIndex === currentStepIndex
          ? "current"
          : "upcoming";

    return {
      id: step.id,
      date: formatStepDate(step),
      title: step.title,
      description:
        step.description ??
        firstRecord?.treatmentNotes ??
        "Đang cập nhật nội dung điều trị.",
      status,
      paidAmount,
      paymentStatusLabel:
        step.paymentStatus === "PAID" || paidAmount > 0
          ? "Thanh toán đủ"
          : step.paymentStatus === "PARTIALLY_PAID"
            ? "Thanh toán một phần"
            : "Chưa thanh toán",
      prescriptions:
        prescriptions.length > 0 ? prescriptions : [NO_PRESCRIPTION],
      careInstructions: buildCareInstructions(firstRecord?.treatmentNotes),
      images: pickClinicalImages(step.medicalRecords.flatMap((record) => record.images ?? [])),
      medicalRecordId: firstRecord?.id ?? null,
      appointment: appointment
        ? {
            dateLabel: formatLongDate(appointment.scheduledAt),
            time: formatTime(appointment.scheduledAt),
            doctor: appointment.doctor,
            description:
              step.description ??
              "Kiểm tra tình trạng điều trị và xác nhận bước tiếp theo.",
            completed: appointment.status === "COMPLETED",
          }
        : null,
    };
  });
  const totalPaid = stepViews.reduce((sum, step) => sum + step.paidAmount, 0);
  const allPrescriptions = stepViews
    .flatMap((step) => step.prescriptions)
    .filter((item) => item !== NO_PRESCRIPTION);

  return [
    ...stepViews,
    {
      id: "summary",
      date: "Tổng quan",
      title: "Kết thúc",
      description:
        "Tổng hợp tất cả bước điều trị, chi phí đã trả, đơn thuốc và lịch hẹn.",
      status: "summary",
      paidAmount: totalPaid,
      paymentStatusLabel:
        totalPaid > 0 ? "Đã ghi nhận thanh toán" : "Chưa thanh toán",
      prescriptions:
        allPrescriptions.length > 0 ? allPrescriptions : [NO_PRESCRIPTION],
      careInstructions: [
        "Xem lại toàn bộ ghi chú điều trị và dặn dò của bác sĩ.",
        "Liên hệ phòng khám khi cần tư vấn thêm về quy trình đã thực hiện.",
      ],
      images: {
        xray: stepViews.find((step) => step.images.xray)?.images.xray ?? null,
        clinical:
          stepViews.find((step) => step.images.clinical)?.images.clinical ?? null,
      },
      medicalRecordId:
        stepViews.find((step) => step.medicalRecordId)?.medicalRecordId ?? null,
      appointment: null,
    },
  ];
}

function pickClinicalImages(images: ClinicalImageRecord[]) {
  const getUrl = (image?: ClinicalImageRecord) =>
    image?.url ?? image?.imageUrl ?? image?.src ?? null;
  const xray = images.find((image) => {
    const label = `${image.type ?? ""} ${image.title ?? ""}`
      .toLowerCase()
      .replaceAll("-", "");
    return label.includes("xray") || label.includes("xquang");
  });
  const clinical = images.find((image) =>
    `${image.type ?? ""} ${image.title ?? ""}`.toLowerCase().includes("clinical"),
  );

  return {
    xray: getUrl(xray) ?? null,
    clinical: getUrl(clinical) ?? getUrl(images.find((image) => image !== xray)) ?? null,
  };
}

function detectTreatmentCategory(title: string) {
  const value = title.toLowerCase();
  if (value.includes("implant")) return "Implant";
  if (value.includes("chỉnh") || value.includes("nieng") || value.includes("niềng")) {
    return "Chỉnh nha";
  }
  if (value.includes("nội nha") || value.includes("tủy")) return "Nội nha";
  if (value.includes("thẩm mỹ") || value.includes("sứ")) return "Nha khoa thẩm mỹ";
  return "Khác";
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
