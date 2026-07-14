import apiClient from "@/src/lib/api/client";
import type { ClinicConfig } from "./types";

export async function getClinicConfig() {
  const response = await apiClient.get<ClinicConfig>("/clinic-config");
  return response.data;
}

export async function updateClinicConfig(payload: ClinicConfig) {
  const response = await apiClient.patch<ClinicConfig>(
    "/clinic-config",
    payload,
  );
  return response.data;
}
