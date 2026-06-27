import type { AppointmentStatus } from "@/src/constants/appointment-status";

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  serviceName?: string;
  notes?: string;
};
