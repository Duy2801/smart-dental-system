import apiClient from '@/lib/axios';
import type {
  ConsultationBookingResult,
  ConsultationDoctor,
  ConsultationDurationMinutes,
  ConsultationDurationOption,
  CreateConsultationPayload,
  PatientConsultationItem,
} from './types';

export async function getConsultationPackages(): Promise<ConsultationDurationOption[]> {
  const response = await apiClient.get<ConsultationDurationOption[]>(
    '/video-consultations/packages',
  );
  return response.data;
}

export async function getConsultationDoctors(): Promise<ConsultationDoctor[]> {
  const response = await apiClient.get<ConsultationDoctor[]>(
    '/video-consultations/consultation-doctors',
  );
  return response.data;
}

export async function getAvailableConsultationSlots(
  doctorId: string,
  date: string,
  durationMinutes: ConsultationDurationMinutes,
): Promise<string[]> {
  const response = await apiClient.get<string[]>(
    '/video-consultations/available-slots',
    {
      params: { doctorId, date, durationMinutes },
    },
  );
  return response.data;
}

export async function createConsultationBooking(
  payload: CreateConsultationPayload,
): Promise<ConsultationBookingResult> {
  const response = await apiClient.post<ConsultationBookingResult>(
    '/video-consultations/booking',
    payload,
  );
  return response.data;
}

export async function getMyConsultations(): Promise<PatientConsultationItem[]> {
  const response = await apiClient.get<PatientConsultationItem[]>(
    '/video-consultations/patient/my-consultations',
  );
  return response.data;
}

export async function cancelMyConsultation(id: string): Promise<{
  consultation: PatientConsultationItem;
  refundInfo: {
    hoursUntilBooking: number;
    refundPercent: number;
    refundAmount: number;
    note: string;
  };
}> {
  const response = await apiClient.patch<{
    consultation: PatientConsultationItem;
    refundInfo: {
      hoursUntilBooking: number;
      refundPercent: number;
      refundAmount: number;
      note: string;
    };
  }>(`/video-consultations/patient/${id}/cancel`);
  return response.data;
}

export async function getConsultationPaymentInfo(id: string): Promise<{
  consultationId?: string;
  isPaid: boolean;
  fee?: number;
  invoice?: {
    id: string;
    invoiceCode: string;
    finalAmount: number;
  };
  payment?: {
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
}> {
  const response = await apiClient.get<{
    consultationId?: string;
    isPaid: boolean;
    fee?: number;
    invoice?: {
      id: string;
      invoiceCode: string;
      finalAmount: number;
    };
    payment?: {
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
  }>(`/video-consultations/patient/${id}/payment-info`);
  return response.data;
}

export async function joinPatientConsultationRoom(id: string): Promise<{
  id: string;
  meetingUrl: string;
  roomPin: string | null;
  doctorName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
}> {
  const response = await apiClient.post<{
    id: string;
    meetingUrl: string;
    roomPin: string | null;
    doctorName: string;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
  }>(`/video-consultations/patient/${id}/join`);
  return response.data;
}

