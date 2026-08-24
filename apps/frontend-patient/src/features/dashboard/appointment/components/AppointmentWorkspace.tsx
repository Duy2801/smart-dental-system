"use client";

import { useCallback, useState } from "react";
import { useAppSelector } from "@/providers";
import { useBookingAuthGuard } from "../hooks/useBookingAuthGuard";
import { usePatientAppointments } from "../hooks/usePatientAppointments";
import { useCancelAppointment } from "../hooks/useCancelAppointment";
import { LoginRequiredPanel } from "../../common/LoginRequiredPanel";
import { BookingModeView } from "./booking/BookingModeView";
import { ManageModeView } from "./workspace/ManageModeView";
import { RescheduleAppointmentModal } from "./workspace/RescheduleAppointmentModal";
import type { AppointmentItem } from "../api";

export function AppointmentWorkspace({
  initialMode = "booking",
  dedicatedDoctorId = "",
}: {
  initialMode?: "manage" | "booking";
  dedicatedDoctorId?: string;
}) {
  const { isAuthenticated, accessToken } = useAppSelector(
    (state) => state.login,
  );
  const isLoggedIn = isAuthenticated && Boolean(accessToken);

  const [mode, setMode] = useState<"manage" | "booking">(initialMode);
  const [reschedulingAppointment, setReschedulingAppointment] =
    useState<AppointmentItem | null>(null);
  const { ensureLoggedInBeforeBooking } = useBookingAuthGuard({ isLoggedIn });
  const { upcoming, historyItems, appointments, patientAppointmentsQuery } =
    usePatientAppointments(isLoggedIn);
  const { cancelAppointment, cancellingAppointmentId } = useCancelAppointment();

  const openBookingMode = useCallback(async () => {
    const canBook = await ensureLoggedInBeforeBooking();
    if (!canBook) return;
    setMode("booking");
  }, [ensureLoggedInBeforeBooking]);

  if (!isLoggedIn) {
    return (
      <LoginRequiredPanel
        title="Đặt lịch khám nha khoa"
        description="Đăng nhập để chọn người khám, dịch vụ, bác sĩ và khung giờ phù hợp. Tài khoản giúp phòng khám lưu đúng hồ sơ bệnh nhân và gửi thông báo lịch hẹn cho bạn."
        loginLabel="Đăng nhập để đặt lịch"
        redirectTo={
          dedicatedDoctorId
            ? `/appointment?intent=booking&doctorId=${encodeURIComponent(dedicatedDoctorId)}`
            : "/appointment"
        }
        secondaryHref="/service"
        secondaryLabel="Xem dịch vụ"
        icon="calendar"
      />
    );
  }

  if (mode === "booking") {
    return (
      <BookingModeView
        key={dedicatedDoctorId || "general-booking"}
        dedicatedDoctorId={dedicatedDoctorId}
        isLoggedIn={isLoggedIn}
        ensureLoggedInBeforeBooking={ensureLoggedInBeforeBooking}
        upcomingAppointments={upcoming}
        onCancelBooking={() => setMode("manage")}
        onBookingComplete={() => {
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
