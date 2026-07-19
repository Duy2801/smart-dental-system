import type { StaffFormState, StaffUser } from "./types";

export function toStaffFormState(user: StaffUser): StaffFormState {
  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    password: "",
    role: user.role ?? "RECEPTIONIST",
    doctorCode: user.doctorProfile?.doctorCode ?? "",
    specialization: user.doctorProfile?.specialization ?? "",
    licenseNumber: user.doctorProfile?.licenseNumber ?? "",
    avatarUrl: user.doctorProfile?.avatarUrl ?? "",
  };
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
