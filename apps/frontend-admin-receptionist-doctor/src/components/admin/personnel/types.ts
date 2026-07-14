export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST";
export type RoleFilter = Role | "ALL";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type DoctorProfile = {
  id: string;
  doctorCode: string;
  specialization: string;
  licenseNumber: string;
  isActive: boolean;
};

export type StaffUser = {
  id: string;
  doctorId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role | null;
  roles: string[];
  status: UserStatus;
  createdAt: string;
  doctorProfile: DoctorProfile | null;
};

export type StaffResponse = {
  data: StaffUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StaffFormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  doctorCode: string;
  specialization: string;
  licenseNumber: string;
};
