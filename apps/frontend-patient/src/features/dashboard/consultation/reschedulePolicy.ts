import type { PatientConsultationItem } from "./types";

/** Giống đổi lịch khám: tối đa 1 lần, trước giờ hẹn ít nhất 6 tiếng */
export const CONSULTATION_RESCHEDULE_LIMIT = 1;
export const CONSULTATION_RESCHEDULE_NOTICE_HOURS = 6;
export const CONSULTATION_RESCHEDULE_DAYS = 14;

const noticeMs = CONSULTATION_RESCHEDULE_NOTICE_HOURS * 60 * 60 * 1000;

export function isRescheduleTimeAllowed(scheduledAt: Date, now = Date.now()) {
  return scheduledAt.getTime() - now >= noticeMs;
}

/** Buổi tư vấn đủ điều kiện hiện nút "Đổi lịch" */
export function canShowConsultationReschedule(item: PatientConsultationItem) {
  return item.isPaid && item.status === "SCHEDULED";
}

/** Lý do không đổi được (null = đổi được) */
export function getConsultationRescheduleBlocker(
  item: PatientConsultationItem,
  now = Date.now(),
): string | null {
  if (!canShowConsultationReschedule(item)) {
    return "Chỉ đổi được lịch tư vấn đã thanh toán và chưa diễn ra.";
  }
  if ((item.rescheduleCount ?? 0) >= CONSULTATION_RESCHEDULE_LIMIT) {
    return "Lịch tư vấn này đã được đổi 1 lần, không thể đổi thêm.";
  }
  if (!isRescheduleTimeAllowed(new Date(item.scheduledAt), now)) {
    return `Chỉ được đổi lịch trước giờ tư vấn ít nhất ${CONSULTATION_RESCHEDULE_NOTICE_HOURS} tiếng.`;
  }
  return null;
}

export function toIctDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function buildRescheduleDates(days = CONSULTATION_RESCHEDULE_DAYS) {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const todayKey = toIctDateKey(new Date());
  const [year, month, day] = todayKey.split("-").map(Number);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index, 12));
    const id = date.toISOString().slice(0, 10);
    return {
      id,
      weekday: weekdays[date.getUTCDay()],
      day: String(date.getUTCDate()).padStart(2, "0"),
      month: `Th${date.getUTCMonth() + 1}`,
      isOpen: true,
    };
  });
}

/** "2026-11-10" + "09:30" -> Date theo giờ Việt Nam */
export function ictDateTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00+07:00`);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const message = (
    error as { response?: { data?: { message?: unknown } } }
  )?.response?.data?.message;
  if (Array.isArray(message)) return String(message[0] ?? fallback);
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}
