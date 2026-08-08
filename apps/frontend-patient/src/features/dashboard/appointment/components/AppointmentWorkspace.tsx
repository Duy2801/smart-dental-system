"use client";

import { useCallback, useState } from "react";
import { useAppSelector } from "@/providers";
import { useBookingAuthGuard } from "../hooks/useBookingAuthGuard";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { useCancelAppointment } from "../hooks/useCancelAppointment";
import { BookingModeView } from "./booking/BookingModeView";
import { ManageModeView } from "./workspace/ManageModeView";
import { RescheduleAppointmentModal } from "./workspace/RescheduleAppointmentModal";
import { DepositPaymentModal } from "./booking/DepositPaymentModal";
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
  const [reschedulingAppointment, setReschedulingAppointment] =
    useState<AppointmentItem | null>(null);
  const [depositModalState, setDepositModalState] = useState<{
    isOpen: boolean;
    invoiceId: string;
    depositAmount: number;
    serviceName?: string;
    doctorName?: string;
    scheduledTime?: string;
  } | null>(null);

  const { ensureLoggedInBeforeBooking } = useBookingAuthGuard({ isLoggedIn });
  const { upcoming, historyItems, appointments, patientAppointmentsQuery } =
    usePatientAppointments(isLoggedIn);
  const { cancelAppointment, cancellingAppointmentId } =
    useCancelAppointment();

  const openBookingMode = useCallback(async () => {
    const canBook = await ensureLoggedInBeforeBooking();
    if (!canBook) return;
    setMode("booking");
  }, [ensureLoggedInBeforeBooking]);

  if (mode === "booking") {
    return (
      <BookingModeView
        isLoggedIn={isLoggedIn}
        ensureLoggedInBeforeBooking={ensureLoggedInBeforeBooking}
        upcomingAppointments={upcoming}
        onCancelBooking={() => setMode("manage")}
        onBookingComplete={(depositInfo) => {
          if (depositInfo) {
            setDepositModalState(depositInfo);
          }
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
        historyItems={historyItems}
        loading={patientAppointmentsQuery.isLoading}
        onOpenBooking={openBookingMode}
        onReschedule={setReschedulingAppointment}
        onCancelAppointment={cancelAppointment}
        onPayDeposit={(appointment) => {
          if (appointment.depositInvoiceId && appointment.depositAmount) {
            setDepositModalState({
              isOpen: true,
              invoiceId: appointment.depositInvoiceId,
              depositAmount: appointment.depositAmount,
              serviceName: appointment.service,
              doctorName: appointment.doctor,
              scheduledTime: `${appointment.time} ${appointment.date}`,
            });
          }
        }}
        cancellingAppointmentId={cancellingAppointmentId}
      />
      {reschedulingAppointment ? (
        <RescheduleAppointmentModal
          appointment={reschedulingAppointment}
          bookedAppointments={upcoming}
          onClose={() => setReschedulingAppointment(null)}
        />
      ) : null}
      {depositModalState?.isOpen ? (
        <DepositPaymentModal
          isOpen={depositModalState.isOpen}
          invoiceId={depositModalState.invoiceId}
          depositAmount={depositModalState.depositAmount}
          serviceName={depositModalState.serviceName}
          doctorName={depositModalState.doctorName}
          scheduledTime={depositModalState.scheduledTime}
          onClose={() => setDepositModalState(null)}
          onSuccess={() => {
            setDepositModalState(null);
            setMode("manage");
          }}
        />
      ) : null}
    </>
  );
}
