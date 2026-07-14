import type { ReportStatType } from "./types";

export function formatReportValue(value: number, type: ReportStatType) {
  if (type === "currency") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  if (type === "percentage") {
    return `${value}%`;
  }

  if (type === "decimal") {
    return value.toFixed(1);
  }

  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatVndCompact(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}d`;
}
