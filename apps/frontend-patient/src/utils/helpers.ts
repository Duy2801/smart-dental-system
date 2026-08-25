/**
 * Smart Dental System - Helper Utilities for Date & Currency Formatting
 */

/**
 * Format numeric value to Vietnamese Dong (VND) currency string.
 * Example: 1500000 -> "1.500.000đ" (or "1.500.000" if custom suffix provided)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  suffix: string = "đ"
): string {
  if (amount === null || amount === undefined || amount === "") {
    return `0${suffix}`;
  }
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return `0${suffix}`;
  }
  const formatted = new Intl.NumberFormat("vi-VN").format(numericAmount);
  return suffix ? `${formatted}${suffix}` : formatted;
}

/**
 * Format raw number with vi-VN locale thousands separators without currency symbol.
 * Example: 1500000 -> "1.500.000"
 */
export function formatNumber(value: number | string | null | undefined): string {
  return formatCurrency(value, "");
}

/**
 * Format date string or Date object to DD/MM/YYYY string.
 * Example: "2026-08-09T00:00:00.000Z" -> "09/08/2026"
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  fallback: string = "Đang cập nhật"
): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Format date & time to "HH:mm - DD/MM/YYYY" string.
 * Example: "2026-08-09T14:30:00.000Z" -> "14:30 - 09/08/2026"
 */
export function formatDateTime(
  dateInput: string | Date | null | undefined,
  fallback: string = "Đang cập nhật"
): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return fallback;
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${time} - ${date}`;
  } catch {
    return fallback;
  }
}

/**
 * Format start time and duration into "HH:mm - HH:mm" string.
 * Example: ("12:30", 30) -> "12:30 - 13:00"
 */
export function formatTimeRange(
  startTime?: string | null,
  durationMinutes: number = 30
): string {
  if (!startTime) return "--:--";
  if (startTime.includes("-")) return startTime;

  const match = startTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return startTime;

  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const totalMins = hours * 60 + mins;
  const endTotalMins = totalMins + (durationMinutes || 30);

  const endHours = Math.floor(endTotalMins / 60) % 24;
  const endMins = endTotalMins % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(mins)} - ${pad(endHours)}:${pad(endMins)}`;
}
