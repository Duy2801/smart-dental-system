import { AxiosError } from "axios";

const APPOINTMENT_ERRORS: Record<string, string> = {
  "appointment.not_found": "Không tìm thấy lịch hẹn.",
  "appointment.must_be_checked_in_to_start":
    "Bệnh nhân cần check-in trước khi bắt đầu khám.",
  "appointment.invalid_time": "Thời gian lịch hẹn không hợp lệ.",
  "appointment.time_in_past": "Không thể thao tác với lịch đã qua.",
  "appointment.date_required": "Thiếu ngày tra cứu lịch hẹn.",
  "appointment.must_be_confirmed_to_check_in":
    "Lịch hẹn cần ở trạng thái Chờ xác nhận hoặc Đã xác nhận mới check-in được.",
  "appointment.cannot_mark_no_show": "Không thể đánh dấu vắng mặt cho lịch này.",
};

const PATIENT_ERRORS: Record<string, string> = {
  "patient.not_found": "Không tìm thấy bệnh nhân.",
  "auth.phone_exists": "Số điện thoại đã được sử dụng.",
  "auth.email_exists": "Email đã được sử dụng.",
  "user.not_found": "Không tìm thấy tài khoản người dùng.",
};

const INVOICE_ERRORS: Record<string, string> = {
  "invoice.not_found": "Không tìm thấy hóa đơn.",
  "invoice.not_payable": "Hóa đơn không thể thanh toán (đã hủy hoặc đã thu đủ).",
  "invoice.already_paid": "Hóa đơn đã được thanh toán đủ.",
};

const PAYMENT_ERRORS: Record<string, string> = {
  "payment.invalid_amount": "Số tiền thanh toán không hợp lệ.",
  "payment.not_found": "Không tìm thấy giao dịch thanh toán.",
  "payment.cannot_confirm": "Không thể xác nhận giao dịch này.",
  "payment.create_failed": "Không tạo được giao dịch thanh toán.",
  "promotion.not_found": "Mã khuyến mãi không tồn tại hoặc đã hết hạn.",
  "promotion.min_order_not_met": "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã.",
  "promotion.exhausted": "Mã khuyến mãi đã hết lượt sử dụng.",
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
    const table = {
      ...APPOINTMENT_ERRORS,
      ...PATIENT_ERRORS,
      ...INVOICE_ERRORS,
      ...PAYMENT_ERRORS,
      ...map,
    };
    if (table[key]) return table[key];
    if (key.length < 120 && !key.startsWith("Request failed")) return key;
  }
  return fallback;
}
