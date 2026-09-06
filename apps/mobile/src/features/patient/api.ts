import axios from 'axios';
import { api } from '~src/config';

type AnyRecord = Record<string, any>;

const getItems = <T>(payload: unknown): T[] => {
  const root = (payload as AnyRecord)?.data ?? payload;
  const items = (root as AnyRecord)?.data ?? root;
  return Array.isArray(items) ? items : [];
};

const asNumber = (value: unknown) => Number(value || 0);

export const formatVnd = (value?: number | string | null) =>
  `${new Intl.NumberFormat('vi-VN').format(asNumber(value))} đ`;

const formatDate = (value?: string | null) => {
  if (!value) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

export type PatientService = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  duration: string;
};

export type PatientDoctor = {
  avatarUrl: string | null;
  bio: string;
  bullets: string[];
  doctorCode?: string;
  id: string;
  name: string;
  specialization: string;
  position: string;
  workplace: string;
  yearsExperience: number;
  initials: string;
};

export type PatientPromotion = {
  id: string;
  name: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  expiry: string;
  status: 'active' | 'inactive';
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  image_url: string | null;
  is_active: boolean;
  applicable_service_slug?: string | null;
  applicable_treatment_method_id?: string | null;
  applicable_treatment_method?: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    basePrice: number;
    durationMinutes?: number | null;
    serviceId: string;
    category?: string | null;
    serviceSlug?: string | null;
  } | null;
};

export type PatientNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type PatientInvoice = {
  id: string;
  code: string;
  service: string;
  amount: number;
  paidAmount: number;
  status: string;
  paidAt: string | null;
};

export type ConsultationDoctor = {
  id: string;
  fullName: string;
  specialization: string;
  licenseNumber?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  yearsExperience: number;
  position?: string | null;
};

export type ConsultationDurationMinutes = 15 | 30 | 60;

export type ConsultationDurationOption = {
  minutes: ConsultationDurationMinutes;
  label: string;
  price: number;
  formattedPrice: string;
  description: string;
  tag?: string;
};

export type CreateConsultationPayload = {
  doctorId: string;
  scheduledAt: string;
  durationMinutes: ConsultationDurationMinutes;
  notes?: string;
};

export type PatientConsultation = {
  id: string;
  doctor: string;
  doctorSpecialization?: string;
  doctorAvatarUrl?: string | null;
  scheduledAt: string;
  time: string;
  duration: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
  notes?: string;
  meetingUrl?: string | null;
  fee?: number;
};

export const getPatientServices = async (): Promise<PatientService[]> => {
  const response = await api.get('/services', {
    params: { isActive: true, limit: 30, page: 1 },
  });

  return getItems<AnyRecord>(response.data).map(item => {
    const methods = item.treatmentMethods || item.treatment_methods || [];
    const activeMethods = Array.isArray(methods)
      ? methods.filter(method => method.isActive !== false)
      : [];
    const prices = activeMethods
      .map(method => asNumber(method.basePrice))
      .filter(price => price > 0);
    const durations = activeMethods
      .map(method => asNumber(method.durationMinutes))
      .filter(duration => duration > 0);

    return {
      id: String(item.id),
      title: item.title || item.name || 'Dịch vụ nha khoa',
      category: item.category || 'Điều trị',
      description:
        item.shortDescription ||
        item.description ||
        'Quy trình chăm sóc nha khoa được cá nhân hóa theo tình trạng răng miệng.',
      price: prices.length ? `Từ ${formatVnd(Math.min(...prices))}` : 'Liên hệ',
      duration: `${durations.length ? Math.min(...durations) : item.durationMinutes || 30} phút`,
    };
  });
};

