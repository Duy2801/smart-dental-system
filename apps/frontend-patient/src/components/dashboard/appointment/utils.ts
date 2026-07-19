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
  return dates.find((date) => date.isOpen);
}

export function getCreateAppointmentErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Phien dang nhap da het han. Vui long dang nhap lai de dat lich.";
    }

    if (error.response?.status === 403) {
      return "Chi tai khoan benh nhan moi co quyen dat lich hen.";
    }

    const rawMessage = error.response?.data?.message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    const messageMap: Record<string, string> = {
      "appointment.time_in_past":
        "Khung gio da qua. Vui long chon thoi gian khac.",
      "appointment.patient_time_conflict":
        "Ban da co mot lich kham trung khung gio nay.",
      "appointment.doctor_time_conflict":
        "Bac si vua co lich o khung gio nay. Vui long chon bac si hoac gio khac.",
      "appointment.cancel_not_allowed":
        "Lich hen nay khong the tu huy tren he thong.",
      "appointment.cancel_deadline_passed":
        "Chi duoc huy lich truoc it nhat 12 gio.",
      "appointment.reschedule_not_allowed":
        "Lich hen nay khong the doi lich online.",
      "appointment.reschedule_deadline_passed":
        "Chi duoc doi lich truoc it nhat 6 gio.",
      "appointment.service_incomplete":
        "Dich vu nay da co lich chua hoan tat. Vui long hoan thanh lich truoc.",
      "appointment.pending_limit_reached":
        "Ban da co toi da 3 lich dang cho xac nhan.",
      "appointment.seven_day_limit_reached":
        "Ban chi duoc co toi da 5 lich trong 7 ngay de tranh dat lich qua nhieu.",
      "appointment.online_booking_blocked":
        "Ban da co tu 3 lan vang mat. Vui long lien he le tan de dat lich.",
      "doctor.not_available_at_selected_time":
        "Bac si khong lam viec trong khung gio da chon.",
      "doctor.unavailable": "Bac si hien khong kha dung.",
      "service.unavailable": "Dich vu hien khong kha dung.",
      "clinic.closed_at_selected_time":
        "Phong kham khong lam viec trong khung gio da chon.",
    };

    if (typeof message === "string") {
      return messageMap[message] ?? message;
    }
  }

  return "Khong the dat lich hen. Vui long chon khung gio khac.";
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Da xac nhan",
  pending: "Cho xac nhan",
  completed: "Hoan thanh",
  cancelled: "Da huy",
  missed: "Vang mat",
  in_progress: "Dang kham",
  rescheduled: "Da doi lich",
};
