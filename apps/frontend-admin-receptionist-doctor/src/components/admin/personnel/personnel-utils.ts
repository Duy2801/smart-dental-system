import { getApiErrorMessage } from "@/src/lib/utils/api-error";
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

const PERSONNEL_ERRORS: Record<string, string> = {
  "user.email_or_phone_exists": "Email hoặc số điện thoại đã được dùng cho tài khoản khác.",
  "doctor.code_or_license_exists": "Mã bác sĩ hoặc số giấy phép đã tồn tại.",
  "doctor.use_doctor_endpoint": "Tài khoản bác sĩ cần được quản lý trong hồ sơ bác sĩ.",
  "role.not_found": "Vai trò không hợp lệ.",
  "role.doctor_not_found": "Hệ thống chưa cấu hình vai trò Bác sĩ.",
};

export function getErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback, PERSONNEL_ERRORS);
}