export const getPatientDoctors = async (): Promise<PatientDoctor[]> => {
  const response = await api.get('/doctors');

  return getItems<AnyRecord>(response.data)
    .filter(item => item.isActive !== false && item.user?.status !== 'INACTIVE')
    .map(item => {
      const name = item.user?.fullName || item.fullName || 'Bác sĩ nha khoa';
      return {
        avatarUrl: item.avatarUrl || null,
        bio: item.bio || '',
        bullets: [
          item.position || item.specialization || 'Bác sĩ điều trị Răng Hàm Mặt',
          item.workplace ? `Bác sĩ chuyên khoa tại ${item.workplace}` : '',
          asNumber(item.yearsExperience) > 0
            ? `${asNumber(item.yearsExperience)}+ năm kinh nghiệm lâm sàng`
            : '',
          item.bio || '',
        ].filter(Boolean),
        doctorCode: item.doctorCode,
        id: String(item.id),
        name,
        specialization: item.specialization || 'Răng Hàm Mặt',
        position: item.position || 'Bác sĩ điều trị',
        workplace: item.workplace || 'Smart Dental',
        yearsExperience: asNumber(item.yearsExperience),
        initials: getInitials(name) || 'BS',
      };
    });
};

export const getPatientPromotions = async (search?: string): Promise<PatientPromotion[]> => {
  const response = await api.get('/promotions', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });

  return getItems<AnyRecord>(response.data).map(item => {
    const rawType = String(item.discountType || item.discount_type || 'PERCENTAGE').toUpperCase();
    const discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' =
      rawType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE';
    const discountValue = asNumber(item.discountValue ?? item.discount_value ?? item.value);
    const startDate = item.startDate || item.start_date || '';
    const endDate = item.endDate || item.end_date || item.validTo || '';
    const isActive = item.isActive !== false && item.is_active !== false;
    const name = item.name || item.title || 'Ưu đãi nha khoa';

    return {
      id: String(item.id),
      name,
      title: name,
      description: item.description || 'Chương trình ưu đãi dành cho bệnh nhân Smart Dental.',
      code: item.code || item.promoCode || 'SMARTDENTAL',
      discount:
        discountType === 'PERCENTAGE'
          ? `${discountValue}%`
          : formatVnd(discountValue),
      expiry: formatDate(endDate),
      status: isActive ? 'active' : 'inactive',
      discount_type: discountType,
      discount_value: discountValue,
      min_order_amount: asNumber(item.minOrderAmount ?? item.min_order_amount),
      max_discount_amount: item.maxDiscountAmount ?? item.max_discount_amount ?? null,
      max_uses: asNumber(item.maxUses ?? item.max_uses),
      used_count: asNumber(item.usedCount ?? item.used_count),
      start_date: startDate,
      end_date: endDate,
      image_url: item.imageUrl || item.image_url || null,
      is_active: isActive,
      applicable_service_slug: item.applicable_service_slug || item.applicableServiceSlug || null,
      applicable_treatment_method_id:
        item.applicable_treatment_method_id || item.applicableTreatmentMethodId || null,
      applicable_treatment_method:
        item.applicable_treatment_method || item.applicableTreatmentMethod || null,
    };
  });
};

export const getPatientNotifications = async (): Promise<PatientNotification[]> => {
  try {
    const response = await api.get('/notifications/my-notifications', {
      params: { limit: 30, page: 1 },
    });

    return getItems<AnyRecord>(response.data).map(item => ({
      id: String(item.id),
      title: item.title || 'Thông báo',
      message: item.message || item.content || 'Bạn có cập nhật mới từ Smart Dental.',
      type: item.type || 'GENERAL',
      isRead: Boolean(item.isRead ?? item.is_read ?? item.readAt),
      createdAt: formatDate(item.createdAt || item.created_at),
    }));
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status || 0)) {
      return [];
    }
    throw error;
  }
};

export const markPatientNotificationRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllPatientNotificationsRead = async () => {
  await api.patch('/notifications/read-all');
};

export const getPatientInvoices = async (): Promise<PatientInvoice[]> => {
  try {
    const response = await api.get('/invoices', {
      params: { limit: 30, page: 1 },
    });

    return getItems<AnyRecord>(response.data).map(item => ({
      id: String(item.id),
      code: item.invoiceCode || item.code || 'INV',
      service:
        item.appointment?.service?.name ||
        item.treatmentPlan?.title ||
        item.service ||
        'Dịch vụ nha khoa',
      amount: asNumber(item.finalAmount ?? item.totalAmount ?? item.amount),
      paidAmount: asNumber(item.paidAmount),
      status: item.status || 'PENDING',
      paidAt: item.paidAt || null,
    }));
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status || 0)) {
      return [];
    }
    throw error;
  }
};

