import {
  collapseSpaces,
  validateClinicPhone,
  validateEmail,
  validateNumber,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import type { ClinicConfig } from "./types";

export type GeneralField = "name" | "phone" | "email" | "address";

export type ClinicConfigValidation = {
  general: FieldErrors<GeneralField>;
  /** Lỗi đầu tiên ở tab giờ làm việc (hiển thị dạng thông báo) */
  hours?: string;
};

function validateHours(config: ClinicConfig): string | undefined {
  for (const day of config.businessHours) {
    if (!day.isOpen) continue;
    if (!day.start || !day.end) return `${day.label}: vui lòng nhập đủ giờ mở và đóng cửa.`;
    if (day.start >= day.end) return `${day.label}: giờ mở cửa phải sớm hơn giờ đóng cửa.`;
  }

  if (config.isBusinessHoursConfigured && !config.businessHours.some((day) => day.isOpen)) {
    return "Phòng khám cần mở cửa ít nhất một ngày trong tuần.";
  }

  const slotError = validateNumber(config.slotIntervalMinutes, {
    label: "Bước nhảy khung giờ",
    min: 5,
    max: 240,
    unit: "phút",
  });
  if (slotError) return slotError;

  const { lunchBreak } = config;
  if (lunchBreak.isEnabled) {
    if (!lunchBreak.start || !lunchBreak.end) return "Vui lòng nhập đủ giờ bắt đầu và kết thúc nghỉ trưa.";
    if (lunchBreak.start >= lunchBreak.end) return "Giờ bắt đầu nghỉ trưa phải sớm hơn giờ kết thúc.";
  }

  const seenDates = new Set<string>();
  for (const [index, item] of config.specialDates.entries()) {
    const name = item.date ? `Ngày đặc biệt ${item.date}` : `Ngày đặc biệt #${index + 1}`;
    if (!item.date) return `${name}: vui lòng chọn ngày.`;
    if (seenDates.has(item.date)) return `${name} bị trùng — mỗi ngày chỉ được khai báo một lần.`;
    seenDates.add(item.date);
    const labelError = validateText(item.label, { label: "Tên ngày", max: 120 });
    if (labelError) return `${name}: ${labelError}`;
    if (!item.isClosed) {
      const start = item.start ?? "08:00";
      const end = item.end ?? "17:00";
      if (start >= end) return `${name}: giờ mở cửa phải sớm hơn giờ đóng cửa.`;
    }
  }

  return undefined;
}

export function validateClinicConfig(config: ClinicConfig): ClinicConfigValidation {
  return {
    general: {
      name: validateText(config.name, { label: "Tên phòng khám", required: true, min: 2, max: 150 }),
      phone: validateClinicPhone(config.phone),
      email: validateEmail(config.email),
      address: validateText(config.address, { label: "Địa chỉ", required: true, min: 5, max: 255 }),
    },
    hours: validateHours(config),
  };
}

export function normalizeClinicConfig(config: ClinicConfig): ClinicConfig {
  return {
    ...config,
    name: collapseSpaces(config.name),
    phone: collapseSpaces(config.phone),
    email: config.email.trim().toLowerCase(),
    address: collapseSpaces(config.address),
    specialDates: config.specialDates.map((item) => ({ ...item, label: collapseSpaces(item.label) })),
  };
}
