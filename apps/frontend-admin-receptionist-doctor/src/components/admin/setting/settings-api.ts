import apiClient from "@/src/lib/api/client";
import type { ClinicConfig } from "./types";

export async function getClinicConfig() {
  const response = await apiClient.get<ClinicConfig>("/clinic-config");
  return response.data;
}

export async function updateClinicConfig(payload: ClinicConfig) {
  const body = {
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    logoUrl: payload.logoUrl,
    businessHours: payload.businessHours,
    slotIntervalMinutes: payload.slotIntervalMinutes,
    specialDates: payload.specialDates,
  };
  const response = await apiClient.patch<ClinicConfig>(
    "/clinic-config",
    body,
  );
  return response.data;
}
