"use client";

import { useQuery } from "@tanstack/react-query";
import { getPatientServiceDetail, getPatientServices } from "./api";

export const patientServiceQueryKeys = {
  all: ["patient", "services"] as const,
  detail: (serviceId: string) =>
    ["patient", "service-detail", serviceId] as const,
};

export function usePatientServicesQuery() {
  return useQuery({
    queryKey: patientServiceQueryKeys.all,
    queryFn: getPatientServices,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePatientServiceDetailQuery(serviceId: string) {
  return useQuery({
    queryKey: patientServiceQueryKeys.detail(serviceId),
    queryFn: () => getPatientServiceDetail(serviceId),
    enabled: Boolean(serviceId),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
