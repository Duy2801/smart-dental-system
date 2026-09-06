import { api } from '~src/config';

export type PatientProfileUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  patient?: {
    id: string;
    patientCode: string;
    gender?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    medicalHistory?: string | null;
  } | null;
};

export const apiGetPatientProfile = async () => {
  const response = await api.get<PatientProfileUser>('/auth/me');
  return response.data;
};
