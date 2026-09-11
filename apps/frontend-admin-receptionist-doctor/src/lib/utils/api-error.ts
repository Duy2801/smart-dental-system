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
  "appointment.cannot_mark_future_no_show":
    "Chỉ có thể đánh dấu vắng mặt sau giờ hẹn.",
  "appointment.cannot_confirm_past_appointment":
    "Không thể xác nhận lịch hẹn của ngày đã qua.",
  "appointment.check_in_today_only":
    "Chỉ có thể check-in lịch hẹn trong ngày hôm nay.",
  "appointment.medical_history_confirmation_required":
    "Cần xác nhận dị ứng và tiền sử bệnh trước khi check-in.",
  "appointment.start_today_only":
    "Chỉ có thể bắt đầu khám cho lịch hẹn trong ngày hôm nay.",
  "appointment.must_be_in_progress_to_complete":
    "Chỉ ca khám đang diễn ra mới có thể kết thúc.",
  "appointment.medical_record_required_before_complete":
    "Vui lòng nhập và lưu chẩn đoán cùng ghi chú điều trị trước khi kết thúc khám.",
  "appointment.cannot_remind_past_appointment":
    "Không thể gửi nhắc cho lịch hẹn đã qua.",
};

const PATIENT_ERRORS: Record<string, string> = {
  "patient.not_found": "Không tìm thấy bệnh nhân.",
  "patient.date_of_birth_future": "Ngày sinh không thể ở tương lai.",
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
  "payment.amount_exceeds_remaining":
    "Số tiền thanh toán vượt quá số tiền còn lại của hóa đơn.",
  "payment.not_found": "Không tìm thấy giao dịch thanh toán.",
  "payment.cannot_confirm": "Không thể xác nhận giao dịch này.",
  "payment.create_failed": "Không tạo được giao dịch thanh toán.",
  "promotion.not_found": "Mã khuyến mãi không tồn tại hoặc đã hết hạn.",
  "promotion.min_order_not_met": "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã.",
  "promotion.exhausted": "Mã khuyến mãi đã hết lượt sử dụng.",
  "promotion.discount_below_paid_amount":
    "Mức giảm không thể làm tổng hóa đơn thấp hơn số tiền đã thu.",
  "promotion.cannot_change_after_payment":
    "Không thể đổi mã khuyến mãi sau khi hóa đơn đã được thanh toán một phần.",
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
