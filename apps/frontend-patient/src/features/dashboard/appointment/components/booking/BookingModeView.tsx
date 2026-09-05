"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppointmentBookingData } from "../../hooks/useAppointmentBookingData";
import { useCreateAppointment } from "../../hooks/useCreateAppointment";
import { useAppointmentWorkspaceSync } from "../../hooks/useAppointmentWorkspaceSync";
import {
  createManagedPatientProfile,
  type AppointmentItem,
  type CreatePatientProfilePayload,
} from "../../api";
import { appointmentStatusLabels } from "../../utils";
import { BookingPanel } from "./BookingPanel";
import { BookingConfirmationView } from "./BookingConfirmationView";
import { CurrentAppointmentCard } from "../sidebar/CurrentAppointmentCard";
import { NotificationSettings } from "../sidebar/NotificationSettings";
import { SupportCard } from "../sidebar/SupportCard";
import { AppointmentWorkspaceHeader } from "../AppointmentWorkspaceHeader";
import {
  appointmentQueryKeys,
  useManagedPatientProfilesQuery,
} from "../../hooks/useAppointmentQueries";

type BookingModeViewProps = {
  dedicatedDoctorId?: string;
  isLoggedIn: boolean;
  ensureLoggedInBeforeBooking: () => Promise<boolean>;
  upcomingAppointments: AppointmentItem[];
  onCancelBooking: () => void;
  onBookingComplete: () => void;
};

