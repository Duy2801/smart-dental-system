import apiClient from "@/src/lib/api/client";
import type { ReportOverview, ReportTimeFilter } from "./types";

export async function getReportOverview(timeFilter: ReportTimeFilter) {
  const response = await apiClient.get<ReportOverview>("/reports/overview", {
    params: { timeFilter },
  });

  return response.data;
}
