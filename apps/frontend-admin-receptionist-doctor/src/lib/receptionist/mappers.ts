import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";

/** Prisma appointment include shape from backend */
export type ApiAppointment = {
  id: string;
  appointmentCode?: string;
  scheduledAt: string;
  endAt?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  patient?: {
    id: string;
    user?: { fullName?: string | null; phone?: string | null } | null;
  } | null;
  doctor?: {
    id: string;
    user?: { fullName?: string | null } | null;
  } | null;
  service?: { name?: string | null } | null;
};

export type ReceptionistAppointment = {
  id: string;
  startTime: string;
  endTime?: string;
  scheduledAt?: string;
  status: AppointmentStatus;
  notes?: string | null;
  invoicePending?: boolean;
  patient?: { id: string; fullName: string; phone: string } | null;
  doctor?: { id: string; fullName: string } | null;
  service?: { name: string } | null;
};

function timeFromIso(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 19) || iso.slice(0, 5);
  return d.toTimeString().slice(0, 8);
}

export function mapAppointment(raw: ApiAppointment): ReceptionistAppointment {
  return {
    id: raw.id,
    startTime: timeFromIso(raw.scheduledAt),
    endTime: raw.endAt ? timeFromIso(raw.endAt) : undefined,
    scheduledAt: raw.scheduledAt,
    status: raw.status,
    notes: raw.notes,
    patient: raw.patient
      ? {
          id: raw.patient.id,
          fullName: raw.patient.user?.fullName ?? "Khách",
          phone: raw.patient.user?.phone ?? "",
        }
      : null,
    doctor: raw.doctor
      ? {
          id: raw.doctor.id,
          fullName: raw.doctor.user?.fullName ?? "",
        }
      : null,
    service: raw.service?.name ? { name: raw.service.name } : null,
  };
}

export function mapAppointments(list: ApiAppointment[] | unknown): ReceptionistAppointment[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) => mapAppointment(item as ApiAppointment));
}
