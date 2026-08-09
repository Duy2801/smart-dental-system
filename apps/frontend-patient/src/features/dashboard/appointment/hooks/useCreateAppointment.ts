import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import {
  createPatientAppointment,
  getAppointmentOptions,
} from "../api";
import { getCreateAppointmentErrorMessage } from "../utils";
import type { AppointmentPaymentOption, BookingDate } from "../types";
import { appointmentQueryKeys } from "./useAppointmentQueries";

type UseCreateAppointmentParams = {
  dates: BookingDate[];
  availableTimes: string[];
  selectedDoctorId: string;
  selectedServiceId: string;
  selectedTreatmentMethodId: string;
  selectedDateId: string;
  selectedTime: string;
  selectedPaymentOption: AppointmentPaymentOption;
  selectedPromotionCode?: string;
  ensureLoggedInBeforeBooking: () => Promise<boolean>;
  onSelectedTimeChange: (time: string) => void;
  onSelectedDoctorChange: (doctorId: string) => void;
  onSuccess: (data: {
    message: string;
    depositInvoiceId?: string | null;
    depositAmount?: number;
  }) => void;
};

export function useCreateAppointment({
  dates,
  availableTimes,
  selectedDoctorId,
  selectedServiceId,
  selectedTreatmentMethodId,
  selectedDateId,
  selectedTime,
  selectedPaymentOption,
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
      toast.error(
        "Khung giờ không hợp lệ",
        "Vui lòng chọn khung giờ khác.",
      );
      return;
    }

    try {
      const confirmedOptions = await getAppointmentOptions({
        serviceId: selectedServiceId,
        treatmentMethodId: selectedTreatmentMethodId,
        date: selectedDateId,
        time: selectedTime,
      });
      const selectedDoctorIsStillAvailable = confirmedOptions.doctors.some(
        (doctor) => doctor.id === selectedDoctorId,
      );

      if (!confirmedOptions.timeSlots.includes(selectedTime)) {
        onSelectedTimeChange(confirmedOptions.timeSlots[0] ?? "");
        toast.error(
          "Khung giờ vừa chọn không còn hợp lệ",
          "Vui lòng chọn lại khung giờ.",
        );
        return;
      }

      if (!selectedDoctorIsStillAvailable) {
        onSelectedDoctorChange(confirmedOptions.doctors[0]?.id ?? "");
        toast.error(
          "Bác sĩ vừa chọn không còn trống",
          confirmedOptions.doctors.length
            ? "Hệ thống đã gợi ý bác sĩ còn trống, vui lòng xác nhận lại."
            : "Vui lòng chọn khung giờ khác.",
        );
        return;
      }

      const created = await createAppointmentMutation.mutateAsync({
        doctorId: selectedDoctorId,
        treatmentMethodId: selectedTreatmentMethodId,
        scheduledAt: new Date(
          `${selectedDateId}T${selectedTime}:00`,
        ).toISOString(),
        paymentOption: selectedPaymentOption,
        promotionCode:
          promotionCode?.trim() || selectedPromotionCode?.trim() || undefined,
      });

      const successMessage =
        selectedPaymentOption === "DEPOSIT_30_PERCENT"
          ? `${created.appointment.service} luc ${created.appointment.time}. Ban da chon coc truoc de giu lich.`
          : `${created.appointment.service} luc ${created.appointment.time}. Ban da chon thanh toan tai quay khi den kham.`;
      const policyDescription =
        selectedPaymentOption === "DEPOSIT_30_PERCENT"
          ? `Lịch hẹn này sẽ giữ bằng khoản cọc ${created.bookingPolicy?.depositAmount.toLocaleString("vi-VN") ?? "theo cấu hình"}đ.`
          : "Lịch hẹn này được giữ và thanh toán tại quầy khi đến khám.";

      toast.success("Đặt lịch thành công", policyDescription);
      onSuccess({
        message: successMessage,
        depositInvoiceId: created.bookingPolicy?.depositInvoiceId,
        depositAmount: created.bookingPolicy?.depositAmount,
      });
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
