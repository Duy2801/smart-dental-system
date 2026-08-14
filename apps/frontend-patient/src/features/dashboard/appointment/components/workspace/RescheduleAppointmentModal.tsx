"use client";

import { useEffect, useMemo } from "react";
import type { AppointmentItem } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { SchedulePicker } from "../booking/SchedulePicker";
import { useRescheduleAppointment } from "../../hooks/useRescheduleAppointment";

type RescheduleAppointmentModalProps = {
  appointment: AppointmentItem | null;
  bookedAppointments?: AppointmentItem[];
  onClose: () => void;
};

export function RescheduleAppointmentModal({
  appointment,
  bookedAppointments = [],
  onClose,
}: RescheduleAppointmentModalProps) {
  const {
    dates,
    timeSlots,
    slotIntervalMinutes,
    selectedDateId,
    selectedTime,
    setSelectedDateId,
    setSelectedTime,
    confirmReschedule,
    isSubmitting,
    canReschedule,
  } = useRescheduleAppointment({
    appointment,
    onClose,
  });

  // Lock background body & documentElement scroll completely so scrollbar hides & locks
  useEffect(() => {
    if (!appointment) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.setProperty("overflow", "hidden", "important");
    document.documentElement.style.setProperty("overflow", "hidden", "important");

    return () => {
      if (previousBodyOverflow) {
        document.body.style.overflow = previousBodyOverflow;
      } else {
        document.body.style.removeProperty("overflow");
      }
      if (previousHtmlOverflow) {
        document.documentElement.style.overflow = previousHtmlOverflow;
      } else {
        document.documentElement.style.removeProperty("overflow");
      }
    };
  }, [appointment]);

  const blockedTimeData = useMemo(() => {
    if (!appointment || !selectedDateId) {
      return {
        times: [] as string[],
        ranges: [] as string[],
      };
    }

    // Exclude the current appointment being rescheduled so it doesn't block itself
    const appointmentsForDate = bookedAppointments.filter(
      (item) => item.dateId === selectedDateId && item.id !== appointment.id,
    );
    const times = timeSlots.filter((time) => {
      const slotStart = new Date(`${selectedDateId}T${time}:00`);
      const slotEnd = new Date(
        slotStart.getTime() + appointment.durationMinutes * 60 * 1000,
      );

      return appointmentsForDate.some((item) => {
        const bookedStart = new Date(item.scheduledAt);
        const bookedEnd = new Date(item.endAt);
        return bookedStart < slotEnd && bookedEnd > slotStart;
      });
    });

    const ranges = Array.from(
      new Set(
        appointmentsForDate.map(
          (item) => `${toHourMinute(item.scheduledAt)} - ${toHourMinute(item.endAt)}`,
        )
      )
    );

    return { times, ranges };
  }, [appointment, bookedAppointments, selectedDateId, timeSlots]);

  const selectableTimeSlots = useMemo(
    () => timeSlots.filter((time) => !blockedTimeData.times.includes(time)),
    [blockedTimeData.times, timeSlots],
  );

  if (!appointment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Đổi Lịch Hẹn</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn ngày và giờ mới cho cuộc hẹn khám nha khoa của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center font-bold text-sm"
            aria-label="Đóng đổi lịch"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Fits neatly without inner scrollbar */}
        <div className="p-6 space-y-4">
          {/* Current Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 text-xs gap-2">
            <div className="min-w-0">
              <span className="font-extrabold text-slate-800">{appointment.service}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-slate-600 font-medium">{appointment.doctor}</span>
            </div>
            <div className="font-bold text-[#0058bc] shrink-0">
              Lịch hiện tại: {appointment.time} - {appointment.date}
            </div>
          </div>

          {!canReschedule && (
            <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-700">
              Lịch hẹn này đã hết lượt cho phép đổi hoặc không đủ điều kiện đổi lịch online.
            </p>
          )}

          {/* Schedule Picker */}
          <SchedulePicker
            dates={dates}
            times={selectableTimeSlots}
            blockedTimes={blockedTimeData.times}
            blockedRanges={blockedTimeData.ranges}
            slotIntervalMinutes={slotIntervalMinutes}
            selectedDateId={selectedDateId}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDateId}
            onSelectTime={setSelectedTime}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!canReschedule || !selectedDateId || !selectedTime || isSubmitting}
            onClick={confirmReschedule}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0058bc] text-xs font-bold text-white shadow-sm hover:bg-[#004899] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <DashboardIcon name="appointment" className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function toHourMinute(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
