export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "SCHEDULED";

export type ScheduleAppointment = {
  id: string;
  type: "OFFLINE" | "ONLINE";
  appointmentCode: string;
  scheduledAt: string;
  durationMinutes: number;
  dayIso: string;
  status: AppointmentStatus;
  patientId: string | null;
  patientName: string;
  patientCode: string;
  patientPhone: string;
  serviceName: string;
  notes?: string | null;
  medicalRecordId?: string | null;
};

export type TimeOffRecord = {
  id: string;
  dayIso: string;
  startTime: string;
  endTime: string;
  reason: string | null;
};

export const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; ring: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-amber-50 text-amber-700",
    ring: "ring-1 ring-inset ring-amber-600/20",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-blue-50 text-blue-700",
    ring: "ring-1 ring-inset ring-blue-600/20",
  },
  CHECKED_IN: {
    label: "Đã check-in",
    color: "bg-violet-50 text-violet-700",
    ring: "ring-1 ring-inset ring-violet-600/20",
  },
  IN_PROGRESS: {
    label: "Đang khám",
    color: "bg-orange-50 text-orange-700",
    ring: "ring-1 ring-inset ring-orange-600/20",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    color: "bg-green-50 text-green-700",
    ring: "ring-1 ring-inset ring-green-600/20",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700",
    ring: "ring-1 ring-inset ring-red-600/10",
  },
  NO_SHOW: {
    label: "Không đến",
    color: "bg-slate-50 text-slate-700",
    ring: "ring-1 ring-inset ring-slate-600/20",
  },
  SCHEDULED: {
    label: "Sắp tới",
    color: "bg-blue-50 text-blue-700",
    ring: "ring-1 ring-inset ring-blue-600/20",
  },
};
