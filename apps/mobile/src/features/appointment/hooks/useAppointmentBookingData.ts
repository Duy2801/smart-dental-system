import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAppointmentOptions } from '../api';
import type { BookingOptionsQuery } from '../types';

type UseAppointmentBookingDataParams = {
  selectedServiceId: string;
  selectedTreatmentMethodId: string;
  selectedDoctorId: string;
  dedicatedDoctorId?: string;
  selectedDateId: string;
  selectedTime: string;
};

export function useAppointmentBookingData({
  selectedServiceId,
  selectedTreatmentMethodId,
  selectedDoctorId,
  dedicatedDoctorId = '',
  selectedDateId,
  selectedTime,
}: UseAppointmentBookingDataParams) {
  const queryParams: BookingOptionsQuery = useMemo(
    () => ({
      serviceId: selectedServiceId || undefined,
      treatmentMethodId: selectedTreatmentMethodId || undefined,
      doctorId: dedicatedDoctorId || selectedDoctorId || undefined,
      date: selectedDateId || undefined,
      time: selectedTime || undefined,
    }),
    [
      dedicatedDoctorId,
      selectedDateId,
      selectedDoctorId,
      selectedServiceId,
      selectedTime,
      selectedTreatmentMethodId,
    ],
  );

  const baseOptionsQuery = useQuery({
    queryKey: ['patient-appointment-booking-options', queryParams],
    queryFn: () => getAppointmentOptions(queryParams),
    staleTime: 30000,
  });

  const services = useMemo(
    () => (Array.isArray(baseOptionsQuery.data?.services) ? baseOptionsQuery.data.services : []),
    [baseOptionsQuery.data?.services],
  );

  const dates = useMemo(
    () => (Array.isArray(baseOptionsQuery.data?.dates) ? baseOptionsQuery.data.dates : []),
    [baseOptionsQuery.data?.dates],
  );

  const allDoctors = useMemo(
    () => (Array.isArray(baseOptionsQuery.data?.doctors) ? baseOptionsQuery.data.doctors : []),
    [baseOptionsQuery.data?.doctors],
  );

  const availableTimes = useMemo(
    () => (Array.isArray(baseOptionsQuery.data?.timeSlots) ? baseOptionsQuery.data.timeSlots : []),
    [baseOptionsQuery.data?.timeSlots],
  );

  const slotIntervalMinutes =
    baseOptionsQuery.data?.slotIntervalMinutes ?? 30;

  // Lọc bác sĩ phù hợp: nếu đã chọn giờ, ưu tiên bác sĩ có khung giờ đó
  const doctors = useMemo(() => {
    if (!selectedTime) return allDoctors;
    const matched = allDoctors.filter(
      doc =>
        !doc.availableTimeSlots?.length ||
        doc.availableTimeSlots.includes(selectedTime),
    );
    return matched.length ? matched : allDoctors;
  }, [allDoctors, selectedTime]);

  const selectedService = useMemo(
    () => services.find(item => item.id === selectedServiceId),
    [services, selectedServiceId],
  );

  const selectedTreatmentMethod = useMemo(() => {
    if (!selectedService) return undefined;
    const methods = Array.isArray(selectedService.treatmentMethods)
      ? selectedService.treatmentMethods
      : [];
    return methods.find(method => method.id === selectedTreatmentMethodId);
  }, [selectedService, selectedTreatmentMethodId]);

  const selectedDoctor = useMemo(
    () => doctors.find(item => item.id === (dedicatedDoctorId || selectedDoctorId)),
    [dedicatedDoctorId, doctors, selectedDoctorId],
  );

  const selectedDate = useMemo(
    () => dates.find(item => item.id === selectedDateId),
    [dates, selectedDateId],
  );

  return {
    baseOptionsQuery,
    services,
    dates,
    doctors,
    availableTimes,
    slotIntervalMinutes,
    selectedService,
    selectedTreatmentMethod,
    selectedDoctor,
    selectedDate,
    checkingAvailability: baseOptionsQuery.isFetching,
  };
}
