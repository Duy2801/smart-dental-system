import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getBanners,
  getHomeServices,
  getHomeDoctors,
  getHomeClinicalCases,
  getLiveClinicConfigInfo,
  getDoctorDetail,
} from "../api";

export const homeQueryKeys = {
  all: ["patient", "home"] as const,
  banners: () => [...homeQueryKeys.all, "banners"] as const,
  services: () => [...homeQueryKeys.all, "services"] as const,
  doctors: () => [...homeQueryKeys.all, "doctors"] as const,
  doctorDetail: (id: string) => [...homeQueryKeys.all, "doctor", id] as const,
  clinicalCases: () => [...homeQueryKeys.all, "clinical-cases"] as const,
  clinicConfig: () => ["patient", "clinic-config"] as const,
};

export function useHomeBannersQuery() {
  return useQuery({
    queryKey: homeQueryKeys.banners(),
    queryFn: getBanners,
    staleTime: 10 * 60 * 1000, // 10 minutes cache freshness
    gcTime: 60 * 60 * 1000,   // Keep in memory for 1 hour
    refetchOnWindowFocus: false,
  });
}

export function useHomeServicesQuery(enabled = true) {
  return useQuery({
    queryKey: homeQueryKeys.services(),
    queryFn: getHomeServices,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useHomeDoctorsQuery(enabled = true) {
  return useQuery({
    queryKey: homeQueryKeys.doctors(),
    queryFn: getHomeDoctors,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDoctorDetailQuery(id: string) {
  return useQuery({
    queryKey: homeQueryKeys.doctorDetail(id),
    queryFn: () => getDoctorDetail(id),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useHomeClinicalCasesQuery() {
  return useQuery({
    queryKey: homeQueryKeys.clinicalCases(),
    queryFn: getHomeClinicalCases,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

const CLINIC_CONFIG_CACHE_KEY = "smart_dental_clinic_config_cache";

export function useClinicConfigQuery() {
  return useQuery({
    queryKey: homeQueryKeys.clinicConfig(),
    queryFn: async () => {
      const data = await getLiveClinicConfigInfo();
      if (typeof window !== "undefined" && data) {
        try {
          localStorage.setItem(CLINIC_CONFIG_CACHE_KEY, JSON.stringify(data));
        } catch {
          // ignore storage quota errors
        }
      }
      return data;
    },
    initialData: () => {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(CLINIC_CONFIG_CACHE_KEY);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch {
          // ignore json parse errors
        }
      }
      return undefined;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 120 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to prefetch doctor details when hovering on doctor cards
 */
export function usePrefetchDoctorDetail() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      if (!id) return;
      void queryClient.prefetchQuery({
        queryKey: homeQueryKeys.doctorDetail(id),
        queryFn: () => getDoctorDetail(id),
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient],
  );
}
