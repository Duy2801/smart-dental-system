export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'in_progress'
  | 'rescheduled';

export type BookingDate = {
  id: string;
  weekday: string;
  day: string;
  month: string;
  isOpen: boolean;
};

export type TreatmentMethodItem = {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  price: string;
  rawPrice: number;
  durationMinutes: number;
};

export type AppointmentService = {
  id: string;
  name: string;
  category: string;
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
  tone: 'blue' | 'cyan' | 'violet';
  availableTimeSlots: string[];
};

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

export type BookingOptionsQuery = {
  serviceId?: string;
  treatmentMethodId?: string;
  doctorId?: string;
  date?: string;
  time?: string;
};

export type CreateAppointmentPayload = {
  patientId: string;
  doctorId: string;
  treatmentMethodId: string;
  scheduledAt: string;
  notes?: string;
  promotionCode?: string;
};

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type PromotionDto = {
  id: string;
  code: string;
  name: string;
  description: string;
  image_url?: string | null;
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
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};
