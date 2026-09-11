import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "@/features/dashboard/common/toast";
import { createPatientAppointment } from "../api";
import {
  getAppointmentErrorCode,
  getCreateAppointmentErrorMessage,
} from "../utils";
import type { BookingDate } from "../types";
import { appointmentQueryKeys } from "./useAppointmentQueries";

type UseCreateAppointmentParams = {
  dates: BookingDate[];
  availableTimes: string[];
  selectedDoctorId: string;
  selectedTreatmentMethodId: string;
  selectedPatientId: string;
  selectedDateId: string;
  selectedTime: string;
  selectedPromotionCode?: string;
  ensureLoggedInBeforeBooking: () => Promise<boolean>;
  onSelectedTimeChange: (time: string) => void;
  onSelectedDoctorChange: (doctorId: string) => void;
  onSuccess: () => void;
};

export function useCreateAppointment({
  dates,
  availableTimes,
  selectedDoctorId,
  selectedTreatmentMethodId,
  selectedPatientId,
  selectedDateId,
  selectedTime,
  selectedPromotionCode,
  ensureLoggedInBeforeBooking,
  onSelectedTimeChange,
  onSelectedDoctorChange,
  onSuccess,
}: UseCreateAppointmentParams) {
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const createAppointmentMutation = useMutation({
    mutationFn: createPatientAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: appointmentQueryKeys.patientProfiles(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient", "appointment-options"],
        }),
        queryClient.invalidateQueries({ queryKey: ["patient", "profile"] }),
      ]);
    },
  });

  async function createAppointment(promotionCode?: string) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);

    try {
      const canBook = await ensureLoggedInBeforeBooking();
      if (!canBook) return;

      const chosenDate = dates.find((date) => date.id === selectedDateId);

      if (
        !selectedDoctorId ||
        !selectedPatientId ||
        !selectedTreatmentMethodId ||
        !selectedDateId ||
        !selectedTime
      ) {
        toast.error(
          "Thiếu thông tin đặt lịch",
          "Vui lòng chọn đầy đủ dịch vụ, phương pháp điều trị, ngày giờ và bác sĩ.",
        );
        return;
      }

      if (!chosenDate?.isOpen) {
        toast.error("Ngày không làm việc", "Vui lòng chọn ngày khám khác.");
        return;
      }

      if (!availableTimes.includes(selectedTime)) {
        onSelectedTimeChange("");
        toast.error("Khung giờ không hợp lệ", "Vui lòng chọn khung giờ khác.");
        return;
      }

      await createAppointmentMutation.mutateAsync({
        doctorId: selectedDoctorId,
        patientId: selectedPatientId,
        treatmentMethodId: selectedTreatmentMethodId,
        scheduledAt: new Date(
          `${selectedDateId}T${selectedTime}:00`,
        ).toISOString(),
        promotionCode:
          promotionCode?.trim() || selectedPromotionCode?.trim() || undefined,
      });

      toast.success(
        "Đặt lịch thành công",
        "Lịch hẹn này được giữ và thanh toán tại quầy khi đến khám.",
      );
      onSuccess();
    } catch (appointmentError) {
      resetUnavailableSelections(appointmentError, {
        onSelectedTimeChange,
        onSelectedDoctorChange,
      });
      toast.error(
        "Không thể đặt lịch hẹn",
        getCreateAppointmentErrorMessage(appointmentError),
      );
    } finally {
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  }

  return {
    createAppointment,
    isSubmitting: isProcessing || createAppointmentMutation.isPending,
  };
}

function resetUnavailableSelections(
  error: unknown,
  actions: {
    onSelectedTimeChange: (time: string) => void;
    onSelectedDoctorChange: (doctorId: string) => void;
  },
) {
  const errorCode = getAppointmentErrorCode(error);
  if (!errorCode) return;

  if (
    errorCode === "appointment.doctor_time_conflict" ||
    errorCode === "appointment.doctor_time_conflict_video" ||
    errorCode === "doctor.not_available_at_selected_time" ||
    errorCode === "doctor.unavailable"
  ) {
    actions.onSelectedDoctorChange("");
    actions.onSelectedTimeChange("");
    return;
  }

  if (
    errorCode === "appointment.patient_time_conflict" ||
    errorCode === "appointment.time_in_past" ||
    errorCode === "appointment.invalid_time" ||
    errorCode === "clinic.closed_at_selected_time"
  ) {
    actions.onSelectedTimeChange("");
  }
}
