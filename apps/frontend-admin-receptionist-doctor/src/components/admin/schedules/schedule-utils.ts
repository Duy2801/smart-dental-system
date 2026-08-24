import type { Doctor, ScheduleFormState } from "./types";
import type { BusinessHour } from "../setting/types";

export function getDoctorName(doctor: Doctor) {
  return doctor.user?.fullName || doctor.doctorCode;
}

export function getErrorMessage(error: any, fallback: string) {
  const msg =
    error?.response?.data?.message ||
    (error instanceof Error ? error.message : fallback);

  if (msg === "clinic.closed_at_selected_time") {
    return "Thời gian ca làm việc nằm ngoài giờ mở cửa của phòng khám.";
  }
  if (msg === "availability.invalid_time_range") {
    return "Giờ bắt đầu phải trước giờ kết thúc.";
  }
  if (msg === "availability.no_open_days_selected") {
    return "Chưa chọn ngày nào phòng khám mở cửa.";
  }
  if (msg === "availability.shift_overlap") {
    return "Ca làm việc bị trùng lặp thời gian.";
  }
  return msg || fallback;
}

export function getScheduleValidationError(
  form: ScheduleFormState,
  businessHours: BusinessHour[],
): string | null {
  if (form.autoSchedule) {
    if (form.selectedDays.length === 0) {
      return "Vui lòng chọn ít nhất một ngày áp dụng.";
    }
    const openDays = form.selectedDays.filter((id) => {
      const bh = businessHours.find((b) => b.id === id);
      return bh?.isOpen;
    });
    if (openDays.length === 0) {
      return "Các ngày đã chọn hiện tại phòng khám đều đóng cửa.";
    }
    return null;
  }

  const businessHour = businessHours.find((b) => b.id === form.dayOfWeek);
  if (!businessHour || !businessHour.isOpen) {
    return "Phòng khám không mở cửa vào ngày được chọn.";
  }

  if (!form.startTime || !form.endTime) {
    return "Vui lòng nhập đầy đủ giờ bắt đầu và giờ kết thúc.";
  }

  if (form.startTime >= form.endTime) {
    return "Giờ bắt đầu phải trước giờ kết thúc.";
  }

  if (form.startTime < businessHour.start) {
    return `Giờ bắt đầu (${form.startTime}) sớm hơn giờ mở cửa phòng khám (${businessHour.start}).`;
  }

  if (form.endTime > businessHour.end) {
    return `Giờ kết thúc (${form.endTime}) trễ hơn giờ đóng cửa phòng khám (${businessHour.end}).`;
  }

  return null;
}
