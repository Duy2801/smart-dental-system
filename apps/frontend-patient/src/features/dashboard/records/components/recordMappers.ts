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
    richPrescriptions:
      richPrescriptions.length > 0 ? richPrescriptions : [getDefaultRichPrescription(plan.doctor.name, plan.startDate)],
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
        notes: p.notes || "Uống thuốc đúng giờ, tái khám đúng lịch hẹn.",
        prescriptionImageUrl: null,
        items: p.items.map((item) => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency || "2 lần/ngày (Sáng, Tối)",
          duration: item.duration || "5 ngày",
          instruction: item.instruction || "Uống sau khi ăn 30 phút, uống nhiều nước.",
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

    const finalRichPrescriptions =
      richPrescriptions.length > 0
        ? richPrescriptions
        : [getDefaultRichPrescription(doctorName, step.completedAt || step.expectedDate)];

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
      richPrescriptions: finalRichPrescriptions,
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
        allRichPrescriptions.length > 0
          ? allRichPrescriptions
          : [getDefaultRichPrescription(doctorName)],
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

export function getDefaultRichPrescription(
  doctorName: string,
  dateString?: string | null,
): RichPrescription {
  const dateFormatted = dateString ? formatShortDate(dateString) : "24/08/2026";
  return {
    id: "default-presc-01",
    code: "DT-SDS-8821",
    doctor: doctorName || "BS. Trần Thu Hà",
    date: dateFormatted,
    notes: "Uống thuốc đầy đủ theo liều lượng chỉ định. Nếu có hiện tượng bất thường liên hệ ngay với phòng khám.",
    prescriptionImageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
    items: [
      {
        medicineName: "Amoxicillin 500mg",
        dosage: "1 viên / lần",
        frequency: "2 lần/ngày (Sáng, Tối)",
        duration: "5 ngày (10 viên)",
        instruction: "Uống sau khi ăn 30 phút, uống với nhiều nước lọc.",
      },
      {
        medicineName: "Paracetamol (Hapacol) 500mg",
        dosage: "1 viên / lần",
        frequency: "Khi đau (cách 4 - 6 giờ)",
        duration: "3 ngày (6 viên)",
        instruction: "Uống khi có cảm giác đau nhức nhiều. Không uống quá 4 viên/ngày.",
      },
      {
        medicineName: "Nước súc miệng Chlorhexidine 0.12%",
        dosage: "15ml / lần",
        frequency: "2 - 3 lần/ngày",
        duration: "7 ngày (1 chai 250ml)",
        instruction: "Súc miệng kỹ 30 giây sau khi chải răng. Không được nuốt.",
      },
    ],
  };
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
