import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getAppointmentOptions,
  getManagedPatientProfiles,
  getPatientAppointments,
  type BookingOptionsQuery,
} from "../api";

export const appointmentQueryKeys = {
  all: ["patient", "appointments"] as const,
  patientProfiles: () => ["patient", "profiles"] as const,
  optionsBase: (params?: BookingOptionsQuery) =>
    ["patient", "appointment-options", "base", params ?? {}] as const,
  optionsSchedule: (params: BookingOptionsQuery) =>
    ["patient", "appointment-options", "schedule", params] as const,
  optionsAvailability: (params: BookingOptionsQuery) =>
    ["patient", "appointment-options", "availability", params] as const,
  rescheduleOptions: (params: {
    appointmentId?: string;
    serviceId?: string;
    doctorId?: string;
    date?: string;
  }) => ["patient", "appointment-options", "reschedule", params] as const,
};

export function useManagedPatientProfilesQuery(isLoggedIn: boolean) {
  return useQuery({
    queryKey: appointmentQueryKeys.patientProfiles(),
    queryFn: getManagedPatientProfiles,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch patient appointments with optimized caching (staleTime 30s).
 */
export function usePatientAppointmentsQuery(isLoggedIn: boolean) {
  return useQuery({
    queryKey: appointmentQueryKeys.all,
    queryFn: getPatientAppointments,
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch base appointment options (Services & Initial Dates) with 5m caching.
 */
export function useAppointmentOptionsBaseQuery(
  params: BookingOptionsQuery = {},
) {
  return useQuery({
    queryKey: appointmentQueryKeys.optionsBase(params),
    queryFn: () => getAppointmentOptions(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch dynamic schedule options for a chosen service, treatment method & date.
 */
export function useAppointmentScheduleQuery(params: BookingOptionsQuery) {
  return useQuery({
    queryKey: appointmentQueryKeys.optionsSchedule(params),
    queryFn: () => getAppointmentOptions(params),
    enabled: Boolean(params.serviceId && params.treatmentMethodId),
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check specific doctor availability for a date + time combination.
 */
export function useAppointmentAvailabilityQuery(
  params: BookingOptionsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: appointmentQueryKeys.optionsAvailability(params),
    queryFn: () => getAppointmentOptions(params),
    enabled: Boolean(enabled && params.serviceId && params.date && params.time),
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch reschedule options for an appointment.
 */
export function useAppointmentRescheduleOptionsQuery(params: {
  appointmentId?: string;
  serviceId?: string;
  doctorId?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: appointmentQueryKeys.rescheduleOptions(params),
    queryFn: () =>
      getAppointmentOptions({
        serviceId: params.serviceId,
        doctorId: params.doctorId,
        date: params.date,
      }),
    enabled: Boolean(params.appointmentId),
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

/**
 * Prefetches base appointment booking options on hover or navigation preview.
 */
export function usePrefetchAppointmentOptions() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: appointmentQueryKeys.optionsBase(),
      queryFn: () => getAppointmentOptions(),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}
