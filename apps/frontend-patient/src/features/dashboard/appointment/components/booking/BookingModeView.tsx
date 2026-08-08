"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppointmentBookingData } from "../../hooks/useAppointmentBookingData";
import { useCreateAppointment } from "../../hooks/useCreateAppointment";
import { useAppointmentWorkspaceSync } from "../../hooks/useAppointmentWorkspaceSync";
import type { AppointmentItem } from "../../api";
import type { AppointmentPaymentOption } from "../../types";
import { appointmentStatusLabels } from "../../utils";
import { BookingPanel } from "./BookingPanel";
import { BookingConfirmationView } from "./BookingConfirmationView";
import { CurrentAppointmentCard } from "../sidebar/CurrentAppointmentCard";
import { NotificationSettings } from "../sidebar/NotificationSettings";
import { SupportCard } from "../sidebar/SupportCard";

type BookingModeViewProps = {
  isLoggedIn: boolean;
  ensureLoggedInBeforeBooking: () => Promise<boolean>;
  upcomingAppointments: AppointmentItem[];
  onCancelBooking: () => void;
  onBookingComplete: (depositInfo?: {
    isOpen: boolean;
    invoiceId: string;
    depositAmount: number;
    serviceName?: string;
    doctorName?: string;
    scheduledTime?: string;
  }) => void;
};

export function BookingModeView({
  ensureLoggedInBeforeBooking,
  upcomingAppointments,
  onCancelBooking,
  onBookingComplete,
}: BookingModeViewProps) {
  const [viewStep, setViewStep] = useState<"form" | "confirmation">("form");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDateId, setSelectedDateId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState<AppointmentPaymentOption>("DEPOSIT_30_PERCENT");

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
    selectedDateId,
    selectedTime,
  });

  const blockedBookingTimes = useMemo(() => {
    if (!selectedDateId) {
      return { times: [] as string[], ranges: [] as string[] };
    }
    return collectBlockedTimeData(
      upcomingAppointments,
      selectedDateId,
      availableTimes,
      selectedTreatmentMethod?.durationMinutes ?? 30,
    );
  }, [availableTimes, selectedDateId, selectedTreatmentMethod?.durationMinutes, upcomingAppointments]);

  const selectableAvailableTimes = useMemo(
    () => availableTimes.filter((time) => !blockedBookingTimes.times.includes(time)),
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
    selectedPaymentOption,
    ensureLoggedInBeforeBooking,
    onSelectedTimeChange: setSelectedTime,
    onSelectedDoctorChange: setSelectedDoctorId,
    onSuccess: (data) => {
      if (data.depositInvoiceId && data.depositAmount) {
        onBookingComplete({
          isOpen: true,
          invoiceId: data.depositInvoiceId,
          depositAmount: data.depositAmount,
          serviceName: selectedService?.name,
          doctorName: selectedDoctor?.name,
          scheduledTime: `${effectiveSelectedTime} ${selectedDate?.day}/${selectedDate?.month}`,
        });
      } else {
        onBookingComplete();
      }
    },
  });

  useAppointmentWorkspaceSync({
    bookingOptionsData: baseOptionsQuery.data,
    hasBookingOptionsError: baseOptionsQuery.isError,
    dates,
    doctors,
    availableTimes: selectableAvailableTimes,
    selectedDateId,
    selectedTime: effectiveSelectedTime,
    selectedDoctorId,
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
    Boolean(selectedTreatmentMethod) &&
    Boolean(selectedDoctor) &&
    Boolean(selectedDate) &&
    Boolean(effectiveSelectedTime) &&
    !disabled;

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/home" className="hover:text-slate-800 transition">
          Trang chủ
        </Link>
        <span>/</span>
        {viewStep === "confirmation" ? (
          <>
            <button
              type="button"
              onClick={() => setViewStep("form")}
              className="text-slate-600 hover:text-slate-900 hover:underline font-medium transition"
            >
              Lịch hẹn
            </button>
            <span>/</span>
            <span className="font-semibold text-[#0863c5]">Xác nhận</span>
          </>
        ) : (
          <span className="font-semibold text-slate-900">Lịch hẹn</span>
        )}
      </nav>

      {/* Header section */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          {viewStep === "confirmation" ? (
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Xác nhận thông tin & Hoàn tất đặt lịch
            </h1>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Đặt lịch hẹn mới
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Chọn dịch vụ, thời gian và bác sĩ phù hợp với bạn.
              </p>
            </>
          )}
        </div>
      </div>

      {viewStep === "form" ? (
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.7fr)_360px]">
          <BookingPanel
            services={services}
            doctors={doctors}
            dates={dates}
            times={selectableAvailableTimes}
            blockedTimes={blockedBookingTimes.times}
            blockedRanges={blockedBookingTimes.ranges}
            slotIntervalMinutes={slotIntervalMinutes}
            selectedServiceId={selectedServiceId}
            selectedMethodId={selectedMethodId}
            selectedDoctorId={selectedDoctorId}
            selectedDateId={selectedDateId}
            selectedTime={effectiveSelectedTime}
            canReview={canReview}
            isCheckingAvailability={checkingAvailability}
            onSelectService={(serviceId) => {
              setSelectedServiceId(serviceId);
              const targetService = services.find((s) => s.id === serviceId);
              if (targetService && targetService.treatmentMethods.length > 0) {
                setSelectedMethodId(targetService.treatmentMethods[0].id);
              } else {
                setSelectedMethodId("");
              }
            }}
            onSelectMethod={setSelectedMethodId}
            onSelectDoctor={setSelectedDoctorId}
            onSelectDate={setSelectedDateId}
            onSelectTime={setSelectedTime}
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
          selectedService={selectedService}
          selectedTreatmentMethod={selectedTreatmentMethod}
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          selectedTime={effectiveSelectedTime}
          selectedPaymentOption={selectedPaymentOption}
          onSelectPaymentOption={setSelectedPaymentOption}
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

  return { times, ranges };
}

function toHourMinute(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
