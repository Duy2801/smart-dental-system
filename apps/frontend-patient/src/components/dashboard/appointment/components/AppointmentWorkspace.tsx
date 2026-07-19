"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/providers";
import { type AppointmentStatus } from "../api";
import { useAppointmentBookingData } from "../hooks/useAppointmentBookingData";
import { useBookingAuthGuard } from "../hooks/useBookingAuthGuard";
import { useCreateAppointment } from "../hooks/useCreateAppointment";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { useAppointmentWorkspaceSync } from "../hooks/useAppointmentWorkspaceSync";
import { useAppointmentWorkspaceView } from "../hooks/useAppointmentWorkspaceView";
import { useCancelAppointment } from "../hooks/useCancelAppointment";
import type { NotificationPreferences } from "../types";
import { BookingModeView } from "./booking/BookingModeView";
import { ManageModeView } from "./workspace/ManageModeView";
import { RescheduleAppointmentModal } from "./workspace/RescheduleAppointmentModal";
import type { AppointmentItem } from "../api";

export function AppointmentWorkspace({
  initialMode = "manage",
}: {
  initialMode?: "manage" | "booking";
}) {
  const { isAuthenticated, accessToken } = useAppSelector(
    (state) => state.login,
  );
  const isLoggedIn = isAuthenticated && Boolean(accessToken);

  const [mode, setMode] = useState<"manage" | "booking">(initialMode);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDateId, setSelectedDateId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<
    string | null
  >(null);
  const [reschedulingAppointment, setReschedulingAppointment] =
    useState<AppointmentItem | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email: true,
    app: true,
    sms: false,
  });

  const { ensureLoggedInBeforeBooking } = useBookingAuthGuard({ isLoggedIn });
  const {
    baseOptionsQuery,
    services,
    dates,
    doctors,
    availableTimes,
    selectedService,
    selectedDoctor,
    selectedDate,
    slotIntervalMinutes,
    loading,
    checkingAvailability,
  } = useAppointmentBookingData({
    selectedServiceId,
    selectedDoctorId,
    selectedDateId,
    selectedTime,
  });
  const { upcoming, historyItems, appointments } = usePatientAppointments(
    isLoggedIn,
  );
  const blockedBookingTimes = useMemo(() => {
    if (!selectedDateId) {
      return {
        times: [] as string[],
        ranges: [] as string[],
      };
    }

    return collectBlockedTimeData(
      upcoming,
      selectedDateId,
      availableTimes,
      selectedService?.durationMinutes ?? 30,
    );
  }, [availableTimes, selectedDateId, selectedService?.durationMinutes, upcoming]);
  const selectableAvailableTimes = useMemo(
    () =>
      availableTimes.filter((time) => !blockedBookingTimes.times.includes(time)),
    [availableTimes, blockedBookingTimes.times],
  );
  const { createAppointment, isSubmitting: submitting } = useCreateAppointment({
    dates,
    availableTimes: selectableAvailableTimes,
    selectedDoctorId,
    selectedServiceId,
    selectedDateId,
    selectedTime,
    ensureLoggedInBeforeBooking,
    onSelectedTimeChange: setSelectedTime,
    onSelectedDoctorChange: setSelectedDoctorId,
    onSuccess: setBookingSuccessMessage,
  });
  const {
    cancelAppointment,
    cancellingAppointmentId,
  } = useCancelAppointment();

  const openBookingMode = useCallback(async () => {
    const canBook = await ensureLoggedInBeforeBooking();
    if (!canBook) return;
    setMode("booking");
  }, [ensureLoggedInBeforeBooking]);

  useAppointmentWorkspaceSync({
    bookingOptionsData: baseOptionsQuery.data,
    hasBookingOptionsError: baseOptionsQuery.isError,
    dates,
    doctors,
    availableTimes: selectableAvailableTimes,
    selectedDateId,
    selectedTime,
    selectedDoctorId,
    onOpenBookingMode: openBookingMode,
    setSelectedServiceId,
    setSelectedDoctorId,
    setSelectedDateId,
    setSelectedTime,
  });

  const { history, current } = useAppointmentWorkspaceView({
    upcoming,
    historyItems,
    query,
    statusFilter,
  });

  useEffect(() => {
    if (selectedTime && blockedBookingTimes.times.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [blockedBookingTimes.times, selectedTime]);

  if (mode === "booking") {
    return (
      <BookingModeView
        services={services}
        doctors={doctors}
        dates={dates}
        times={selectableAvailableTimes}
        blockedTimes={blockedBookingTimes.times}
        blockedRanges={blockedBookingTimes.ranges}
        selectedServiceId={selectedServiceId}
        selectedDoctorId={selectedDoctorId}
        selectedDateId={selectedDateId}
        selectedTime={selectedTime}
        selectedService={selectedService}
        selectedDoctor={selectedDoctor}
        selectedDate={selectedDate}
        slotIntervalMinutes={slotIntervalMinutes}
        current={current}
        notifications={notifications}
        successMessage={bookingSuccessMessage}
        isSubmitting={submitting}
        isCheckingAvailability={checkingAvailability}
        onSelectService={setSelectedServiceId}
        onSelectDoctor={setSelectedDoctorId}
        onSelectDate={setSelectedDateId}
        onSelectTime={setSelectedTime}
        onToggleNotification={(key) =>
          setNotifications((value) => ({ ...value, [key]: !value[key] }))
        }
        onOpenReview={() => setBookingSuccessMessage(null)}
        onConfirmBooking={createAppointment}
        onCancelBooking={() => {
          setBookingSuccessMessage(null);
          setSelectedServiceId("");
          setSelectedDoctorId("");
          setSelectedDateId("");
          setSelectedTime("");
          setMode("manage");
        }}
        onCloseSuccess={() => {
          setBookingSuccessMessage(null);
          setMode("manage");
        }}
      />
    );
  }

  return (
    <>
      <ManageModeView
        appointments={appointments}
        upcoming={upcoming}
        history={history}
        query={query}
        statusFilter={statusFilter}
        loading={loading}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onResetFilters={() => {
          setQuery("");
          setStatusFilter("all");
        }}
        onOpenBooking={openBookingMode}
        onReschedule={setReschedulingAppointment}
        onCancelAppointment={cancelAppointment}
        cancellingAppointmentId={cancellingAppointmentId}
      />
      {reschedulingAppointment ? (
        <RescheduleAppointmentModal
          appointment={reschedulingAppointment}
          bookedAppointments={upcoming}
          onClose={() => setReschedulingAppointment(null)}
        />
      ) : null}
    </>
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
    const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60 * 1000);

    return appointmentsForDate.some((appointment) => {
      const bookedStart = new Date(appointment.scheduledAt);
      const bookedEnd = new Date(appointment.endAt);
      return bookedStart < slotEnd && bookedEnd > slotStart;
    });
  });

  const ranges = appointmentsForDate.map((appointment) =>
    `${toHourMinute(appointment.scheduledAt)} - ${toHourMinute(appointment.endAt)}`,
  );

  return {
    times,
    ranges,
  };
}

function toHourMinute(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
