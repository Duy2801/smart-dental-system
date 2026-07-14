import type { BusinessHour, SettingsMenuItem } from "./types";

export const settingsMenuItems: SettingsMenuItem[] = [
  { id: "general", label: "Cai dat chung", icon: "settings" },
  { id: "hours", label: "Gio lam viec", icon: "clock" },
];

export const initialBusinessHours: BusinessHour[] = [
  { id: 1, label: "Thu Hai", isOpen: true, start: "08:00", end: "17:00" },
  { id: 2, label: "Thu Ba", isOpen: true, start: "08:00", end: "17:00" },
  { id: 3, label: "Thu Tu", isOpen: true, start: "08:00", end: "17:00" },
  { id: 4, label: "Thu Nam", isOpen: true, start: "08:00", end: "17:00" },
  { id: 5, label: "Thu Sau", isOpen: true, start: "08:00", end: "17:00" },
  { id: 6, label: "Thu Bay", isOpen: true, start: "08:00", end: "12:00" },
  { id: 0, label: "Chu Nhat", isOpen: false, start: "08:00", end: "12:00" },
];

export const defaultClinicConfig = {
  name: "Smart Dental Clinic",
  phone: "1900 1234",
  email: "contact@smartdental.com",
  address: "123 Nguyen Van Linh, Da Nang",
  logoUrl: "",
  businessHours: initialBusinessHours,
};