export const getConsultationPackages = async (): Promise<ConsultationDurationOption[]> => {
  const response = await api.get('/video-consultations/packages');
  const items = getItems<ConsultationDurationOption>(response.data);
  return items.map(item => ({
    minutes: (Number(item.minutes) || 30) as ConsultationDurationMinutes,
    label: item.label || `${item.minutes} phút`,
    price: Number(item.price) || 100000,
    formattedPrice: item.formattedPrice || formatVnd(item.price),
    description: item.description || 'Gói tư vấn trực tuyến cùng Bác sĩ chuyên khoa.',
    tag: item.tag || undefined,
  }));
};

export const getConsultationDoctors = async (): Promise<ConsultationDoctor[]> => {
  const response = await api.get('/video-consultations/consultation-doctors');
  const items = getItems<AnyRecord>(response.data);
  return items.map(doc => ({
    id: String(doc.id),
    fullName: doc.fullName || doc.name || 'Bác sĩ chuyên khoa',
    specialization: doc.specialization || 'Bác sĩ Răng Hàm Mặt',
    licenseNumber: doc.licenseNumber,
    avatarUrl: doc.avatarUrl || null,
    bio: doc.bio || null,
    yearsExperience: asNumber(doc.yearsExperience) || 5,
    position: doc.position || 'Bác sĩ tư vấn',
  }));
};

export const getAvailableConsultationSlots = async (
  doctorId: string,
  date: string,
  durationMinutes: number,
): Promise<string[]> => {
  const response = await api.get('/video-consultations/available-slots', {
    params: { doctorId, date, durationMinutes },
  });
  return getItems<string>(response.data);
};

export const createConsultationBooking = async (
  payload: CreateConsultationPayload,
): Promise<any> => {
  const response = await api.post('/video-consultations/booking', payload);
  return response.data;
};

export const cancelMyConsultation = async (id: string): Promise<any> => {
  const response = await api.patch(`/video-consultations/patient/${id}/cancel`);
  return response.data;
};

export const getConsultationPaymentInfo = async (id: string): Promise<any> => {
  const response = await api.get(`/video-consultations/patient/${id}/payment-info`);
  return response.data;
};

export const getPatientConsultations = async (): Promise<PatientConsultation[]> => {
  try {
    const response = await api.get('/video-consultations/patient/my-consultations');

    return getItems<AnyRecord>(response.data).map(item => {
      const scheduledAt = item.scheduledAt || item.startTime || item.appointmentAt;
      const date = scheduledAt ? new Date(scheduledAt) : null;
      const isPaid = Boolean(item.isPaid || item.paymentStatus === 'PAID' || item.payment?.status === 'SUCCESS');
      return {
        id: String(item.id),
        doctor: item.doctorName || item.doctor?.user?.fullName || item.doctor?.fullName || 'Bác sĩ tư vấn',
        doctorSpecialization: item.doctorSpecialization || item.doctor?.specialization || 'Răng Hàm Mặt',
        doctorAvatarUrl: item.doctorAvatarUrl || item.doctor?.avatarUrl || null,
        scheduledAt: scheduledAt || '',
        time: date
          ? new Intl.DateTimeFormat('vi-VN', {
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              month: '2-digit',
            }).format(date)
          : 'Đang cập nhật',
        duration: `${item.durationMinutes || item.duration || 30} phút`,
        durationMinutes: asNumber(item.durationMinutes || item.duration || 30),
        status: item.status || 'SCHEDULED',
        paymentStatus: item.paymentStatus || (isPaid ? 'PAID' : 'PENDING'),
        isPaid,
        notes: item.notes || '',
        meetingUrl: item.meetingUrl || null,
        fee: asNumber(item.fee),
      };
    });
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 404].includes(error.response?.status || 0)) {
      return [];
    }
    throw error;
  }
};
