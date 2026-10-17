import type {
  ClinicalImageRecord,
  PatientRecordsResponse,
  TreatmentPlanRecord,
  TreatmentPlanStepRecord,
} from "../api";

export type RichPrescriptionItem = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
};

export type RichPrescription = {
  id: string;
  code: string;
  doctor: string;
  date: string;
  notes: string;
  prescriptionImageUrl?: string | null;
  items: RichPrescriptionItem[];
};

export type TimelineStepView = {
  id: string;
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "summary";
  paidAmount: number;
  paymentStatusLabel: string;
  prescriptions: string[];
  richPrescriptions: RichPrescription[];
  careInstructions: string[];
  images: {
    xray: string | null;
    clinical: string | null;
  };
  medicalRecordId: string | null;
  appointment: {
    id: string;
    dateLabel: string;
    time: string;
    doctor: string;
    description: string;
    completed: boolean;
    status: "pending" | "confirmed" | "completed" | "cancelled" | "missed" | "in_progress" | "rescheduled";
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
  richPrescriptions: RichPrescription[];
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
  const treatmentPlan = buildTimelineSteps(sortedSteps, currentStepIndex, plan.doctor.name);
  const paidAmount = treatmentPlan.at(-1)?.paidAmount ?? 0;
  const prescriptions = treatmentPlan
    .flatMap((step) => step.prescriptions)
    .filter((item) => item !== NO_PRESCRIPTION);
  const richPrescriptions = treatmentPlan
    .flatMap((step) => step.richPrescriptions);

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
    title: cleanRecordTitle(plan.title),
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
    category: detectTreatmentCategory(cleanRecordTitle(plan.title)),
    treatmentPlan,
    prescriptions:
      prescriptions.length > 0 ? prescriptions : [NO_PRESCRIPTION],
    richPrescriptions: richPrescriptions,
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
  doctorName: string,
): TimelineStepView[] {
  const stepViews = sortedSteps.map((step, stepIndex) => {
    const firstRecord = step.medicalRecords[0];
    const prescriptions = step.medicalRecords.flatMap((record) =>
      record.prescriptions.flatMap((prescription) =>
        prescription.items.map(
          (item) =>
            `${item.medicineName} ${item.dosage} - ${item.frequency ?? "Theo chỉ định"}`,
        ),
      ),
    );

    const richPrescriptions: RichPrescription[] = step.medicalRecords.flatMap((record) =>
      record.prescriptions.map((p, idx) => ({
        id: p.id || `presc-${step.id}-${idx}`,
        code: `DT-${(p.id || step.id).slice(0, 6).toUpperCase()}`,
        doctor: doctorName,
        date: formatStepDate(step),
        notes: p.notes || "",
        prescriptionImageUrl: null,
        items: p.items.map((item) => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency || "Chưa ghi",
          duration: item.duration || "Chưa ghi",
          instruction: item.instruction || "Chưa ghi",
        })),
      })),
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
      richPrescriptions: richPrescriptions,
      careInstructions: buildCareInstructions(firstRecord?.treatmentNotes),
      images: pickClinicalImages(step.medicalRecords.flatMap((record) => record.images ?? [])),
      medicalRecordId: firstRecord?.id ?? null,
      appointment: appointment
        ? {
            id: appointment.id,
            dateLabel: formatLongDate(appointment.scheduledAt),
            time: formatTime(appointment.scheduledAt),
            doctor: appointment.doctor,
            description:
              step.description ??
              "Kiểm tra tình trạng điều trị và xác nhận bước tiếp theo.",
            completed: appointment.status === "COMPLETED",
            status: normalizeAppointmentStatus(appointment.status),
          }
        : null,
    };
  });

  const totalPaid = stepViews.reduce((sum, step) => sum + step.paidAmount, 0);
  const allPrescriptions = stepViews
    .flatMap((step) => step.prescriptions)
    .filter((item) => item !== NO_PRESCRIPTION);
  const allRichPrescriptions = stepViews.flatMap((step) => step.richPrescriptions);

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
      richPrescriptions:
        allRichPrescriptions,
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

export function cleanRecordTitle(title?: string | null, service?: string | null): string {
  const cleanService = service && service.trim() ? service.trim() : "";
  if (!title || !title.trim()) {
    return cleanService ? `Khám & Điều trị ${cleanService}` : "Khám nha khoa tổng quát";
  }

  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("seed treatment plan 1") || lower.includes("seed diagnosis 1")) {
    return "Phác đồ Cấy ghép Implant đơn lẻ";
  }
  if (lower.includes("seed treatment plan 2") || lower.includes("seed diagnosis 2")) {
    return "Phác đồ Bọc răng sứ thẩm mỹ Cercon";
  }
  if (lower.includes("seed treatment plan 3") || lower.includes("seed diagnosis 3")) {
    return "Phác đồ Dán sứ Veneer Emax 2 hàm";
  }
  if (lower.startsWith("seed treatment plan") || lower.startsWith("seed diagnosis")) {
    return cleanService ? `Phác đồ điều trị ${cleanService}` : "Hồ sơ khám điều trị nha khoa";
  }

  return trimmed
    .replace(/\s*\(\s*răng\s*[^)]*\)/gi, "")
    .replace(/\s*[-–—:]\s*răng\s*\d+/gi, "")
    .trim();
}

export function detectTreatmentCategory(title: string) {
  const value = title.toLowerCase();
  if (value.includes("implant")) return "Trồng răng Implant";
  if (value.includes("chỉnh") || value.includes("nieng") || value.includes("niềng")) {
    return "Chỉnh nha - Niềng răng";
  }
  if (value.includes("nội nha") || value.includes("tủy")) return "Điều trị tủy - Nội nha";
  if (value.includes("thẩm mỹ") || value.includes("sứ") || value.includes("veneer")) return "Nha khoa thẩm mỹ";
  if (value.includes("nhổ") || value.includes("tiểu phẫu")) return "Tiểu phẫu - Nhổ răng";
  if (value.includes("trẻ em")) return "Nha khoa trẻ em";
  return "Nha khoa tổng quát";
}

function getCurrentStepIndex(steps: TreatmentPlanStepRecord[]) {
  const scheduledIndex = steps.findIndex((step) => step.status !== "COMPLETED");
  if (scheduledIndex >= 0) return scheduledIndex;
  return Math.max(steps.length - 1, 0);
}

function normalizeAppointmentStatus(
  status: string,
): NonNullable<TimelineStepView["appointment"]>["status"] {
  const value = status.toUpperCase();
  if (value === "CONFIRMED") return "confirmed";
  if (value === "COMPLETED") return "completed";
  if (value === "CANCELLED") return "cancelled";
  if (value === "NO_SHOW") return "missed";
  if (value === "IN_PROGRESS" || value === "CHECKED_IN") return "in_progress";
  if (value === "RESCHEDULED") return "rescheduled";
  return "pending";
}

function formatStepDate(step: TreatmentPlanStepRecord) {
  const value =
    step.completedAt ?? step.appointments[0]?.scheduledAt ?? step.expectedDate;
  return value ? formatShortDate(value) : "Chưa hẹn";
}

function buildCareInstructions(treatmentNotes?: string | null) {
  return treatmentNotes ? [treatmentNotes] : [];
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
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatLongDate(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
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
