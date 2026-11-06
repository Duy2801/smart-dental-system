"use client";

import { useEffect, useState } from "react";
import { toast } from "@/features/dashboard/common/toast";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { SchedulePicker } from "@/features/dashboard/appointment/components/booking/SchedulePicker";
import {
  useRescheduleConsultationMutation,
  useRescheduleConsultationSlotsQuery,
} from "../hooks/useConsultationQueries";
import {
  CONSULTATION_RESCHEDULE_NOTICE_HOURS,
  buildRescheduleDates,
  getApiErrorMessage,
  getConsultationRescheduleBlocker,
  ictDateTime,
  isRescheduleTimeAllowed,
  toIctDateKey,
} from "../reschedulePolicy";
import type { PatientConsultationItem } from "../types";

type RescheduleConsultationModalProps = {
  consultation: PatientConsultationItem | null;
  onClose: () => void;
};

const formatTime = (value: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

export function RescheduleConsultationModal({
  consultation,
  onClose,
}: RescheduleConsultationModalProps) {
  if (!consultation) return null;
  return (
    <RescheduleConsultationDialog
      key={consultation.id}
      consultation={consultation}
      onClose={onClose}
    />
  );
}

function RescheduleConsultationDialog({
  consultation,
  onClose,
}: {
  consultation: PatientConsultationItem;
  onClose: () => void;
}) {
  const [dates] = useState(() => buildRescheduleDates());
  const [selectedDateId, setSelectedDateId] = useState(() => {
    const currentKey = toIctDateKey(new Date(consultation.scheduledAt));
    return dates.some((d) => d.id === currentKey) ? currentKey : dates[0]?.id ?? "";
  });
  const [pickedTime, setSelectedTime] = useState("");
  const mutation = useRescheduleConsultationMutation();

  // Khoá cuộn nền khi mở modal (giống modal đổi lịch khám)
  useEffect(() => {
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.setProperty("overflow", "hidden", "important");
    document.documentElement.style.setProperty("overflow", "hidden", "important");
    return () => {
      if (previousBody) document.body.style.overflow = previousBody;
      else document.body.style.removeProperty("overflow");
      if (previousHtml) document.documentElement.style.overflow = previousHtml;
      else document.documentElement.style.removeProperty("overflow");
    };
  }, []);

  const { data: rawSlots = [], isLoading } = useRescheduleConsultationSlotsQuery(
    consultation,
    selectedDateId,
  );

  const currentStart = new Date(consultation.scheduledAt);
  const currentTimeKey =
    selectedDateId === toIctDateKey(currentStart) ? formatTime(currentStart) : "";

  // Giờ mới phải cách hiện tại >= 6 tiếng và khác giờ đang hẹn
  const slots = rawSlots.filter(
    (slot) =>
      slot !== currentTimeKey &&
      isRescheduleTimeAllowed(ictDateTime(selectedDateId, slot)),
  );
  const selectedTime = slots.includes(pickedTime) ? pickedTime : "";

  const blocker = getConsultationRescheduleBlocker(consultation);
  const canSubmit = !blocker && Boolean(selectedDateId && selectedTime) && !mutation.isPending;
  const currentEnd = new Date(
    currentStart.getTime() + (consultation.durationMinutes || 30) * 60 * 1000,
  );

  async function handleConfirm() {
    if (!canSubmit) return;
    try {
      await mutation.mutateAsync({
        id: consultation.id,
        scheduledAt: ictDateTime(selectedDateId, selectedTime).toISOString(),
      });
      toast.success(
        "Đổi lịch tư vấn thành công",
        "Khung giờ cũ đã được giải phóng và lịch mới đã được giữ chỗ.",
      );
      onClose();
    } catch (error) {
      toast.error(
        "Không thể đổi lịch tư vấn",
        getApiErrorMessage(error, "Vui lòng thử lại hoặc chọn khung giờ khác."),
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-consultation-title"
        onClick={(event) => event.stopPropagation()}
        className="my-auto flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <div>
            <h3 id="reschedule-consultation-title" className="text-base font-extrabold text-slate-900">
              Đổi Lịch Tư Vấn
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn ngày và giờ mới cho buổi tư vấn trực tuyến của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng đổi lịch tư vấn"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-1.5 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-2.5 text-xs sm:flex-row sm:items-center">
            <div className="min-w-0">
              <span className="font-extrabold text-slate-800">
                Tư vấn {consultation.durationMinutes} phút
              </span>
              <span className="mx-1.5 text-slate-400">•</span>
              <span className="font-medium text-slate-600">
                {consultation.doctorName || "Bác sĩ"}
              </span>
            </div>
            <div className="shrink-0 font-bold text-[#0058bc]">
              Lịch hiện tại: {formatTime(currentStart)} - {formatTime(currentEnd)} · {formatDate(currentStart)}
            </div>
          </div>

          {blocker ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-700">
              {blocker}
            </p>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-medium text-slate-600">
              Mỗi buổi tư vấn chỉ được đổi lịch <strong>1 lần</strong>, giữ nguyên bác sĩ và thời lượng.
              Giờ mới phải cách hiện tại ít nhất {CONSULTATION_RESCHEDULE_NOTICE_HOURS} tiếng.
            </p>
          )}

          {isLoading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <SchedulePicker
              dates={dates}
              times={slots}
              slotIntervalMinutes={15}
              selectedDateId={selectedDateId}
              selectedTime={selectedTime}
              onSelectDate={(id) => {
                setSelectedDateId(id);
                setSelectedTime("");
              }}
              onSelectTime={setSelectedTime}
            />
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0058bc] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004899] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <DashboardIcon name="appointment" className="h-3.5 w-3.5" />
            )}
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận đổi lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}
