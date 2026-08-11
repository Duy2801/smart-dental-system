import { AxiosError } from "axios";

const APPOINTMENT_ERRORS: Record<string, string> = {
  "appointment.not_found": "Không tìm thấy lịch hẹn.",
  "appointment.must_be_checked_in_to_start":
    "Bệnh nhân cần check-in trước khi bắt đầu khám.",
  "appointment.invalid_time": "Thời gian lịch hẹn không hợp lệ.",
  "appointment.time_in_past": "Không thể thao tác với lịch đã qua.",
  "appointment.date_required": "Thiếu ngày tra cứu lịch hẹn.",
};

const PATIENT_ERRORS: Record<string, string> = {
  "patient.not_found": "Không tìm thấy bệnh nhân.",
  "auth.phone_exists": "Số điện thoại đã được sử dụng.",
  "auth.email_exists": "Email đã được sử dụng.",
  "user.not_found": "Không tìm thấy tài khoản người dùng.",
};

export function getApiErrorMessage(
  err: unknown,
  fallback: string,
  map?: Record<string, string>,
): string {
  if (!(err instanceof AxiosError)) return fallback;
  const raw =
    (err.response?.data as { message?: string | string[] })?.message ??
    err.message;
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (typeof key === "string") {
    const table = { ...APPOINTMENT_ERRORS, ...PATIENT_ERRORS, ...map };
    if (table[key]) return table[key];
    if (key.length < 120 && !key.startsWith("Request failed")) return key;
  }
  return fallback;
}
