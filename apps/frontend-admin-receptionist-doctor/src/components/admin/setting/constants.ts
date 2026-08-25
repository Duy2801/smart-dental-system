import type { BusinessHour, SettingsMenuItem } from "./types";

export const settingsMenuItems: SettingsMenuItem[] = [
  { id: "general", label: "Cài đặt chung", icon: "settings" },
  { id: "hours", label: "Giờ làm việc", icon: "clock" },
];

export const initialBusinessHours: BusinessHour[] = [
  { id: 1, label: "Thứ Hai", isOpen: true, start: "08:00", end: "17:00" },
  { id: 2, label: "Thứ Ba", isOpen: true, start: "08:00", end: "17:00" },
  { id: 3, label: "Thứ Tư", isOpen: true, start: "08:00", end: "17:00" },
  { id: 4, label: "Thứ Năm", isOpen: true, start: "08:00", end: "17:00" },
  { id: 5, label: "Thứ Sáu", isOpen: true, start: "08:00", end: "17:00" },
  { id: 6, label: "Thứ Bảy", isOpen: true, start: "08:00", end: "12:00" },
  { id: 0, label: "Chủ Nhật", isOpen: false, start: "08:00", end: "12:00" },
];

export const emptyClinicConfig = {
  name: "",
  phone: "",
  email: "",
  address: "",
  logoUrl: "",
  businessHours: [],
  slotIntervalMinutes: 30,
  specialDates: [],
  isBusinessHoursConfigured: false,
};
