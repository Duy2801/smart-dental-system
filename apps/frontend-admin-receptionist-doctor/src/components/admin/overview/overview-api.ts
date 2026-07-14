import apiClient from "@/src/lib/api/client";
import type { OverviewDashboard } from "./types";

export async function getOverviewDashboard() {
  const response = await apiClient.get<OverviewDashboard>("/reports/dashboard");
  return response.data;
}
