import apiClient from "@/src/lib/api/client";
import type { ClinicConfig } from "./types";

export async function getClinicConfig() {
  const response = await apiClient.get<ClinicConfig>("/clinic-config");
  return response.data;
}

export async function updateClinicConfig(payload: ClinicConfig) {
  const cleanedBusinessHours = payload.businessHours?.map((bh) => ({
    id: bh.id,
    label: bh.label,
    isOpen: bh.isOpen,
    start: bh.start ? bh.start.slice(0, 5) : "08:00",
    end: bh.end ? bh.end.slice(0, 5) : "17:00",
  }));

  const cleanedSpecialDates = payload.specialDates
    ?.filter((item) => item.date && item.date.trim() !== "")
    .map((item) => {
      const cleanItem: Record<string, unknown> = {
        date: item.date,
        label: item.label || "",
        isClosed: Boolean(item.isClosed),
      };
      if (item.start && item.start.trim()) cleanItem.start = item.start.slice(0, 5);
      if (item.end && item.end.trim()) cleanItem.end = item.end.slice(0, 5);
      return cleanItem;
    });

  const body = {
    name: payload.name ?? "",
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    address: payload.address ?? "",
    logoUrl: payload.logoUrl ?? "",
    businessHours: cleanedBusinessHours,
    slotIntervalMinutes: payload.slotIntervalMinutes ?? 30,
    specialDates: cleanedSpecialDates,
  };
  const response = await apiClient.patch<ClinicConfig>(
    "/clinic-config",
    body,
  );
  return response.data;
}

