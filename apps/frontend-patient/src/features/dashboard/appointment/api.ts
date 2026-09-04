import apiClient from "@/lib/axios";
import axios from "axios";
import type { DashboardIconName } from "../common/DashboardIcon";
import type { AppointmentService, BookingDate, Dentist } from "./types";

type TreatmentMethodDto = {
  id: string;
  serviceId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: string | number;
  durationMinutes?: number | null;
};

type ServiceDto = {
  id: string;
  category: string;
  name: string;
  slug?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  icon?: string | null;
  treatmentMethods?: TreatmentMethodDto[];
};

type DoctorDto = {
  id: string;
  specialization: string;
  yearsExperience?: number;
  isActive: boolean;
  availableTimeSlots?: string[];
  user: {
    fullName: string;
    status?: string;
  };
};

type BookingOptionsDto = {
  services: ServiceDto[];
  doctors: DoctorDto[];
  dates: BookingDate[];
  timeSlots: string[];
  slotIntervalMinutes?: number;
};

export type BookingOptionsQuery = {
  serviceId?: string;
  treatmentMethodId?: string;
  doctorId?: string;
  date?: string;
  time?: string;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "missed"
  | "in_progress"
  | "rescheduled";

export type AppointmentItem = {
  id: string;
  patientId?: string | null;
  patientName?: string | null;
  patientRelationship?: string | null;
  doctorId: string;
  serviceId: string;
  scheduledAt: string;
  endAt: string;
  durationMinutes: number;
  dateId: string;
  doctor: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  initials: string;
  paymentOption?: string;
  paymentStatus?: string;
  preparation?: string[];
  rescheduleCount?: number;
};

export type PatientAppointmentsData = {
  upcoming: AppointmentItem[];
  history: AppointmentItem[];
};

type AppointmentDto = {
  id: string;
  patientId?: string | null;
  doctorId: string;
  serviceId: string;
  scheduledAt: string;
  endAt: string;
  status: string;
  paymentOption?: string;
  paymentStatus?: string;
  invoices?: Array<{
    id: string;
    invoiceType: string;
    status: string;
    finalAmount: number | string;
  }>;
  doctor: {
    user: {
      fullName: string;
    };
  };
  patient?: {
    id: string;
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    user?: {
      fullName: string;
      phone?: string | null;
      email?: string | null;
    } | null;
    patientAccounts?: Array<{ relationship: string }>;
  } | null;
  service: {
    name: string;
    durationMinutes?: number;
  };
  rescheduleHistory?: unknown;
};

type CreateAppointmentPayload = {
  patientId: string;
  doctorId: string;
  treatmentMethodId: string;
  scheduledAt: string;
  notes?: string;
  promotionCode?: string;
};

export type PatientProfile = {
  id: string;
  patientCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  gender?: string;
  dateOfBirth?: string | null;
  address?: string | null;
  medicalHistory?: string | null;
  relationship: string;
  isPrimary: boolean;
  canBook: boolean;
  lastVisit?: string | null;
};

export type CreatePatientProfilePayload = {
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  relationship?: string;
  address?: string;
  medicalHistory?: string;
};

type BookingPolicyDto = {
  noShowCount?: number;
  requiresDeposit?: boolean;
  onlineBookingBlocked?: boolean;
};

type CreateAppointmentResponseDto = AppointmentDto & {
  bookingPolicy?: BookingPolicyDto;
};

export type BookingPolicySummary = {
  noShowCount: number;
  requiresDeposit: boolean;
  onlineBookingBlocked: boolean;
};

export type CreateAppointmentResult = {
  appointment: AppointmentItem;
  bookingPolicy: BookingPolicySummary | null;
};

const serviceIconMap: Record<string, DashboardIconName> = {
  implant: "implant",
  orthodontics: "braces",
  whitening: "sparkles",
  extraction: "extraction",
  endodontics: "rootCanal",
  cleaning: "cleaning",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeStatus(status: string): AppointmentStatus {
  const value = status.toUpperCase();
  if (value === "CONFIRMED") return "confirmed";
  if (value === "COMPLETED") return "completed";
  if (value === "CANCELLED") return "cancelled";
  if (value === "NO_SHOW") return "missed";
  if (value === "IN_PROGRESS" || value === "CHECKED_IN") return "in_progress";
  if (value === "RESCHEDULED") return "rescheduled";
  return "pending";
}

function mapAppointment(item: AppointmentDto): AppointmentItem {
  const scheduledAt = new Date(item.scheduledAt);
  const doctorName = item.doctor?.user?.fullName ?? "Bác sĩ phòng khám";
  const serviceName = item.service?.name ?? "Dịch vụ nha khoa";
  const patientName =
    item.patient?.fullName ?? item.patient?.user?.fullName ?? null;
  return {
    id: item.id,
    patientId: item.patientId ?? item.patient?.id ?? null,
    patientName,
    patientRelationship:
      item.patient?.patientAccounts?.[0]?.relationship ?? null,
    doctorId: item.doctorId,
    serviceId: item.serviceId,
    scheduledAt: item.scheduledAt,
    endAt: item.endAt,
    durationMinutes: item.service?.durationMinutes ?? 30,
    dateId: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(scheduledAt),
    doctor: doctorName,
    service: serviceName,
    date: new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(scheduledAt),
    time: new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    }).format(scheduledAt),
    status: normalizeStatus(item.status ?? "PENDING"),
    initials: getInitials(doctorName),
    paymentOption: item.paymentOption,
    paymentStatus: item.paymentStatus,
    rescheduleCount: Array.isArray(item.rescheduleHistory)
      ? item.rescheduleHistory.length
      : 0,
    preparation: [
      "Đến trước giờ hẹn 10 phút",
      "Mang theo hồ sơ điều trị nếu có",
    ],
  };
}

