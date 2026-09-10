import axios from 'axios';
import { api } from '~src/config';
import type {
  AppointmentItem,
  AppointmentService,
  AppointmentStatus,
  BookingDate,
  BookingOptionsQuery,
  CreateAppointmentPayload,
  CreatePatientProfilePayload,
  Dentist,
  PatientAppointmentsData,
  PatientProfile,
  PromotionDto,
  TreatmentMethodItem,
} from '../types';

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
  rescheduleHistory?: unknown[];
};

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

export const normalizeStatus = (status?: string): AppointmentStatus => {
  const value = (status || 'PENDING').toUpperCase();
  if (value === 'CONFIRMED') return 'confirmed';
  if (value === 'COMPLETED') return 'completed';
  if (value === 'CANCELLED') return 'cancelled';
  if (value === 'NO_SHOW') return 'missed';
  if (value === 'IN_PROGRESS' || value === 'CHECKED_IN') return 'in_progress';
  if (value === 'RESCHEDULED') return 'rescheduled';
  return 'pending';
};

export const formatCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null || value === '') return 'Liên hệ';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${new Intl.NumberFormat('vi-VN').format(num)} đ`;
};

export const formatTimeRange = (time: string, durationMinutes = 30) => {
  if (!time) return '--:--';
  const parts = time.split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return time;
  const [hour, minute] = parts;
  const startMin = hour * 60 + minute;
  const endMin = startMin + durationMinutes;
  const endHour = Math.floor(endMin / 60) % 24;
  const endMinute = endMin % 60;
  const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  return `${time} - ${endStr}`;
};

const mapAppointment = (item: AppointmentDto): AppointmentItem => {
  const scheduledAt = new Date(item.scheduledAt);
  const doctorName = item.doctor?.user?.fullName ?? 'Bác sĩ phòng khám';
  const serviceName = item.service?.name ?? 'Dịch vụ nha khoa';
  const patientName = item.patient?.fullName ?? item.patient?.user?.fullName ?? null;

  return {
    id: item.id,
    patientId: item.patientId ?? item.patient?.id ?? null,
    patientName,
    patientRelationship: item.patient?.patientAccounts?.[0]?.relationship ?? null,
    doctorId: item.doctorId,
    serviceId: item.serviceId,
    scheduledAt: item.scheduledAt,
    endAt: item.endAt,
    durationMinutes: item.service?.durationMinutes ?? 30,
    dateId: new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(scheduledAt),
    doctor: doctorName,
    service: serviceName,
    date: new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(scheduledAt),
    time: new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    }).format(scheduledAt),
    status: normalizeStatus(item.status ?? 'PENDING'),
    initials: getInitials(doctorName) || 'BS',
    paymentOption: item.paymentOption,
    paymentStatus: item.paymentStatus,
    rescheduleCount: Array.isArray(item.rescheduleHistory) ? item.rescheduleHistory.length : 0,
    preparation: [
      'Đến trước giờ hẹn 10-15 phút để làm thủ tục check-in tại quầy',
      'Mang theo hồ sơ điều trị hoặc kết quả chụp phim gần nhất nếu có',
    ],
  };
};

const mapTreatmentMethod = (item: TreatmentMethodDto): TreatmentMethodItem => {
  const rawPrice = Number(item.basePrice ?? 0);
  return {
    id: item.id,
    serviceId: item.serviceId,
    name: item.name,
    description: item.description || '',
    imageUrl: item.imageUrl ?? null,
    price: new Intl.NumberFormat('vi-VN').format(rawPrice),
    rawPrice,
    durationMinutes: item.durationMinutes ?? 30,
  };
};

const mapService = (item: ServiceDto): AppointmentService => ({
  id: item.id,
  name: item.name,
  category: item.category,
  description: item.shortDescription || item.description || 'Dịch vụ nha khoa chuyên nghiệp.',
  icon: item.icon ?? 'tooth',
  href: `/service/${item.id}`,
  treatmentMethods: (item.treatmentMethods ?? []).map(mapTreatmentMethod),
});

const mapDoctor = (item: DoctorDto, index: number): Dentist => {
  const tones: Dentist['tone'][] = ['blue', 'cyan', 'violet'];
  return {
    id: item.id,
    name: item.user.fullName,
    specialty: item.specialization,
    experience: `${item.yearsExperience ?? 0} năm`,
    initials: getInitials(item.user.fullName) || 'BS',
    tone: tones[index % tones.length],
    availableTimeSlots: item.availableTimeSlots ?? [],
  };
};

export function unwrapData<T>(res: any): T {
  let current = res?.data !== undefined ? res.data : res;
  while (
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    'data' in current &&
    current.data !== undefined
  ) {
    current = current.data;
  }
  return current as T;
}

export async function getAppointmentOptions(query: BookingOptionsQuery = {}) {
  const response = await api.get('/appointments/booking-options', {
    params: query,
  });

  const raw = unwrapData<BookingOptionsDto>(response);
  const servicesList = Array.isArray(raw?.services) ? raw.services : [];
  const doctorsList = Array.isArray(raw?.doctors) ? raw.doctors : [];
  const datesList = Array.isArray(raw?.dates) ? raw.dates : [];
  const timeSlotsList = Array.isArray(raw?.timeSlots) ? raw.timeSlots : [];

  return {
    services: servicesList.map(mapService),
    doctors: doctorsList
      .filter(doctor => doctor.isActive && doctor.user?.status !== 'INACTIVE')
      .map(mapDoctor),
    dates: datesList,
    timeSlots: timeSlotsList,
    slotIntervalMinutes: raw?.slotIntervalMinutes ?? 30,
  };
}

export async function getPatientAppointments(): Promise<PatientAppointmentsData> {
  const [upcomingResponse, historyResponse] = await Promise.all([
    api
      .get('/appointments/upcoming')
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { data: [] };
        }
        throw error;
      }),
    api
      .get('/appointments/history')
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { data: [] };
        }
        throw error;
      }),
  ]);

  const rawUpcoming = unwrapData<AppointmentDto[]>(upcomingResponse);
  const rawHistory = unwrapData<AppointmentDto[]>(historyResponse);

  const upcomingList = Array.isArray(rawUpcoming) ? rawUpcoming : [];
  const historyList = Array.isArray(rawHistory) ? rawHistory : [];

  return {
    upcoming: upcomingList.map(mapAppointment),
    history: historyList.map(mapAppointment),
  };
}

export async function createPatientAppointment(payload: CreateAppointmentPayload) {
  const response = await api.post('/appointments', payload);
  const data = unwrapData<AppointmentDto>(response);
  return mapAppointment(data);
}

export async function getManagedPatientProfiles(): Promise<PatientProfile[]> {
  const response = await api.get('/patients/me/profiles');
  const data = unwrapData<PatientProfile[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function createManagedPatientProfile(
  payload: CreatePatientProfilePayload,
): Promise<PatientProfile> {
  const response = await api.post('/patients/me/profiles', payload);
  return unwrapData<PatientProfile>(response);
}

export async function cancelPatientAppointment(appointmentId: string) {
  const response = await api.patch(`/appointments/${appointmentId}/cancel`);
  const data = unwrapData<AppointmentDto>(response);
  return mapAppointment(data);
}

export async function reschedulePatientAppointment(
  appointmentId: string,
  payload: { scheduledAt: string },
) {
  const response = await api.patch(
    `/appointments/${appointmentId}/reschedule`,
    payload,
  );
  const data = unwrapData<AppointmentDto>(response);
  return mapAppointment(data);
}

export async function getPromotions(): Promise<PromotionDto[]> {
  try {
    const response = await api.get('/promotions', {
      params: { is_active: true, limit: 30, page: 1 },
    });
    const items = unwrapData<any[]>(response);
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      id: String(item.id),
      code: item.code || item.promoCode || '',
      name: item.name || item.title || '',
      description: item.description || '',
      image_url: item.imageUrl || item.image_url || null,
      applicable_service_slug: item.applicableServiceSlug || item.applicable_service_slug || null,
      applicable_treatment_method_id:
        item.applicableTreatmentMethodId || item.applicable_treatment_method_id || null,
      applicable_treatment_method: item.applicableTreatmentMethod || item.applicable_treatment_method || null,
      discount_type: (item.discountType || item.discount_type || 'PERCENTAGE').toUpperCase(),
      discount_value: Number(item.discountValue ?? item.discount_value ?? 0),
      min_order_amount: Number(item.minOrderAmount ?? item.min_order_amount ?? 0),
      max_discount_amount: item.maxDiscountAmount || item.max_discount_amount ? Number(item.maxDiscountAmount || item.max_discount_amount) : null,
      max_uses: Number(item.maxUses ?? item.max_uses ?? 0),
      used_count: Number(item.usedCount ?? item.used_count ?? 0),
      start_date: item.startDate || item.start_date || '',
      end_date: item.endDate || item.end_date || item.validTo || '',
      is_active: item.isActive ?? item.is_active ?? true,
    }));
  } catch {
    return [];
  }
}

export function calculateDiscount(
  promo: PromotionDto,
  basePrice: number,
): { discountAmount: number; finalPrice: number } {
  if (!basePrice || basePrice <= 0) {
    return { discountAmount: 0, finalPrice: 0 };
  }

  let discount = 0;
  if (promo.discount_type === 'PERCENTAGE') {
    discount = (basePrice * promo.discount_value) / 100;
    if (promo.max_discount_amount && promo.max_discount_amount > 0) {
      discount = Math.min(discount, promo.max_discount_amount);
    }
  } else {
    discount = promo.discount_value;
  }

  discount = Math.min(discount, basePrice);
  const finalPrice = Math.max(0, basePrice - discount);
  return { discountAmount: discount, finalPrice };
}

export function isPromotionApplicable(
  promotion: PromotionDto,
  input: {
    basePrice: number;
    serviceId?: string;
    treatmentMethodId?: string;
  },
) {
  const now = Date.now();
  const startsAt = new Date(promotion.start_date).getTime();
  const endsAt = new Date(promotion.end_date).getTime();
  const minOrderAmount = promotion.min_order_amount ?? 0;
  const isExhausted =
    promotion.max_uses > 0 && promotion.used_count >= promotion.max_uses;

  if (
    !promotion.is_active ||
    Number.isNaN(startsAt) ||
    Number.isNaN(endsAt) ||
    startsAt > now ||
    endsAt < now ||
    isExhausted ||
    input.basePrice < minOrderAmount
  ) {
    return false;
  }

  if (promotion.applicable_treatment_method_id) {
    return promotion.applicable_treatment_method_id === input.treatmentMethodId;
  }

  if (promotion.applicable_treatment_method?.serviceId) {
    return promotion.applicable_treatment_method.serviceId === input.serviceId;
  }

  return true;
}

export function pickBestPromotion(promotions: PromotionDto[], basePrice: number) {
  return promotions.reduce<PromotionDto | null>((best, promotion) => {
    if (!best) return promotion;
    const currentDiscount = calculateDiscount(promotion, basePrice).discountAmount;
    const bestDiscount = calculateDiscount(best, basePrice).discountAmount;
    return currentDiscount > bestDiscount ? promotion : best;
  }, null);
}
