import axios from "axios";
import type { AppointmentStatus } from "./api";
import type { BookingDate } from "./types";

export function getSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function getLocalDateId(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isFutureSlot(dateId: string, time: string) {
  const slot = new Date(`${dateId}T${time}:00`);
  return slot.getTime() > Date.now();
}

export function getAvailableTimes(dateId: string, timeSlots: string[]) {
  if (!dateId) return timeSlots;
  if (dateId > getLocalDateId(new Date())) return timeSlots;
  if (dateId < getLocalDateId(new Date())) return [];
  return timeSlots.filter((time) => isFutureSlot(dateId, time));
}

export function pickFirstBookableDate(dates: BookingDate[]) {
  const openDates = dates.filter((date) => date.isOpen);
  if (openDates.length === 0) return undefined;
  return [...openDates].sort((a, b) => a.id.localeCompare(b.id))[0];
}

export function getCreateAppointmentErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đặt lịch.";
    }

    if (error.response?.status === 403) {
      return "Chỉ tài khoản bệnh nhân mới có quyền đặt lịch hẹn.";
    }

    const rawMessage = error.response?.data?.message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    const messageMap: Record<string, string> = {
      "doctor.service_not_supported":
        "Bac si nay khong phu trach dich vu da chon. Vui long chon dich vu khac.",
      "appointment.time_in_past":
        "Khung giờ đã qua. Vui lòng chọn thời gian khác.",
      "appointment.patient_time_conflict":
        "Bạn đã có một lịch khám trùng khung giờ này.",
      "appointment.doctor_time_conflict":
        "Bác sĩ vừa có lịch ở khung giờ này. Vui lòng chọn bác sĩ hoặc giờ khác.",
      "appointment.cancel_not_allowed":
        "Lịch hẹn này không thể tự hủy trên hệ thống.",
      "appointment.cancel_deadline_passed":
        "Chỉ được hủy lịch trước ít nhất 12 giờ.",
      "appointment.reschedule_not_allowed":
        "Lịch hẹn này không thể đổi lịch online.",
      "appointment.reschedule_deadline_passed":
        "Chỉ được đổi lịch trước ít nhất 6 giờ.",
      "appointment.service_incomplete":
        "Dịch vụ này đã có lịch chưa hoàn tất. Vui lòng hoàn thành lịch trước.",
      "appointment.pending_limit_reached":
        "Bạn đã có tối đa 3 lịch đang chờ xác nhận.",
      "appointment.seven_day_limit_reached":
        "Bạn chỉ được có tối đa 5 lịch trong 7 ngày để tránh đặt lịch quá nhiều.",
      "appointment.online_booking_blocked":
        "Bạn đã có từ 3 lần vắng mặt. Vui lòng liên hệ lễ tân để đặt lịch.",
      "appointment.deposit_not_available":
        "Tính năng đặt cọc cho dịch vụ này hiện chưa khả dụng. Vui lòng chọn thanh toán tại quầy.",
      "doctor.not_available_at_selected_time":
        "Bác sĩ không làm việc trong khung giờ đã chọn.",
      "doctor.unavailable": "Bác sĩ hiện không khả dụng.",
      "service.unavailable": "Dịch vụ hiện không khả dụng.",
      "clinic.closed_at_selected_time":
        "Phòng khám không làm việc trong khung giờ đã chọn.",
    };

    if (typeof message === "string") {
      return messageMap[message] ?? message;
    }
  }

  return "Không thể đặt lịch hẹn. Vui lòng chọn khung giờ khác.";
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  missed: "Vắng mặt",
  in_progress: "Đang khám",
  rescheduled: "Đã đổi lịch",
};
