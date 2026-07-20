import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/dashboard/common/toast";
import {
  createPatientAppointment,
  getAppointmentOptions,
} from "../api";
import { getCreateAppointmentErrorMessage } from "../utils";
import type { AppointmentPaymentOption, BookingDate } from "../types";

type UseCreateAppointmentParams = {
  dates: BookingDate[];
  availableTimes: string[];
  selectedDoctorId: string;
  selectedServiceId: string;
  selectedDateId: string;
  selectedTime: string;
  selectedPaymentOption: AppointmentPaymentOption;
  ensureLoggedInBeforeBooking: () => Promise<boolean>;
  onSelectedTimeChange: (time: string) => void;
  onSelectedDoctorChange: (doctorId: string) => void;
  onSuccess: (message: string) => void;
};

export function useCreateAppointment({
  dates,
  availableTimes,
  selectedDoctorId,
  selectedServiceId,
  selectedDateId,
  selectedTime,
  selectedPaymentOption,
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
        queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] }),
        queryClient.invalidateQueries({
          queryKey: ["patient", "appointment-options"],
        }),
        queryClient.invalidateQueries({ queryKey: ["patient", "profile"] }),
      ]);
    },
  });

  async function createAppointment() {
    const canBook = await ensureLoggedInBeforeBooking();
    if (!canBook) return;

    const chosenDate = dates.find((date) => date.id === selectedDateId);

    if (!selectedDoctorId || !selectedServiceId || !selectedDateId || !selectedTime) {
      toast.error(
        "Thieu thong tin dat lich",
        "Vui long chon day du dich vu, ngay gio va bac si.",
      );
      return;
    }

    if (!chosenDate?.isOpen) {
      toast.error("Ngay khong lam viec", "Vui long chon ngay kham khac.");
      return;
    }

    if (!availableTimes.includes(selectedTime)) {
      toast.error(
        "Khung gio khong hop le",
        "Vui long chon khung gio khac.",
      );
      return;
    }

    try {
      const confirmedOptions = await getAppointmentOptions({
        serviceId: selectedServiceId,
        date: selectedDateId,
        time: selectedTime,
      });
      const selectedDoctorIsStillAvailable = confirmedOptions.doctors.some(
        (doctor) => doctor.id === selectedDoctorId,
      );

      if (!confirmedOptions.timeSlots.includes(selectedTime)) {
        onSelectedTimeChange(confirmedOptions.timeSlots[0] ?? "");
        toast.error(
          "Khung gio vua chon khong con hop le",
          "Vui long chon lai khung gio.",
        );
        return;
      }

      if (!selectedDoctorIsStillAvailable) {
        onSelectedDoctorChange(confirmedOptions.doctors[0]?.id ?? "");
        toast.error(
          "Bac si vua chon khong con trong",
          confirmedOptions.doctors.length
            ? "He thong da goi y bac si con trong, vui long xac nhan lai."
            : "Vui long chon khung gio khac.",
        );
        return;
      }

      const created = await createAppointmentMutation.mutateAsync({
        doctorId: selectedDoctorId,
        serviceId: selectedServiceId,
        scheduledAt: new Date(
          `${selectedDateId}T${selectedTime}:00`,
        ).toISOString(),
        paymentOption: selectedPaymentOption,
      });

      const successMessage =
        selectedPaymentOption === "DEPOSIT_30_PERCENT"
          ? `${created.appointment.service} luc ${created.appointment.time}. Ban da chon coc truoc de giu lich.`
          : `${created.appointment.service} luc ${created.appointment.time}. Ban da chon thanh toan tai quay khi den kham.`;
      const policyDescription =
        selectedPaymentOption === "DEPOSIT_30_PERCENT"
          ? `Lich hen nay se giu bang khoan coc ${created.bookingPolicy?.depositAmount.toLocaleString("vi-VN") ?? "theo cau hinh"}d.`
          : "Lich hen nay duoc giu va thanh toan tai quay khi den kham.";

      toast.success("Dat lich thanh cong", policyDescription);
      onSuccess(successMessage);
    } catch (appointmentError) {
      toast.error(
        "Khong the dat lich hen",
        getCreateAppointmentErrorMessage(appointmentError),
      );
    }
  }

  return {
    createAppointment,
    isSubmitting: createAppointmentMutation.isPending,
  };
}
