import { useMemo } from "react";
import { type BookingOptionsQuery } from "../api";
import { getAvailableTimes } from "../utils";
import {
  useAppointmentAvailabilityQuery,
  useAppointmentOptionsBaseQuery,
  useAppointmentScheduleQuery,
} from "./useAppointmentQueries";

type UseAppointmentBookingDataParams = {
  selectedServiceId: string;
  selectedTreatmentMethodId?: string;
  selectedDoctorId: string;
  dedicatedDoctorId?: string;
  selectedDateId: string;
  selectedTime: string;
};

export function useAppointmentBookingData({
  selectedServiceId,
  selectedTreatmentMethodId,
  selectedDoctorId,
  dedicatedDoctorId,
  selectedDateId,
  selectedTime,
}: UseAppointmentBookingDataParams) {
  const doctorIdForQuery = dedicatedDoctorId || selectedDoctorId || undefined;
  const baseOptionsQuery = useAppointmentOptionsBaseQuery(
    doctorIdForQuery ? { doctorId: doctorIdForQuery } : {},
  );

  const scheduleQueryParams: BookingOptionsQuery = useMemo(
    () => ({
      serviceId: selectedServiceId,
      treatmentMethodId: selectedTreatmentMethodId,
      doctorId: doctorIdForQuery,
      date: selectedDateId,
    }),
    [
      doctorIdForQuery,
      selectedDateId,
      selectedServiceId,
      selectedTreatmentMethodId,
    ],
  );

  const scheduleQuery = useAppointmentScheduleQuery(scheduleQueryParams);

  const availabilityQueryParams: BookingOptionsQuery = useMemo(
    () => ({
      serviceId: selectedServiceId,
      treatmentMethodId: selectedTreatmentMethodId,
      doctorId: doctorIdForQuery,
      date: selectedDateId,
      time: selectedTime,
    }),
    [
      doctorIdForQuery,
      selectedDateId,
      selectedServiceId,
      selectedTime,
      selectedTreatmentMethodId,
    ],
  );

  const availabilityQuery = useAppointmentAvailabilityQuery(
    availabilityQueryParams,
  );

  const services = useMemo(
    () => baseOptionsQuery.data?.services ?? [],
    [baseOptionsQuery.data?.services],
  );
  const dates = useMemo(
    () => scheduleQuery.data?.dates ?? baseOptionsQuery.data?.dates ?? [],
    [scheduleQuery.data?.dates, baseOptionsQuery.data?.dates],
  );
  const doctors = useMemo(() => {
    if (dedicatedDoctorId) {
      return baseOptionsQuery.data?.doctors ?? [];
    }

    if (selectedServiceId && selectedDateId && selectedTime) {
      return availabilityQuery.data?.doctors ?? [];
    }

    return scheduleQuery.data?.doctors ?? baseOptionsQuery.data?.doctors ?? [];
  }, [
    availabilityQuery.data?.doctors,
    baseOptionsQuery.data?.doctors,
    dedicatedDoctorId,
    scheduleQuery.data?.doctors,
    selectedDateId,
    selectedServiceId,
    selectedTime,
  ]);
  const timeSlots = useMemo(
    () =>
      scheduleQuery.data?.timeSlots ?? baseOptionsQuery.data?.timeSlots ?? [],
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
  const selectedTreatmentMethod = useMemo(
    () =>
      selectedService?.treatmentMethods.find(
        (m) => m.id === selectedTreatmentMethodId,
      ),
    [selectedService?.treatmentMethods, selectedTreatmentMethodId],
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
    selectedTreatmentMethod,
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
