import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelMyConsultation,
  getAvailableConsultationSlots,
  getConsultationDoctors,
  getConsultationPackages,
  getMyConsultations,
  rescheduleMyConsultation,
} from "../api";
import type {
  ConsultationDurationMinutes,
  PatientConsultationItem,
} from "../types";

export const consultationQueryKeys = {
  all: ["patient", "consultations"] as const,
  doctors: () => ["patient", "consultations", "doctors"] as const,
  packages: () => ["patient", "consultations", "packages"] as const,
  slots: (
    doctorId: string,
    date: string,
    durationMinutes: ConsultationDurationMinutes,
  ) =>
    [
      "patient",
      "consultations",
      "slots",
      doctorId,
      date,
      durationMinutes,
    ] as const,
  myConsultations: () => ["patient", "consultations", "my-list"] as const,
};

export function useConsultationDoctorsQuery() {
  return useQuery({
    queryKey: consultationQueryKeys.doctors(),
    queryFn: getConsultationDoctors,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useConsultationPackagesQuery() {
  return useQuery({
    queryKey: consultationQueryKeys.packages(),
    queryFn: getConsultationPackages,
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    gcTime: 120 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useConsultationSlotsQuery(
  doctorId: string,
  date: string,
  durationMinutes: ConsultationDurationMinutes,
) {
  return useQuery({
    queryKey: consultationQueryKeys.slots(doctorId, date, durationMinutes),
    queryFn: () =>
      getAvailableConsultationSlots(doctorId, date, durationMinutes),
    enabled: Boolean(doctorId && date),
    staleTime: 15 * 1000, // 15s cache
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useMyConsultationsQuery() {
  return useQuery({
    queryKey: consultationQueryKeys.myConsultations(),
    queryFn: getMyConsultations,
    staleTime: 15 * 1000, // 15s cache for dynamic room/status updates
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Slot trống khi đổi lịch: không tính chính buổi tư vấn đang được đổi */
export function useRescheduleConsultationSlotsQuery(
  consultation: PatientConsultationItem | null,
  date: string,
) {
  const doctorId = consultation?.doctorId ?? "";
  const duration = (consultation?.durationMinutes ?? 30) as ConsultationDurationMinutes;
  return useQuery({
    queryKey: [
      ...consultationQueryKeys.slots(doctorId, date, duration),
      "reschedule",
      consultation?.id ?? "",
    ],
    queryFn: () =>
      getAvailableConsultationSlots(doctorId, date, duration, consultation?.id),
    enabled: Boolean(consultation && doctorId && date),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRescheduleConsultationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      rescheduleMyConsultation(id, scheduledAt),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: consultationQueryKeys.all,
      });
    },
  });
}

export function useCancelConsultationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelMyConsultation(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: consultationQueryKeys.myConsultations(),
        }),
        queryClient.invalidateQueries({
          queryKey: consultationQueryKeys.all,
        }),
      ]);
    },
  });
}
