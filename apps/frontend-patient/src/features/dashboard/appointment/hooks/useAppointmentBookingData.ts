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
  const doctorIdForQuery = dedicatedDoctorId || undefined;
  const baseOptionsQueryParams: BookingOptionsQuery = useMemo(
    () => ({
      doctorId: doctorIdForQuery,
    }),
    [doctorIdForQuery],
  );
  const baseOptionsQuery = useAppointmentOptionsBaseQuery(
    baseOptionsQueryParams,
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

  const scheduleDoctors = useMemo(
    () => scheduleQuery.data?.doctors ?? [],
    [scheduleQuery.data],
  );
  const hasSlotInfo = useMemo(
    () =>
      scheduleDoctors.some(
        (doctor) =>
          Array.isArray(doctor.availableTimeSlots) &&
          doctor.availableTimeSlots.length > 0,
      ),
    [scheduleDoctors],
  );

  const availabilityQuery = useAppointmentAvailabilityQuery(
    availabilityQueryParams,
    !hasSlotInfo,
  );
  const hasSelectedTreatment = Boolean(
    selectedServiceId && selectedTreatmentMethodId,
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
    if (
      dedicatedDoctorId &&
      !(selectedServiceId && selectedDateId && selectedTime)
    ) {
      return baseOptionsQuery.data?.doctors ?? [];
    }

    if (selectedServiceId && selectedDateId && selectedTime) {
      const scheduleDocs = scheduleQuery.data?.doctors ?? [];
      // 1. If doctors have availableTimeSlots (our optimized backend), filter directly client-side
      if (hasSlotInfo) {
        return scheduleDocs.filter((doctor) =>
          doctor.availableTimeSlots?.includes(selectedTime),
        );
      }

      // 2. Fallback to availabilityQuery if available (e.g. Vercel backend or slot filtering on server)
      if (availabilityQuery.data) {
        return availabilityQuery.data.doctors ?? [];
      }

      // 3. Do not expose unverified doctors while availability is loading.
      return [];
    }

    if (hasSelectedTreatment) {
      return scheduleQuery.data?.doctors ?? [];
    }

    return baseOptionsQuery.data?.doctors ?? [];
  }, [
    availabilityQuery.data,
    baseOptionsQuery.data,
    dedicatedDoctorId,
    hasSelectedTreatment,
    hasSlotInfo,
    scheduleQuery.data,
    selectedDateId,
    selectedServiceId,
    selectedTime,
  ]);
  const timeSlots = useMemo(() => {
    if (hasSelectedTreatment) {
      return scheduleQuery.data?.timeSlots ?? [];
    }

    return baseOptionsQuery.data?.timeSlots ?? [];
  }, [
    baseOptionsQuery.data?.timeSlots,
    hasSelectedTreatment,
    scheduleQuery.data?.timeSlots,
  ]);
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
  const lunchBreak =
    scheduleQuery.data?.lunchBreak ?? baseOptionsQuery.data?.lunchBreak;
  const availableTimes = useMemo(
    () =>
      lunchBreak
        ? getAvailableTimes(
            selectedDateId,
            timeSlots,
            selectedTreatmentMethod?.durationMinutes ?? 30,
            lunchBreak,
          )
        : [],
    [
      lunchBreak,
      selectedDateId,
      selectedTreatmentMethod?.durationMinutes,
      timeSlots,
    ],
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
      (scheduleQuery.isFetching && !scheduleQuery.data) ||
      (!hasSlotInfo && availabilityQuery.isFetching && !availabilityQuery.data),
  };
}
