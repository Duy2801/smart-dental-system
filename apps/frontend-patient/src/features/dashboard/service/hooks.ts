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

/** true khi API trả 404 — dịch vụ thật sự không tồn tại (khác với lỗi mạng/máy chủ) */
export function isServiceNotFoundError(error: unknown) {
  return (error as { response?: { status?: number } } | null)?.response?.status === 404;
}

export function usePatientServiceDetailQuery(serviceId: string) {
  return useQuery({
    queryKey: patientServiceQueryKeys.detail(serviceId),
    queryFn: () => getPatientServiceDetail(serviceId),
    enabled: Boolean(serviceId),
    // Không thử lại khi dịch vụ không tồn tại; lỗi mạng thì thử lại tối đa 2 lần
    retry: (failureCount, error) =>
      !isServiceNotFoundError(error) && failureCount < 2,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
