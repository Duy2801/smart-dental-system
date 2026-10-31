import { useQuery } from "@tanstack/react-query";
import { getPatientRecords, getPatientRecordsPlans, getPatientRecordsSummary } from "../api";

export const recordsQueryKeys = {
  all: ["patient", "records"] as const,
  detail: (patientId?: string) =>
    ["patient", "records", patientId ?? "me"] as const,
  summary: (patientId: string) => ["patient", "records", patientId, "summary"] as const,
  plans: (patientId: string) => ["patient", "records", patientId, "plans"] as const,
};

export function usePatientRecordsSummaryQuery(patientId: string, enabled: boolean) {
  return useQuery({
    queryKey: recordsQueryKeys.summary(patientId),
    queryFn: () => getPatientRecordsSummary(patientId),
    enabled,
    staleTime: 5_000,
    // Mỗi lần poll tốn vài query DB; quay lại tab đã có refetchOnWindowFocus làm mới ngay
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function usePatientRecordsPlansQuery(patientId: string, enabled: boolean) {
  return useQuery({
    queryKey: recordsQueryKeys.plans(patientId),
    queryFn: () => getPatientRecordsPlans(patientId),
    enabled,
    staleTime: 5_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function usePatientRecordsQuery(patientId?: string, enabled = true) {
  return useQuery({
    queryKey: recordsQueryKeys.detail(patientId),
    queryFn: () => getPatientRecords(patientId),
    enabled,
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
