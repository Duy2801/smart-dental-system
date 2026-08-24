"use client";

import { useEffect } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { formatTimeRange } from "@/utils/helpers";

const statusInfo: Record<
  AppointmentStatus,
  { label: string; className: string; tone: string }
> = {
  confirmed: {
    label: "Đã xác nhận",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs",
    tone: "bg-emerald-500",
  },
  pending: {
    label: "Chờ xác nhận",
    className: "border-amber-200 bg-amber-50 text-amber-700 shadow-2xs",
    tone: "bg-amber-500",
  },
  completed: {
    label: "Hoàn thành",
    className: "border-blue-200 bg-blue-50 text-blue-700 shadow-2xs",
    tone: "bg-blue-500",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-rose-200 bg-rose-50 text-rose-700 shadow-2xs",
    tone: "bg-rose-500",
  },
  missed: {
    label: "Vắng mặt",
    className: "border-slate-200 bg-slate-100 text-slate-600 shadow-2xs",
    tone: "bg-slate-400",
  },
  in_progress: {
    label: "Đang khám",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700 shadow-2xs",
    tone: "bg-cyan-500",
  },
  rescheduled: {
    label: "Đã đổi lịch",
    className: "border-violet-200 bg-violet-50 text-violet-700 shadow-2xs",
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
  // Lock browser scroll on open
  useEffect(() => {
    if (!appointment) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPadding = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPadding;
    };
  }, [appointment]);

  if (!appointment) return null;

  const status = statusInfo[appointment.status] ?? statusInfo.pending;
  const formattedTime = formatTimeRange(appointment.time, appointment.durationMinutes || 30);
  const appointmentCode = `#${appointment.id.slice(0, 8).toUpperCase()}`;
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";

  // Unified notes list (prep notes for upcoming, doctor instructions for completed/cancelled)
  const notesList = appointment.preparation?.length
    ? appointment.preparation
    : isCompleted
    ? [
        "Vệ sinh răng miệng 2 lần/ngày với kem đánh răng chứa fluoride",
        "Sử dụng chỉ nha khoa sau bữa ăn",
        "Hẹn tái khám định kỳ theo lịch tư vấn của bác sĩ",
      ]
    : isCancelled
    ? ["Lịch hẹn đã được hủy. Quý khách có thể đặt lại lịch khám mới bất cứ lúc nào."]
    : ["Đến trước giờ hẹn 10-15 phút để làm thủ tục check-in tại quầy"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-slate-100"
      >
        {/* Top Banner Decorator */}
        <div
          className={`h-1.5 w-full shrink-0 ${
            isCompleted
              ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400"
              : isCancelled
              ? "bg-gradient-to-r from-rose-500 to-amber-500"
              : "bg-gradient-to-r from-[#0058bc] via-cyan-500 to-emerald-400"
          }`}
        />

        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0058bc] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                Mã: {appointmentCode}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${status.className}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${status.tone} ${
                    appointment.status === "pending" ? "animate-pulse" : ""
                  }`}
                />
                {status.label}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Chi Tiết Lịch Hẹn Khám Nha Khoa
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shrink-0 border border-slate-200"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Main Time & Service Banner */}
          <div
            className={`rounded-2xl border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCancelled
                ? "border-rose-200 bg-rose-50/50"
                : "border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-cyan-50/90"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-xs border ${
                  isCancelled ? "text-rose-600 border-rose-100" : "text-[#0058bc] border-blue-100"
                }`}
              >
                <DashboardIcon name="clock" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isCompleted ? "Thời gian đã thăm khám" : "Thời gian hẹn khám"}
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900">
                  {formattedTime} <span className="text-slate-400 font-normal">|</span> {appointment.date}
                </p>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Dịch vụ điều trị
              </p>
              <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                <p className="text-sm font-black text-[#0058bc]">
                  {appointment.service}
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-[#0058bc] border border-blue-200 shadow-2xs">
                  {appointment.durationMinutes || 30} phút
                </span>
              </div>
            </div>
          </div>

          {/* Grid 1: Patient & Doctor */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Patient Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Bệnh nhân thăm khám
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-[#0058bc]">
                  {appointment.patientRelationship || "Chính chủ"}
                </span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {appointment.patientName || "Nguyễn Văn An"}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Mã sơ hồ y tế điện tử
              </p>
            </div>

            {/* Doctor Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Bác sĩ thực hiện
              </p>
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {appointment.doctor}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Chuyên khoa Răng - Hàm - Mặt
              </p>
            </div>
          </div>

          {/* Grid 2: Location & Payment */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Địa điểm phòng khám
              </p>
              <p className="text-xs font-bold text-slate-800">
                Smart Dental System - Tầng 2
              </p>
              <p className="text-[11px] text-slate-500">
                Khu vực khám lâm sàng tổng quát
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Hình thức thanh toán
                </p>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  Tại quầy
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                Thanh toán trực tiếp sau khám
              </p>
              <p className="text-[11px] text-slate-500">
                Miễn phí hủy hoặc thay đổi lịch hẹn
              </p>
            </div>
          </div>

          {/* Card 3: Notes & Instructions */}
          <div
            className={`rounded-2xl border p-3.5 space-y-1.5 ${
              isCancelled
                ? "border-rose-200/80 bg-rose-50/40"
                : "border-emerald-200/80 bg-emerald-50/40"
            }`}
          >
            <p
              className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                isCancelled ? "text-rose-800" : "text-emerald-800"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 ${isCancelled ? "text-rose-600" : "text-emerald-600"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Ghi chú & Dặn dò từ Bác sĩ
            </p>
            <ul className="grid sm:grid-cols-2 gap-1.5 text-xs text-slate-700 font-medium">
              {notesList.map((prep, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-2 bg-white/80 p-2 rounded-lg border text-[11px] ${
                    isCancelled ? "border-rose-100" : "border-emerald-100"
                  }`}
                >
                  <span
                    className={`font-bold ${
                      isCancelled ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    •
                  </span>
                  <span>{prep}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <span className="text-xs text-slate-400 font-medium">
            Smart Dental System © 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-6 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
