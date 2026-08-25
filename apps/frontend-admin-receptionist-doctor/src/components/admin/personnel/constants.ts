import type { Role, StaffFormState } from "./types";

export const emptyStaffForm: StaffFormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "RECEPTIONIST",
  doctorCode: "",
  specialization: "",
  licenseNumber: "",
  avatarUrl: "",
};

export const roleConfig: Record<Role, { label: string; color: string }> = {
  ADMIN: {
    label: "Quản trị viên",
    color: "border-purple-200 bg-purple-50 text-purple-700",
  },
  DOCTOR: {
    label: "Bác sĩ",
    color: "border-blue-200 bg-blue-50 text-blue-700",
  },
  RECEPTIONIST: {
    label: "Lễ tân",
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
};
