export type UserRole = 'DOCTOR' | 'PATIENT';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export const getSupportedRole = (roles: string[]): UserRole | null => {
  if (roles.includes('DOCTOR')) return 'DOCTOR';
  if (roles.includes('PATIENT')) return 'PATIENT';
  return null;
};
