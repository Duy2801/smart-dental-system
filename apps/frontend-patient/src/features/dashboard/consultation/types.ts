export type ConsultationDoctor = {
  id: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
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
  attachments?: string[];
};

export type ConsultationPaymentInfo = {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  amount: number;
  method: string;
  status: string;
  transferContent: string;
  bankAccountNo: string;
  bankAccountName: string;
  bankBin: string;
  bankName: string;
  qrImageUrl: string;
  provider: string;
};

export type ConsultationBookingResult = {
  consultation: {
    id: string;
    patientId: string;
    patientName: string;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
    fee: number;
    isPaid: boolean;
    notes?: string | null;
  };
  invoice: {
    id: string;
    invoiceCode: string;
    finalAmount: number;
  };
  payment: ConsultationPaymentInfo;
};

export type PatientConsultationItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  meetingUrl?: string | null;
  roomPin?: string | null;
  fee: number;
  isPaid: boolean;
  notes?: string | null;
  createdAt: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorAvatarUrl?: string | null;
};
