import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import { createPatientAppointment, getAppointmentOptions } from "../api";
import { getCreateAppointmentErrorMessage } from "../utils";
import type { BookingDate } from "../types";
import { appointmentQueryKeys } from "./useAppointmentQueries";

type UseCreateAppointmentParams = {
  dates: BookingDate[];
  availableTimes: string[];
  selectedDoctorId: string;
  selectedServiceId: string;
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
  selectedServiceId,
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
      toast.error("Khung giờ không hợp lệ", "Vui lòng chọn khung giờ khác.");
      return;
    }

    try {
      const confirmedOptions = await getAppointmentOptions({
        serviceId: selectedServiceId,
        treatmentMethodId: selectedTreatmentMethodId,
        doctorId: selectedDoctorId,
        date: selectedDateId,
        time: selectedTime,
      });
      const selectedDoctorIsStillAvailable = confirmedOptions.doctors.some(
        (doctor) => doctor.id === selectedDoctorId,
      );

      if (!confirmedOptions.timeSlots.includes(selectedTime)) {
        onSelectedTimeChange("");
        toast.error(
          "Khung giờ vừa chọn không còn trống",
          "Vui lòng chủ động chọn khung giờ khám khác.",
        );
        return;
      }

      if (!selectedDoctorIsStillAvailable) {
        onSelectedDoctorChange("");
        toast.error(
          "Bác sĩ vừa chọn không còn trống",
          "Vui lòng chủ động chọn bác sĩ khác hoặc chọn khung giờ khác.",
        );
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
      toast.error(
        "Không thể đặt lịch hẹn",
        getCreateAppointmentErrorMessage(appointmentError),
      );
    }
  }

  return {
    createAppointment,
    isSubmitting: createAppointmentMutation.isPending,
  };
}
