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
    rescheduleCount,
  } = useRescheduleAppointment({
    appointment,
    onClose,
  });

  const blockedTimeData = useMemo(() => {
    if (!appointment || !selectedDateId) {
      return {
        times: [] as string[],
        ranges: [] as string[],
      };
    }

    const appointmentsForDate = bookedAppointments.filter(
      (item) => item.dateId === selectedDateId,
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

    const ranges = appointmentsForDate.map(
      (item) => `${toHourMinute(item.scheduledAt)} - ${toHourMinute(item.endAt)}`,
    );

    return { times, ranges };
  }, [appointment, bookedAppointments, selectedDateId, timeSlots]);

  const selectableTimeSlots = useMemo(
    () => timeSlots.filter((time) => !blockedTimeData.times.includes(time)),
    [blockedTimeData.times, timeSlots],
  );

  useEffect(() => {
    if (!selectedTime) return;
    if (!blockedTimeData.times.includes(selectedTime)) return;
    setSelectedTime(selectableTimeSlots[0] ?? "");
  }, [blockedTimeData.times, selectableTimeSlots, selectedTime, setSelectedTime]);

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[4px]">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[min(88vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,.28)]"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#f2f8ff] to-white px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a5fbe]">
                Đổi lịch hẹn
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Chọn ngày và giờ mới
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Chỉ đổi trước giờ hẹn tối thiểu 6 giờ và mỗi lịch chỉ được đổi 1 lần.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Đóng đổi lịch"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.25fr)_360px]">
          <section className="space-y-5">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,.04)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Lịch hiện tại
                  </p>
                  <h4 className="mt-2 truncate text-xl font-bold text-slate-900">
                    {appointment.service}
                  </h4>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {appointment.doctor}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3">
                  <DashboardIcon name="calendar" className="h-5 w-5 text-[#0a5fbe]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Lịch đang giữ
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {appointment.time}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <MiniInfo label="Trạng thái" value={appointment.status} />
                <MiniInfo label="Số lần đổi" value={`${rescheduleCount}/1`} />
                <MiniInfo
                  label="Ghi chú"
                  value={
                    appointment.preparation?.length
                      ? `${appointment.preparation.length} mục`
                      : "Không có"
                  }
                />
              </div>
            </article>

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
          </section>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a5fbe]">
                    Quy định đổi lịch
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-slate-900">
                    Lưu ý trước khi xác nhận
                  </h4>
                </div>
                <span className="rounded-full bg-[#0a5fbe] px-3 py-1 text-[10px] font-bold text-white">
                  2 điều kiện
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <RuleItem
                  title="Trước 6 giờ"
                  text="Chỉ đổi lịch khi còn đủ tối thiểu 6 giờ trước giờ hẹn."
                />
                <RuleItem
                  title="Tối đa 1 lần"
                  text="Mỗi cuộc hẹn chỉ được đổi lịch 1 lần để tránh thay đổi quá nhiều."
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a5fbe]">
                Xác nhận thay đổi
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Hệ thống sẽ giải phóng khung giờ cũ và giữ chỗ ở khung giờ mới ngay sau khi bạn xác nhận.
              </p>
              {!canReschedule ? (
                <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Lịch này đã hết quyền đổi lịch online.
                </p>
              ) : null}
            </section>
          </aside>
        </div>

        <div className="border-t border-slate-200/80 bg-white px-6 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Chọn ngày mới từ lịch, rồi chọn khung giờ còn trống.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!canReschedule || !selectedDateId || !selectedTime || isSubmitting}
                onClick={confirmReschedule}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0758b7] px-6 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#064b9c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <DashboardIcon name="appointment" className="h-4 w-4" />
                )}
                {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi lịch"}
              </button>
            </div>
          </div>
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

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function RuleItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,.03)]">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
