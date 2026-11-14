import type { Gender } from "./types";

export function genderLabel(gender: Gender) {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";
  return "Chưa rõ";
}

const VISIT_STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "brand" }> = {
  COMPLETED: { label: "Đã khám", variant: "success" },
  IN_PROGRESS: { label: "Đang khám", variant: "brand" },
  CHECKED_IN: { label: "Đã tiếp nhận", variant: "brand" },
  CONFIRMED: { label: "Đã xác nhận", variant: "brand" },
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  SCHEDULED: { label: "Đã lên lịch", variant: "brand" },
  CANCELLED: { label: "Đã hủy", variant: "neutral" },
  NO_SHOW: { label: "Vắng mặt", variant: "danger" },
};

export function visitStatus(status: string) {
  return VISIT_STATUS[status] ?? { label: status, variant: "neutral" as const };
}

export function formatMoney(value: number | undefined) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")}đ`;
}