function mapTreatmentMethod(item: TreatmentMethodDto) {
  const rawPrice = Number(item.basePrice ?? 0);
  return {
    id: item.id,
    serviceId: item.serviceId,
    name: item.name,
    description: item.description || "",
    imageUrl: item.imageUrl ?? null,
    price: new Intl.NumberFormat("vi-VN").format(rawPrice),
    rawPrice,
    durationMinutes: item.durationMinutes ?? 30,
  };
}

function mapService(item: ServiceDto): AppointmentService {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description:
      item.shortDescription ||
      item.description ||
      "Dịch vụ nha khoa chuyên nghiệp.",
    icon: item.icon ?? "shield",
    href: `/service/${item.id}`,
    treatmentMethods: (item.treatmentMethods ?? []).map(mapTreatmentMethod),
  };
}

function mapDoctor(item: DoctorDto, index: number): Dentist {
  const tones: Dentist["tone"][] = ["blue", "cyan", "violet"];

  return {
    id: item.id,
    name: item.user.fullName,
    specialty: item.specialization,
    experience: `${item.yearsExperience ?? 0} năm`,
    initials: getInitials(item.user.fullName),
    tone: tones[index % tones.length],
    availableTimeSlots: item.availableTimeSlots ?? [],
  };
}

export async function getAppointmentOptions(query: BookingOptionsQuery = {}) {
  const response = await apiClient.get<BookingOptionsDto>(
    "/appointments/booking-options",
    { params: query },
  );

  return {
    services: response.data.services.map(mapService),
    doctors: response.data.doctors
      .filter((doctor) => doctor.isActive && doctor.user.status !== "INACTIVE")
      .map(mapDoctor),
    dates: response.data.dates,
    timeSlots: response.data.timeSlots,
    slotIntervalMinutes: response.data.slotIntervalMinutes ?? 30,
  };
}

export async function getPatientAppointments() {
  const [upcomingResponse, historyResponse] = await Promise.all([
    apiClient
      .get<AppointmentDto[]>("/appointments/upcoming")
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { data: [] as AppointmentDto[] };
        }
        throw error;
      }),
    apiClient
      .get<AppointmentDto[]>("/appointments/history")
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { data: [] as AppointmentDto[] };
        }
        throw error;
      }),
  ]);

  return {
    upcoming: upcomingResponse.data.map(mapAppointment),
    history: historyResponse.data.map(mapAppointment),
  };
}

export async function createPatientAppointment(
  payload: CreateAppointmentPayload,
) {
  const response = await apiClient.post<CreateAppointmentResponseDto>(
    "/appointments",
    payload,
  );

  return {
    appointment: mapAppointment(response.data),
    bookingPolicy: response.data.bookingPolicy
      ? {
          noShowCount: response.data.bookingPolicy.noShowCount ?? 0,
          requiresDeposit: Boolean(response.data.bookingPolicy.requiresDeposit),
          onlineBookingBlocked: Boolean(
            response.data.bookingPolicy.onlineBookingBlocked,
          ),
        }
      : null,
  } satisfies CreateAppointmentResult;
}

export async function getManagedPatientProfiles() {
  const response = await apiClient.get<PatientProfile[]>(
    "/patients/me/profiles",
  );
  return response.data;
}

export async function createManagedPatientProfile(
  payload: CreatePatientProfilePayload,
) {
  const response = await apiClient.post<PatientProfile>(
    "/patients/me/profiles",
    payload,
  );
  return response.data;
}

export async function cancelPatientAppointment(appointmentId: string) {
  const response = await apiClient.patch<AppointmentDto>(
    `/appointments/${appointmentId}/cancel`,
  );
  return mapAppointment(response.data);
}

export async function confirmPatientAppointment(appointmentId: string) {
  const response = await apiClient.patch<AppointmentDto>(
    `/appointments/${appointmentId}/confirm`,
  );
  return mapAppointment(response.data);
}

export async function restorePatientAppointment(appointmentId: string) {
  const response = await apiClient.patch<AppointmentDto>(
    `/appointments/${appointmentId}/restore`,
  );
  return mapAppointment(response.data);
}

export async function reschedulePatientAppointment(
  appointmentId: string,
  payload: { scheduledAt: string },
) {
  const response = await apiClient.patch<AppointmentDto>(
    `/appointments/${appointmentId}/reschedule`,
    payload,
  );
  return mapAppointment(response.data);
}
