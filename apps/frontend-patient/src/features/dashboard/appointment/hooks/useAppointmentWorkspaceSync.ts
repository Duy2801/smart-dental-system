import { useEffect } from "react";
import { toast } from "@/features/dashboard/common/toast";
import type { AppointmentService, BookingDate, Dentist } from "../types";
import { getSearchParams, pickFirstBookableDate } from "../utils";

type BookingOptionsData = {
  services: AppointmentService[];
  doctors: Dentist[];
  dates: BookingDate[];
};

type UseAppointmentWorkspaceSyncParams = {
  enabled?: boolean;
  autoSelectDefaults?: boolean;
  defaultSelectionKey?: string;
  bookingOptionsData?: BookingOptionsData;
  hasBookingOptionsError: boolean;
  dates: BookingDate[];
  doctors: Dentist[];
  availableTimes: string[];
  selectedDateId: string;
  selectedTime: string;
  selectedDoctorId: string;
  fixedDoctorId?: string;
  onOpenBookingMode: () => Promise<void>;
  setSelectedServiceId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedMethodId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDoctorId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDateId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
};

export function useAppointmentWorkspaceSync({
  enabled = true,
  autoSelectDefaults = false,
  defaultSelectionKey,
  bookingOptionsData,
  hasBookingOptionsError,
  dates,
  doctors,
  availableTimes,
  selectedDateId,
  selectedTime,
  selectedDoctorId,
  fixedDoctorId,
  onOpenBookingMode,
  setSelectedServiceId,
  setSelectedMethodId,
  setSelectedDoctorId,
  setSelectedDateId,
  setSelectedTime,
}: UseAppointmentWorkspaceSyncParams) {
  useEffect(() => {
    if (hasBookingOptionsError) {
      toast.error(
        "Không thể tải dữ liệu lịch hẹn",
        "Vui lòng kiểm tra backend hoặc thử tải lại trang.",
      );
    }
  }, [hasBookingOptionsError]);

  useEffect(() => {
    if (!enabled || !bookingOptionsData) return;

    const params = getSearchParams();
    const requestedServiceId = params.get("service");
    const requestedMethodId =
      params.get("treatmentMethod") ||
      params.get("method") ||
      params.get("treatmentMethodId");
    const requestedDoctorId = fixedDoctorId || params.get("doctorId");

    let initialService = bookingOptionsData.services.find(
      (service) => service.id === requestedServiceId,
    );

    if (!initialService && requestedMethodId) {
      initialService = bookingOptionsData.services.find((service) =>
        service.treatmentMethods.some((m) => m.id === requestedMethodId),
      );
    }

    if (!initialService && autoSelectDefaults) {
      initialService = bookingOptionsData.services[0];
    }

    const initialMethodId =
      (requestedMethodId &&
      initialService?.treatmentMethods.some((m) => m.id === requestedMethodId)
        ? requestedMethodId
        : "") || "";

    if (requestedServiceId || requestedMethodId || autoSelectDefaults) {
      if (initialService) {
        setSelectedServiceId(initialService.id);
        setSelectedMethodId(initialMethodId);
      }
    }

    const requestedDoctor = bookingOptionsData.doctors.find(
      (doctor) => doctor.id === requestedDoctorId,
    );
    if (requestedDoctor) {
      setSelectedDoctorId((current) => current || requestedDoctor.id);
    }

    if (autoSelectDefaults) {
      const firstBookableDate = pickFirstBookableDate(bookingOptionsData.dates);
      setSelectedDateId((current) => current || firstBookableDate?.id || "");
    }
  }, [
    autoSelectDefaults,
    bookingOptionsData,
    defaultSelectionKey,
    enabled,
    fixedDoctorId,
    setSelectedDateId,
    setSelectedDoctorId,
    setSelectedMethodId,
    setSelectedServiceId,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (!selectedDateId || dates.length === 0) return;

    if (availableTimes.length === 0) {
      if (autoSelectDefaults) {
        const nextDate = dates.find(
          (date) => date.isOpen && date.id !== selectedDateId,
        );

        if (nextDate && nextDate.id !== selectedDateId) {
          setSelectedDateId(nextDate.id);
        } else {
          setSelectedTime("");
        }
      } else {
        setSelectedTime("");
      }

      return;
    }

    if (selectedTime && !availableTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [
    autoSelectDefaults,
    availableTimes,
    dates,
    enabled,
    selectedDateId,
    selectedTime,
    setSelectedDateId,
    setSelectedTime,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (fixedDoctorId) {
      if (selectedDoctorId !== fixedDoctorId) {
        setSelectedDoctorId(fixedDoctorId);
      }
      return;
    }
    if (!selectedDoctorId) return;
    if (doctors.some((doctor) => doctor.id === selectedDoctorId)) return;
    setSelectedDoctorId(autoSelectDefaults ? doctors[0]?.id || "" : "");
  }, [
    autoSelectDefaults,
    doctors,
    enabled,
    fixedDoctorId,
    selectedDoctorId,
    setSelectedDoctorId,
  ]);

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
