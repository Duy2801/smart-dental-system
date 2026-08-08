import { useQuery } from "@tanstack/react-query";
import { getPatientRecords } from "../api";

export const recordsQueryKeys = {
  all: ["patient", "records"] as const,
};

export function usePatientRecordsQuery() {
  return useQuery({
    queryKey: recordsQueryKeys.all,
    queryFn: getPatientRecords,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
