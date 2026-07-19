import type { DashboardIconName } from "../common/DashboardIcon";

export function hasItems<T>(values?: T[] | null): values is T[] {
  return Array.isArray(values) && values.length > 0;
}

export function minutesLabel(value: number) {
  return `${value} phút`;
}

export function normalizeServiceIcon(icon?: string | null): DashboardIconName {
  if (
    icon === "sparkles" ||
    icon === "checkup" ||
    icon === "clock" ||
    icon === "shield"
  ) {
    return icon;
  }
  return "shield";
}
