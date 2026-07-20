import type { DashboardIconName } from "../common/DashboardIcon";

export type AppointmentService = {
  id: string;
  name: string;
  description: string;
  icon: DashboardIconName;
  price: string;
  durationMinutes: number;
  href: string;
};

export type Dentist = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  initials: string;
  tone: "blue" | "cyan" | "violet";
};

export type BookingDate = {
  id: string;
  weekday: string;
  day: string;
  month: string;
  isOpen: boolean;
};

export type AppointmentPaymentOption =
  | "DEPOSIT_30_PERCENT"
  | "PAY_AT_COUNTER";

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
