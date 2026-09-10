import { api } from '~src/config';
import type { PatientProfileUpdateBody, PatientProfileUser } from './types';

export function unwrapData<T>(res: any): T {
  if (!res) return res;
  if (res.data && res.data.data !== undefined) return res.data.data;
  if (res.data !== undefined) return res.data;
  return res;
}

export const apiGetPatientProfile = async (): Promise<PatientProfileUser> => {
  const response = await api.get('/auth/me');
  const user = unwrapData<PatientProfileUser>(response);
  // Guarantee compatibility between patient and patientProfile
  if (user && !user.patient && user.patientProfile) {
    user.patient = user.patientProfile;
  }
  return user;
};

export const apiUpdatePatientProfile = async (
  body: PatientProfileUpdateBody,
): Promise<PatientProfileUser> => {
  const response = await api.patch('/patients/me', body);
  const user = unwrapData<PatientProfileUser>(response);
  if (user && !user.patient && user.patientProfile) {
    user.patient = user.patientProfile;
  }
  return user;
};

export const apiChangePassword = async (body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/auth/change-password', body);
  return unwrapData<{ success: boolean; message: string }>(response);
};

export function getInitials(name?: string): string {
  if (!name || name.trim() === '' || name.toLowerCase().includes('khách hàng')) {
    return 'KH';
  }
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDateToInput(value?: string | null): string {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export function parseDateInputToISO(value: string): string | undefined {
  if (!value || !value.trim()) return undefined;
  const trimmed = value.trim();

  // If DD/MM/YYYY format
  const slashParts = trimmed.split('/');
  if (slashParts.length === 3) {
    const day = slashParts[0].padStart(2, '0');
    const month = slashParts[1].padStart(2, '0');
    const year = slashParts[2];
    if (year.length === 4) {
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }
  }

  // If YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

