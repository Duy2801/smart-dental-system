import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  createManagedPatientProfile,
  createPatientAppointment,
  getManagedPatientProfiles,
  getPromotions,
} from '../../api';
import { useAppointmentBookingData } from '../../hooks/useAppointmentBookingData';
import type {
  AppointmentItem,
  CreatePatientProfilePayload,
} from '../../types';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { BookingConfirmationView } from './BookingConfirmationView';
import { BookingSelectedSummary } from './BookingSelectedSummary';
import { BookingStepper } from './BookingStepper';
import { DoctorSelector } from './DoctorSelector';
import { PatientSelector } from './PatientSelector';
import { SchedulePicker } from './SchedulePicker';
import { ServiceSelector } from './ServiceSelector';

type BookingModeViewProps = {
  dedicatedDoctorId?: string;
  initialServiceId?: string;
  initialMethodId?: string;
  isLoggedIn: boolean;
  upcomingAppointments: AppointmentItem[];
  onCancelBooking: () => void;
  onBookingComplete: () => void;
};

export function BookingModeView({
  dedicatedDoctorId = '',
  initialServiceId = '',
  initialMethodId = '',
  isLoggedIn,
  upcomingAppointments,
  onCancelBooking: _onCancelBooking,
  onBookingComplete,
}: BookingModeViewProps) {
  const [viewStep, setViewStep] = useState<'form' | 'confirmation'>('form');
  const [activeStep, setActiveStep] = useState<number>(initialServiceId ? 2 : 1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedMethodId, setSelectedMethodId] = useState(initialMethodId);
  const [selectedDoctorId, setSelectedDoctorId] = useState(dedicatedDoctorId);
  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPromotionCode, setSelectedPromotionCode] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const queryClient = useQueryClient();

  // 1. Patient Profiles Query
  const patientProfilesQuery = useQuery({
    queryKey: ['patient-profiles', isLoggedIn],
    queryFn: getManagedPatientProfiles,
    enabled: isLoggedIn,
  });
  const patientProfiles = useMemo(
    () =>
      Array.isArray(patientProfilesQuery.data) ? patientProfilesQuery.data : [],
    [patientProfilesQuery.data],
  );

  // 2. Promotions Query
  const promotionsQuery = useQuery({
    queryKey: ['promotions-active'],
    queryFn: getPromotions,
  });
  const promotions = Array.isArray(promotionsQuery.data)
    ? promotionsQuery.data
    : [];

  // Tự động chọn hồ sơ chính chủ khi tải xong
  useEffect(() => {
    if (!selectedPatientId && patientProfiles.length > 0) {
      const defaultPatient =
        patientProfiles.find(p => p.isPrimary && p.canBook) ??
        patientProfiles.find(p => p.canBook) ??
        patientProfiles[0];
      if (defaultPatient) {
        setSelectedPatientId(defaultPatient.id);
      }
    }
  }, [patientProfiles, selectedPatientId]);

  // Create Patient Profile Mutation
  const createPatientMutation = useMutation({
    mutationFn: createManagedPatientProfile,
    onSuccess: async profile => {
      setSelectedPatientId(profile.id);
      await queryClient.invalidateQueries({ queryKey: ['patient-profiles'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Lỗi tạo hồ sơ',
        err?.response?.data?.message || 'Không thể tạo hồ sơ mới. Vui lòng thử lại.',
      );
    },
  });

  // Booking Data Hook
  const {
    services,
    dates,
    doctors,
    availableTimes,
    slotIntervalMinutes,
    selectedService,
    selectedTreatmentMethod,
    selectedDoctor,
    selectedDate,
    checkingAvailability,
  } = useAppointmentBookingData({
    selectedServiceId,
    selectedTreatmentMethodId: selectedMethodId,
    selectedDoctorId,
    dedicatedDoctorId,
    selectedDateId,
    selectedTime,
  });

  useEffect(() => {
    if (!selectedMethodId || dates.length === 0) return;

    const currentDate = dates.find(date => date.id === selectedDateId);
    if (currentDate?.isOpen) return;

    const defaultDate = dates.find(date => date.isOpen) ?? dates[0];
    if (defaultDate?.id && defaultDate.id !== selectedDateId) {
      setSelectedDateId(defaultDate.id);
      setSelectedTime('');
    }
  }, [dates, selectedDateId, selectedMethodId]);

  const selectedPatient = useMemo(
    () => patientProfiles.find(patient => patient.id === selectedPatientId),
    [patientProfiles, selectedPatientId],
  );

  const safeUpcomingAppointments = useMemo(
    () => (Array.isArray(upcomingAppointments) ? upcomingAppointments : []),
    [upcomingAppointments],
  );

  // Blocked Times calculation for overlapping appointments
  const blockedBookingTimes = useMemo(() => {
    if (!selectedDateId) return { times: [] as string[], ranges: [] as string[] };
    return collectBlockedTimeData(
      safeUpcomingAppointments.filter(
        appointment => appointment.patientId === selectedPatientId,
      ),
      selectedDateId,
      Array.isArray(availableTimes) ? availableTimes : [],
      selectedTreatmentMethod?.durationMinutes ?? 30,
    );
  }, [
    availableTimes,
    safeUpcomingAppointments,
    selectedDateId,
    selectedPatientId,
    selectedTreatmentMethod?.durationMinutes,
  ]);

  const selectableAvailableTimes = useMemo(
    () =>
      (Array.isArray(availableTimes) ? availableTimes : []).filter(
        time => !blockedBookingTimes.times.includes(time),
      ),
    [availableTimes, blockedBookingTimes.times],
  );

  const effectiveSelectedTime = blockedBookingTimes.times.includes(selectedTime)
    ? ''
    : selectedTime;

  // Validation
  const isStep1Complete = Boolean(selectedPatientId);
  const isStep2Complete = Boolean(selectedServiceId) && Boolean(selectedMethodId);
  const isStep3Complete = Boolean(selectedDateId) && Boolean(effectiveSelectedTime);
  const isStep4Complete = Boolean(dedicatedDoctorId || selectedDoctorId);

  const completedSteps = [
    isStep1Complete,
    isStep2Complete,
    isStep3Complete,
    isStep4Complete,
  ];

  const canReview =
    Boolean(selectedService) &&
    Boolean(selectedPatient) &&
    Boolean(selectedTreatmentMethod) &&
    Boolean(selectedDoctor || dedicatedDoctorId) &&
    Boolean(selectedDate) &&
    Boolean(effectiveSelectedTime) &&
    !checkingAvailability;

  // Create Appointment Mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (promoCode?: string) => {
      const scheduledAt = `${selectedDateId}T${effectiveSelectedTime}:00`;
      return createPatientAppointment({
        patientId: selectedPatientId,
        doctorId: dedicatedDoctorId || selectedDoctorId,
        treatmentMethodId: selectedMethodId,
        scheduledAt,
        promotionCode: promoCode || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      Alert.alert(
        'Đặt lịch thành công!',
        'Lịch hẹn của bạn đã được ghi nhận. Bạn có thể theo dõi chi tiết ở tab Lịch khám của tôi.',
        [{ text: 'Đồng ý', onPress: onBookingComplete }],
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Không thể đặt lịch',
        err?.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch hẹn. Vui lòng thử lại.',
      );
    },
  });

  const handleSelectPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {viewStep === 'form' ? (
        <View>
          {/* Stepper Bar */}
          <BookingStepper
            activeStep={activeStep}
            completedSteps={completedSteps}
            onSelectStep={setActiveStep}
          />

          {/* Selected Summary Chips */}
          <BookingSelectedSummary
            selectedPatient={selectedPatient}
            selectedService={selectedService}
            selectedMethod={selectedTreatmentMethod}
            selectedDate={selectedDate}
            selectedTime={effectiveSelectedTime}
            selectedDoctor={selectedDoctor}
          />

          {/* Step 1: Chọn người khám */}
          {activeStep === 1 && (
            <PatientSelector
              patients={patientProfiles}
              selectedPatientId={selectedPatientId}
              isLoading={patientProfilesQuery.isLoading}
              isCreating={createPatientMutation.isPending}
              onSelectPatient={handleSelectPatient}
              onCreatePatient={async (payload: CreatePatientProfilePayload) => {
                await createPatientMutation.mutateAsync(payload);
              }}
              onContinue={() => setActiveStep(2)}
            />
          )}

          {/* Step 2: Chọn dịch vụ & điều trị */}
          {activeStep === 2 && (
            <ServiceSelector
              services={services}
              selectedServiceId={selectedServiceId}
              selectedMethodId={selectedMethodId}
              onSelectService={id => {
                setSelectedServiceId(id);
                setSelectedMethodId('');
                setSelectedDoctorId(dedicatedDoctorId);
                setSelectedDateId('');
                setSelectedTime('');
              }}
              onSelectMethod={id => {
                setSelectedMethodId(id);
                setSelectedDoctorId(dedicatedDoctorId);
                setSelectedDateId('');
                setSelectedTime('');
              }}
              onBack={() => setActiveStep(1)}
              onContinue={() => setActiveStep(3)}
            />
          )}

          {/* Step 3: Chọn ngày và giờ khám */}
          {activeStep === 3 && (
            <SchedulePicker
              dates={dates}
              times={selectableAvailableTimes}
              blockedTimes={blockedBookingTimes.times}
              blockedRanges={blockedBookingTimes.ranges}
              isLoadingTimes={checkingAvailability}
              slotIntervalMinutes={slotIntervalMinutes}
              selectedDateId={selectedDateId}
              selectedTime={effectiveSelectedTime}
              onSelectDate={id => {
                setSelectedDateId(id);
                setSelectedTime('');
              }}
              onSelectTime={time => setSelectedTime(time)}
              onBack={() => setActiveStep(2)}
              onContinue={() => setActiveStep(4)}
            />
          )}

          {/* Step 4: Chọn bác sĩ */}
          {activeStep === 4 && (
            <DoctorSelector
              doctors={doctors}
              selectedId={dedicatedDoctorId || selectedDoctorId}
              isCheckingAvailability={checkingAvailability}
              canReview={canReview}
              onSelect={id => setSelectedDoctorId(dedicatedDoctorId || id)}
              onBack={() => setActiveStep(3)}
              onOpenReview={() => setViewStep('confirmation')}
            />
          )}
        </View>
      ) : (
        /* Confirmation Screen */
        <BookingConfirmationView
          selectedPatient={selectedPatient}
          selectedService={selectedService}
          selectedTreatmentMethod={selectedTreatmentMethod}
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          selectedTime={effectiveSelectedTime}
          promotions={promotions}
          selectedPromotionCode={selectedPromotionCode}
          onSelectPromotionCode={setSelectedPromotionCode}
          acceptedTerms={acceptedTerms}
          onToggleTerms={setAcceptedTerms}
          isSubmitting={createAppointmentMutation.isPending}
          onConfirmBooking={promoCode => createAppointmentMutation.mutate(promoCode)}
          onBackToEdit={() => setViewStep('form')}
        />
      )}

      <PatientFooter style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginHorizontal: -16,
  },
  scrollContent: {
    paddingBottom: 0,
  },
});

function collectBlockedTimeData(
  appointments: AppointmentItem[],
  dateId: string,
  candidateTimes: string[],
  serviceDurationMinutes: number,
) {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeTimes = Array.isArray(candidateTimes) ? candidateTimes : [];

  const appointmentsForDate = safeAppointments.filter(
    appointment => appointment && appointment.dateId === dateId,
  );

  const times = safeTimes.filter(time => {
    if (!time) return false;
    const slotStart = new Date(`${dateId}T${time}:00`);
    const slotEnd = new Date(
      slotStart.getTime() + serviceDurationMinutes * 60 * 1000,
    );

    return appointmentsForDate.some(appointment => {
      if (!appointment?.scheduledAt || !appointment?.endAt) return false;
      const bookedStart = new Date(appointment.scheduledAt);
      const bookedEnd = new Date(appointment.endAt);
      return bookedStart < slotEnd && bookedEnd > slotStart;
    });
  });

  const ranges = appointmentsForDate
    .filter(a => a?.scheduledAt && a?.endAt)
    .map(
      appointment =>
        `${toHourMinute(appointment.scheduledAt)} - ${toHourMinute(appointment.endAt)}`,
    );

  return { times, ranges };
}

function toHourMinute(value: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}
