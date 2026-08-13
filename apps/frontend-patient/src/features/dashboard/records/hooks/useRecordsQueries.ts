import { useQuery } from "@tanstack/react-query";
import { getPatientRecords } from "../api";

export const recordsQueryKeys = {
  all: ["patient", "records"] as const,
  detail: (patientId?: string) => ["patient", "records", patientId ?? "me"] as const,
};

export function usePatientRecordsQuery(patientId?: string, enabled = true) {
  return useQuery({
    queryKey: recordsQueryKeys.detail(patientId),
    queryFn: () => getPatientRecords(patientId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
