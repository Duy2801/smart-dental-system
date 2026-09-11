import { useQuery } from "@tanstack/react-query";
import { getPatientRecords } from "../api";

export const recordsQueryKeys = {
  all: ["patient", "records"] as const,
  detail: (patientId?: string) =>
    ["patient", "records", patientId ?? "me"] as const,
};

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
