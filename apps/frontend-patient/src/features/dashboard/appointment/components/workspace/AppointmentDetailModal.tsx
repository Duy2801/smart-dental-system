"use client";

import { useEffect } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { T } from "../../../common/typography";

const statusInfo: Record<
  AppointmentStatus,
  { label: string; className: string; tone: string }
> = {
  confirmed: {
    label: "Đã xác nhận",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    tone: "bg-emerald-500",
  },
  pending: {
    label: "Chờ xác nhận",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    tone: "bg-amber-500",
  },
  completed: {
    label: "Hoàn thành",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    tone: "bg-blue-500",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    tone: "bg-rose-500",
  },
  missed: {
    label: "Vắng mặt",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    tone: "bg-slate-400",
  },
  in_progress: {
    label: "Đang khám",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    tone: "bg-cyan-500",
  },
  rescheduled: {
    label: "Đã đổi lịch",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    tone: "bg-violet-500",
  },
};

type AppointmentDetailModalProps = {
  appointment: AppointmentItem | null;
  onClose: () => void;
};

export function AppointmentDetailModal({
  appointment,
  onClose,
}: AppointmentDetailModalProps) {
  useEffect(() => {
    if (!appointment) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [appointment]);

  if (!appointment) return null;

  const status = statusInfo[appointment.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[4px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.25)] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className={`${T.fieldLabel} text-[#0a5fbe]`}>
              Chi tiết cuộc hẹn
            </span>
            <h4 className="mt-1 text-xl font-bold text-slate-900">
              {appointment.service}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4">
          {/* Status & Doctor */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Trạng thái
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${status.tone}`} />
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bác sĩ phụ trách
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 truncate">
                {appointment.doctor}
              </p>
            </div>
          </div>

          {/* Time & Date */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0a5fbe]">
                <DashboardIcon name="clock" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Thời gian
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {appointment.time} - Ngày {appointment.date}
                </p>
              </div>
            </div>
          </div>

          {/* Preparations / Notes */}
          {appointment.preparation?.length ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0a5fbe]">
                Ghi chú chuẩn bị trước khi khám
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {appointment.preparation.map((prep, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#0a5fbe] font-bold">•</span>
                    <span>{prep}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Footer Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
