import { useEffect } from "react";
import { toast } from "@/components/dashboard/common/toast";
import type { AppointmentService, BookingDate, Dentist } from "../types";
import { getSearchParams, pickFirstBookableDate } from "../utils";

type BookingOptionsData = {
  services: AppointmentService[];
  doctors: Dentist[];
  dates: BookingDate[];
};

type UseAppointmentWorkspaceSyncParams = {
  bookingOptionsData?: BookingOptionsData;
  hasBookingOptionsError: boolean;
  dates: BookingDate[];
  doctors: Dentist[];
  availableTimes: string[];
  selectedDateId: string;
  selectedTime: string;
  selectedDoctorId: string;
  onOpenBookingMode: () => Promise<void>;
  setSelectedServiceId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDoctorId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDateId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
};

export function useAppointmentWorkspaceSync({
  bookingOptionsData,
  hasBookingOptionsError,
  dates,
  doctors,
  availableTimes,
  selectedDateId,
  selectedTime,
  selectedDoctorId,
  onOpenBookingMode,
  setSelectedServiceId,
  setSelectedDoctorId,
  setSelectedDateId,
  setSelectedTime,
}: UseAppointmentWorkspaceSyncParams) {
  useEffect(() => {
    if (hasBookingOptionsError) {
      toast.error(
        "Khong the tai du lieu lich hen",
        "Vui long kiem tra backend hoac thu tai lai trang.",
      );
    }
  }, [hasBookingOptionsError]);

  useEffect(() => {
    if (!bookingOptionsData) return;

    const params = getSearchParams();
    const requestedServiceId = params.get("service");
    const requestedDoctorId = params.get("doctorId");
    const firstBookableDate = pickFirstBookableDate(bookingOptionsData.dates);

    setSelectedServiceId(
      (current) =>
        current ||
        bookingOptionsData.services.find(
          (service) => service.id === requestedServiceId,
        )?.id ||
        bookingOptionsData.services[0]?.id ||
        "",
    );
    setSelectedDoctorId(
      (current) =>
        current ||
        bookingOptionsData.doctors.find(
          (doctor) => doctor.id === requestedDoctorId,
        )?.id ||
        bookingOptionsData.doctors[0]?.id ||
        "",
    );
    setSelectedDateId((current) => current || firstBookableDate?.id || "");
  }, [bookingOptionsData, setSelectedDateId, setSelectedDoctorId, setSelectedServiceId]);

  useEffect(() => {
    if (!selectedDateId || dates.length === 0) return;

    if (availableTimes.length === 0) {
      const nextDate = dates.find(
        (date) => date.isOpen && date.id !== selectedDateId,
      );

      if (nextDate && nextDate.id !== selectedDateId) {
        setSelectedDateId(nextDate.id);
      } else {
        setSelectedTime("");
      }

      return;
    }

    if (!selectedTime || !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    }
  }, [
    availableTimes,
    dates,
    selectedDateId,
    selectedTime,
    setSelectedDateId,
    setSelectedTime,
  ]);

  useEffect(() => {
    if (!selectedDoctorId) return;
    if (doctors.some((doctor) => doctor.id === selectedDoctorId)) return;
    setSelectedDoctorId(doctors[0]?.id || "");
  }, [doctors, selectedDoctorId, setSelectedDoctorId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const wantsBooking =
      params.get("intent") === "booking" ||
      params.has("service") ||
      params.has("doctorId") ||
      params.has("doctor") ||
      params.has("slot");

    if (wantsBooking) {
      void onOpenBookingMode();
    }
  }, [onOpenBookingMode]);
}
