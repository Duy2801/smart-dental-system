import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAppointmentOptions,
  type BookingOptionsQuery,
} from "../api";
import { getAvailableTimes } from "../utils";

type UseAppointmentBookingDataParams = {
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDateId: string;
  selectedTime: string;
};

export function useAppointmentBookingData({
  selectedServiceId,
  selectedDoctorId,
  selectedDateId,
  selectedTime,
}: UseAppointmentBookingDataParams) {
  const baseOptionsQuery = useQuery({
    queryKey: ["patient", "appointment-options", "base"],
    queryFn: () => getAppointmentOptions(),
  });

  const scheduleQueryParams: BookingOptionsQuery = {
    serviceId: selectedServiceId,
    date: selectedDateId,
  };

  const scheduleQuery = useQuery({
    queryKey: [
      "patient",
      "appointment-options",
      "schedule",
      scheduleQueryParams,
    ],
    queryFn: () => getAppointmentOptions(scheduleQueryParams),
    enabled: Boolean(selectedServiceId && selectedDateId),
    placeholderData: (previousData) => previousData,
  });

  const availabilityQueryParams: BookingOptionsQuery = {
    serviceId: selectedServiceId,
    date: selectedDateId,
    time: selectedTime,
  };

  const availabilityQuery = useQuery({
    queryKey: [
      "patient",
      "appointment-options",
      "availability",
      availabilityQueryParams,
    ],
    queryFn: () => getAppointmentOptions(availabilityQueryParams),
    enabled: Boolean(selectedServiceId && selectedDateId && selectedTime),
    placeholderData: (previousData) => previousData,
  });

  const services = useMemo(
    () => baseOptionsQuery.data?.services ?? [],
    [baseOptionsQuery.data?.services],
  );
  const dates = useMemo(
    () => scheduleQuery.data?.dates ?? baseOptionsQuery.data?.dates ?? [],
    [scheduleQuery.data?.dates, baseOptionsQuery.data?.dates],
  );
  const doctors = useMemo(() => {
    if (selectedServiceId && selectedDateId && selectedTime) {
      return availabilityQuery.data?.doctors ?? [];
    }

    return scheduleQuery.data?.doctors ?? baseOptionsQuery.data?.doctors ?? [];
  }, [
    availabilityQuery.data?.doctors,
    baseOptionsQuery.data?.doctors,
    scheduleQuery.data?.doctors,
    selectedDateId,
    selectedServiceId,
    selectedTime,
  ]);
  const timeSlots = useMemo(
    () => scheduleQuery.data?.timeSlots ?? baseOptionsQuery.data?.timeSlots ?? [],
    [scheduleQuery.data?.timeSlots, baseOptionsQuery.data?.timeSlots],
  );
  const availableTimes = useMemo(
    () => getAvailableTimes(selectedDateId, timeSlots),
    [selectedDateId, timeSlots],
  );
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [services, selectedServiceId],
  );
  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId),
    [doctors, selectedDoctorId],
  );
  const selectedDate = useMemo(
    () => dates.find((date) => date.id === selectedDateId),
    [dates, selectedDateId],
  );

  return {
    baseOptionsQuery,
    services,
    dates,
    doctors,
    timeSlots,
    availableTimes,
    selectedService,
    selectedDoctor,
    selectedDate,
    slotIntervalMinutes:
      scheduleQuery.data?.slotIntervalMinutes ??
      baseOptionsQuery.data?.slotIntervalMinutes ??
      30,
    loading: baseOptionsQuery.isLoading,
    checkingAvailability:
      scheduleQuery.isFetching || availabilityQuery.isFetching,
  };
}
