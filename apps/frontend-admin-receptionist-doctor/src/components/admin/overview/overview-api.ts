import apiClient from "@/src/lib/api/client";
import type { OverviewDashboard } from "./types";

export async function getOverviewDashboard(date?: string) {
  const response = await apiClient.get<OverviewDashboard>("/reports/dashboard", {
    params: date ? { date } : undefined,
  });
  return response.data;
}
