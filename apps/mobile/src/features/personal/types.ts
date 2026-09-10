export type PatientProfileGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export type PatientProfile = {
  id: string;
  patientCode: string;
  dateOfBirth?: string | null;
  gender?: PatientProfileGender;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  medicalHistory?: string | null;
};

export type PatientProfileUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roles?: string[];
  status?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string | null;
  patientProfile?: PatientProfile | null;
  patient?: PatientProfile | null; // Compatibility alias
};

export type PatientProfileUpdateBody = {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: PatientProfileGender;
  address?: string | null;
  medicalHistory?: string | null;
  allergies?: string[];
  email?: string;
};

export type ProfileFormState = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: PatientProfileGender;
  address: string;
};
