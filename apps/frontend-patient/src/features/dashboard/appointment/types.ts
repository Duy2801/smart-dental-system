import type { DashboardIconName } from "../common/DashboardIcon";

export type TreatmentMethodItem = {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  price: string;
  rawPrice: number;
  durationMinutes: number;
};

export type AppointmentService = {
  id: string;
  name: string;
  category?: string;
  description: string;
  icon: string;
  href: string;
  treatmentMethods: TreatmentMethodItem[];
};

export type Dentist = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  initials: string;
  tone: "blue" | "cyan" | "violet";
  availableTimeSlots: string[];
};

export type BookingDate = {
  id: string;
  weekday: string;
  day: string;
  month: string;
  isOpen: boolean;
};

export type CurrentAppointment = {
  service: string;
  date: string;
  time: string;
  doctor: string;
  status: string;
};

export type NotificationPreferences = {
  email: boolean;
  app: boolean;
  sms: boolean;
};