export function BookingModeView({
  dedicatedDoctorId = "",
  isLoggedIn,
  ensureLoggedInBeforeBooking,
  upcomingAppointments,
  onCancelBooking,
  onBookingComplete,
}: BookingModeViewProps) {
  const [viewStep, setViewStep] = useState<"form" | "confirmation">("form");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState(dedicatedDoctorId);
  const [selectedDateId, setSelectedDateId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPromotionCode, setSelectedPromotionCode] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const queryClient = useQueryClient();
  const patientProfilesQuery = useManagedPatientProfilesQuery(isLoggedIn);
  const patientProfiles = patientProfilesQuery.data ?? [];

  // Tự động chọn người khám chính (chính chủ hoặc hồ sơ đầu tiên) khi danh sách tải xong
  useEffect(() => {
    if (!selectedPatientId && patientProfiles.length > 0) {
      const defaultPatient =
        patientProfiles.find((p) => p.isPrimary && p.canBook) ??
        patientProfiles.find((p) => p.canBook) ??
        patientProfiles[0];
      if (defaultPatient) {
        setSelectedPatientId(defaultPatient.id);
      }
    }
  }, [selectedPatientId, patientProfiles]);


  const createPatientMutation = useMutation({
    mutationFn: createManagedPatientProfile,
    onSuccess: async (profile) => {
      setSelectedPatientId(profile.id);
      setSelectedServiceId("");
      setSelectedMethodId("");
      setSelectedDoctorId(dedicatedDoctorId);
      setSelectedDateId("");
      setSelectedTime("");
      setSelectedPromotionCode("");
      setAcceptedTerms(false);
      await queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.patientProfiles(),
      });
    },
  });

  const {
    baseOptionsQuery,
    services,
    dates,
    doctors,
    availableTimes,
    selectedService,
    selectedTreatmentMethod,
    selectedDoctor,
    selectedDate,
    slotIntervalMinutes,
    checkingAvailability,
  } = useAppointmentBookingData({
    selectedServiceId,
    selectedTreatmentMethodId: selectedMethodId,
    selectedDoctorId,
    dedicatedDoctorId,
    selectedDateId,
    selectedTime,
  });

  const selectedPatient = useMemo(
    () => patientProfiles.find((patient) => patient.id === selectedPatientId),
    [patientProfiles, selectedPatientId],
  );

  const resetBookingChoices = useCallback(() => {
    setSelectedServiceId("");
    setSelectedMethodId("");
    setSelectedDoctorId(dedicatedDoctorId);
    setSelectedDateId("");
    setSelectedTime("");
    setSelectedPromotionCode("");
    setAcceptedTerms(false);
  }, [dedicatedDoctorId]);

  const handleSelectPatient = useCallback(
    (patientId: string) => {
      setSelectedPatientId(patientId);
      resetBookingChoices();
    },
    [resetBookingChoices],
  );

  const blockedBookingTimes = useMemo(() => {
    if (!selectedDateId) {
      return { times: [] as string[], ranges: [] as string[] };
    }
    return collectBlockedTimeData(
      upcomingAppointments.filter(
        (appointment) => appointment.patientId === selectedPatientId,
      ),
      selectedDateId,
      availableTimes,
      selectedTreatmentMethod?.durationMinutes ?? 30,
    );
  }, [
    availableTimes,
    selectedDateId,
    selectedPatientId,
    selectedTreatmentMethod?.durationMinutes,
    upcomingAppointments,
  ]);

  const selectableAvailableTimes = useMemo(
    () =>
      availableTimes.filter(
        (time) => !blockedBookingTimes.times.includes(time),
      ),
    [availableTimes, blockedBookingTimes.times],
  );

  const effectiveSelectedTime = blockedBookingTimes.times.includes(selectedTime)
    ? ""
    : selectedTime;

  const { createAppointment, isSubmitting } = useCreateAppointment({
    dates,
    availableTimes: selectableAvailableTimes,
    selectedDoctorId,
    selectedServiceId,
    selectedTreatmentMethodId: selectedMethodId,
    selectedDateId,
    selectedTime: effectiveSelectedTime,
    selectedPromotionCode,
    selectedPatientId,
    ensureLoggedInBeforeBooking,
    onSelectedTimeChange: setSelectedTime,
    onSelectedDoctorChange: (doctorId) => {
      setSelectedDoctorId(dedicatedDoctorId || doctorId);
    },
    onSuccess: () => onBookingComplete(),
  });

  useAppointmentWorkspaceSync({
    enabled: Boolean(selectedPatientId),
    autoSelectDefaults: false,
    defaultSelectionKey: selectedPatientId,
    bookingOptionsData: baseOptionsQuery.data,
    hasBookingOptionsError: baseOptionsQuery.isError,
    dates,
    doctors,
    availableTimes: selectableAvailableTimes,
    selectedDateId,
    selectedTime: effectiveSelectedTime,
    selectedDoctorId,
    fixedDoctorId: dedicatedDoctorId,
    onOpenBookingMode: async () => {},
    setSelectedServiceId,
    setSelectedMethodId,
    setSelectedDoctorId,
    setSelectedDateId,
    setSelectedTime,
  });

  const current = useMemo(
    () =>
      upcomingAppointments[0]
        ? {
            service: upcomingAppointments[0].service,
            date: upcomingAppointments[0].date,
            time: upcomingAppointments[0].time,
            doctor: upcomingAppointments[0].doctor,
            status: appointmentStatusLabels[upcomingAppointments[0].status],
          }
        : null,
    [upcomingAppointments],
  );

  const disabled =
    services.length === 0 ||
    doctors.length === 0 ||
    selectableAvailableTimes.length === 0 ||
    Boolean(isSubmitting) ||
    Boolean(checkingAvailability);

  const canReview =
    Boolean(selectedService) &&
    Boolean(selectedPatient) &&
    Boolean(selectedTreatmentMethod) &&
    Boolean(selectedDoctor) &&
    Boolean(selectedDate) &&
    Boolean(effectiveSelectedTime) &&
    !disabled;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewStep]);

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
      <AppointmentWorkspaceHeader
        mode="booking"
        title={
          viewStep === "confirmation"
            ? "Xác nhận thông tin & Hoàn tất đặt lịch"
            : "Đặt lịch hẹn mới"
        }
        subtitle={
          viewStep === "confirmation"
            ? undefined
            : "Chọn dịch vụ, thời gian và bác sĩ phù hợp với bạn."
        }
        onSelectManage={onCancelBooking}
        onSelectBooking={() => setViewStep("form")}
      />

      {viewStep === "form" ? (
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.7fr)_360px]">
          <BookingPanel
            patients={patientProfiles}
            services={services}
            doctors={doctors}
            dates={dates}
            times={selectableAvailableTimes}
            blockedTimes={blockedBookingTimes.times}
            blockedRanges={blockedBookingTimes.ranges}
            slotIntervalMinutes={slotIntervalMinutes}
            selectedServiceId={selectedServiceId}
            selectedPatientId={selectedPatientId}
            selectedMethodId={selectedMethodId}
            selectedDoctorId={selectedDoctorId}
            selectedDateId={selectedDateId}
            selectedTime={effectiveSelectedTime}
            canReview={canReview}
            isCheckingAvailability={checkingAvailability}
            isLoadingPatients={patientProfilesQuery.isLoading}
            isCreatingPatient={createPatientMutation.isPending}
            canEditBookingDetails={Boolean(selectedPatientId)}
            onSelectPatient={handleSelectPatient}
            onCreatePatient={async (payload: CreatePatientProfilePayload) => {
              await createPatientMutation.mutateAsync(payload);
            }}
            onSelectService={(serviceId) => {
              setSelectedServiceId(serviceId);
              setSelectedMethodId("");
              setSelectedDoctorId(dedicatedDoctorId);
              setSelectedDateId("");
              setSelectedTime("");
            }}
            onSelectMethod={(methodId) => {
              setSelectedMethodId(methodId);
              setSelectedDoctorId(dedicatedDoctorId);
              setSelectedDateId("");
              setSelectedTime("");
            }}
            onSelectDoctor={(doctorId) => {
              setSelectedDoctorId(dedicatedDoctorId || doctorId);
            }}
            onSelectDate={(dateId) => {
              setSelectedDateId(dateId);
              setSelectedDoctorId(dedicatedDoctorId);
              setSelectedTime("");
            }}
            onSelectTime={(time) => {
              setSelectedTime(time);
              setSelectedDoctorId(dedicatedDoctorId);
            }}
            onOpenReview={() => setViewStep("confirmation")}
            onCancelBooking={onCancelBooking}
          />
          <aside className="space-y-5 lg:sticky lg:top-24">
            <CurrentAppointmentCard appointment={current} />
            <NotificationSettings />
            <SupportCard />
          </aside>
        </div>
      ) : (
        <BookingConfirmationView
          selectedPatient={selectedPatient}
          selectedService={selectedService}
          selectedTreatmentMethod={selectedTreatmentMethod}
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          selectedTime={effectiveSelectedTime}
          selectedPromotionCode={selectedPromotionCode}
          onSelectPromotionCode={setSelectedPromotionCode}
          acceptedTerms={acceptedTerms}
          onToggleTerms={setAcceptedTerms}
          isSubmitting={isSubmitting}
          onConfirmBooking={createAppointment}
          onBackToEdit={() => setViewStep("form")}
        />
      )}
    </main>
  );
}

function collectBlockedTimeData(
  appointments: AppointmentItem[],
  dateId: string,
  candidateTimes: string[],
  serviceDurationMinutes: number,
) {
  const appointmentsForDate = appointments.filter(
    (appointment) => appointment.dateId === dateId,
  );

  const times = candidateTimes.filter((time) => {
    const slotStart = new Date(`${dateId}T${time}:00`);
    const slotEnd = new Date(
      slotStart.getTime() + serviceDurationMinutes * 60 * 1000,
    );

    return appointmentsForDate.some((appointment) => {
      const bookedStart = new Date(appointment.scheduledAt);
      const bookedEnd = new Date(appointment.endAt);
      return bookedStart < slotEnd && bookedEnd > slotStart;
    });
  });

  const ranges = appointmentsForDate.map(
    (appointment) =>
      `${toHourMinute(appointment.scheduledAt)} - ${toHourMinute(appointment.endAt)}`,
  );

  return { times, ranges };
}

function toHourMinute(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
