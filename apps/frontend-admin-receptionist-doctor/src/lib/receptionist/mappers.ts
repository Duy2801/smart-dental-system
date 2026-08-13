import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";

/** YYYY-MM-DD theo giờ máy local (tránh lệch UTC của toISOString). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Prisma appointment include shape from backend */
export type ApiAppointment = {
  id: string;
  appointmentCode?: string;
  scheduledAt: string;
  endAt?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  paymentStatus?: string | null;
  bookingSource?: string | null;
  patient?: {
    id: string;
    fullName?: string | null;
    phone?: string | null;
    medicalHistory?: string | null;
    user?: { fullName?: string | null; phone?: string | null } | null;
  } | null;
  doctor?: {
    id: string;
    user?: { fullName?: string | null } | null;
  } | null;
  service?: { id?: string; name?: string | null } | null;
};

export type ReceptionistAppointment = {
  id: string;
  appointmentCode: string;
  startTime: string;
  endTime?: string;
  scheduledAt?: string;
  status: AppointmentStatus;
  notes?: string | null;
  invoicePending?: boolean;
  bookingSource?: string | null;
  allergies: string[];
  patient?: { id: string; fullName: string; phone: string } | null;
  doctor?: { id: string; fullName: string } | null;
  service?: { id?: string; name: string } | null;
};

function timeFromIso(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 19) || iso.slice(0, 5);
  return d.toTimeString().slice(0, 8);
}

function parseAllergies(medicalHistory?: string | null): string[] {
  if (!medicalHistory) return [];
  const match = medicalHistory.match(/Dị ứng:\s*(.+?)(?:\n|$)/i);
  if (!match?.[1]) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const PAID_PAYMENT_STATUSES = new Set([
  "COUNTER_PAID",
  "DEPOSIT_PAID",
  "WAIVED",
]);

export function mapAppointment(raw: ApiAppointment): ReceptionistAppointment {
  const paymentStatus = raw.paymentStatus ?? "";
  return {
    id: raw.id,
    appointmentCode: raw.appointmentCode ?? raw.id.slice(0, 8).toUpperCase(),
    startTime: timeFromIso(raw.scheduledAt),
    endTime: raw.endAt ? timeFromIso(raw.endAt) : undefined,
    scheduledAt: raw.scheduledAt,
    status: raw.status,
    notes: raw.notes,
    bookingSource: raw.bookingSource ?? null,
    allergies: parseAllergies(raw.patient?.medicalHistory),
    invoicePending:
      raw.status === "COMPLETED" && !PAID_PAYMENT_STATUSES.has(paymentStatus),
    patient: raw.patient
      ? {
          id: raw.patient.id,
          fullName: raw.patient.fullName ?? raw.patient.user?.fullName ?? "Khách",
          phone: raw.patient.phone ?? raw.patient.user?.phone ?? "",
        }
      : null,
    doctor: raw.doctor
      ? {
          id: raw.doctor.id,
          fullName: raw.doctor.user?.fullName ?? "",
        }
      : null,
    service: raw.service?.name
      ? { id: raw.service.id, name: raw.service.name }
      : null,
  };
}

export function mapAppointments(list: ApiAppointment[] | unknown): ReceptionistAppointment[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) => mapAppointment(item as ApiAppointment));
}
