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
    label: "Quan tri vien",
    color: "border-purple-200 bg-purple-50 text-purple-700",
  },
  DOCTOR: {
    label: "Bac si",
    color: "border-blue-200 bg-blue-50 text-blue-700",
  },
  RECEPTIONIST: {
    label: "Le tan",
    color: "border-orange-200 bg-orange-50 text-orange-700",
  },
};
