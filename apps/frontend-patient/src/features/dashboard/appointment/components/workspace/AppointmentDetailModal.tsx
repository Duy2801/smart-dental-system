"use client";

import { useEffect, useState } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { formatCurrency, formatTimeRange } from "@/utils/helpers";
import type { AppointmentInvoice } from "../../appointmentFinancials";
import { AppointmentInvoiceModal } from "./AppointmentInvoiceModal";

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
  const [selectedInvoice, setSelectedInvoice] =
    useState<AppointmentInvoice | null>(null);

  const handleClose = () => {
    setSelectedInvoice(null);
    onClose();
  };

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
  const activeInvoices = (appointment.invoices ?? []).filter(
    (invoice) => invoice.paymentState !== "cancelled",
  );
  const displayedInvoice = activeInvoices.some(
    (invoice) => invoice.id === selectedInvoice?.id,
  )
    ? selectedInvoice
    : null;

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
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-slate-100"
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
        <div className="px-5 py-3 sm:px-6 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
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
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shrink-0 border border-slate-200"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 p-4 sm:p-5 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Main Time & Service Banner */}
          <div
            className={`grid gap-0 overflow-hidden rounded-2xl border shadow-2xs sm:grid-cols-[1.35fr_1fr_auto] ${
              isCancelled
                ? "border-rose-200 bg-rose-50/50"
                : "border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-cyan-50/90"
            }`}
          >
            <div className="flex items-center gap-3 p-4 sm:p-5">
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

            <div className="border-t border-slate-200/70 px-4 py-3 sm:border-l sm:border-t-0 sm:px-5 sm:py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Dịch vụ điều trị
              </p>
              <p className="mt-0.5 text-sm font-black text-[#0058bc]">
                {appointment.service}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-600">
                {appointment.treatmentMethodName || "Phương pháp đang cập nhật"}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200/70 bg-white/70 px-4 py-3 sm:block sm:min-w-32 sm:border-l sm:border-t-0 sm:px-5 sm:py-4 sm:text-right">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Giá phương pháp
                </p>
                <p className="mt-0.5 text-base font-black text-emerald-700">
                {appointment.treatmentMethodPrice !== undefined
                  ? formatCurrency(appointment.treatmentMethodPrice)
                  : "Liên hệ để báo giá"}
                </p>
              </div>
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-[#0058bc] sm:mt-2">
                {appointment.durationMinutes || 30} phút
              </span>
            </div>
          </div>

          {/* Grid 1: Patient & Doctor */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Patient Card */}
            <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0058bc]">
                <DashboardIcon name="user" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Bệnh nhân thăm khám
                  </p>
                  <span className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0058bc]">
                    {appointment.patientRelationship || "Chính chủ"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm font-extrabold text-slate-900">
                  {appointment.patientName || "Nguyễn Văn An"}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Hồ sơ y tế điện tử
                </p>
              </div>
            </div>

            {/* Doctor Card */}
            <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                <DashboardIcon name="tooth" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Bác sĩ thực hiện
                </p>
                <p className="mt-0.5 truncate text-sm font-extrabold text-slate-900">
                  {appointment.doctor}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-500">
                  Chuyên khoa Răng - Hàm - Mặt
                </p>
              </div>
            </div>
          </div>

          {/* Grid 2: Location & Payment */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
                <DashboardIcon name="home" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Địa điểm phòng khám
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-800">
                  Smart Dental System - Tầng 2
                </p>
                <p className="text-[11px] text-slate-500">
                  Khu vực khám lâm sàng tổng quát
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <DashboardIcon name="document" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Hình thức thanh toán
                  </p>
                  <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Tại quầy
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-bold text-slate-800">
                  {isCompleted ? "Đối soát theo hóa đơn sau khám" : "Thanh toán trực tiếp sau khám"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isCompleted
                    ? activeInvoices.length
                      ? `${activeInvoices.length} hóa đơn được phát hành`
                      : "Đang chờ phòng khám phát hành hóa đơn"
                    : "Miễn phí hủy hoặc thay đổi lịch hẹn"}
                </p>
              </div>
            </div>
          </div>

          {isCompleted ? (
            <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-blue-50/70 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0058bc] shadow-2xs ring-1 ring-blue-100">
                    <DashboardIcon name="document" className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                    Hóa đơn & thanh toán
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Chi phí thực tế sau khi hoàn tất thăm khám
                    </p>
                  </div>
                </div>
              </div>

              {activeInvoices.length ? (
                <div className="divide-y divide-slate-100">
                  {activeInvoices.map((invoice) => {
                    const paymentLabel = invoice.paymentState === "paid"
                      ? "Đã thanh toán"
                      : invoice.paymentState === "partial"
                        ? "Thanh toán một phần"
                        : "Chưa thanh toán";
                    const paymentClass = invoice.paymentState === "paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : invoice.paymentState === "partial"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <div key={invoice.id} className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="font-mono text-xs text-slate-900">{invoice.invoiceCode}</strong>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${paymentClass}`}>
                              {paymentLabel}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-[#0058bc] px-3 text-[11px] font-bold text-white transition hover:bg-[#004899]"
                          >
                            Xem hóa đơn
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 py-2.5 text-center">
                          <div className="px-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Tổng tiền</p>
                            <strong className="mt-0.5 block text-xs text-slate-900">{formatCurrency(invoice.finalAmount)}</strong>
                          </div>
                          <div className="px-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Đã trả</p>
                            <strong className="mt-0.5 block text-xs text-emerald-700">{formatCurrency(invoice.paidAmount)}</strong>
                          </div>
                          <div className="px-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Còn lại</p>
                            <strong className="mt-0.5 block text-xs text-amber-700">{formatCurrency(invoice.remainingAmount)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Hóa đơn đang được phòng khám cập nhật</p>
                    <p className="text-[11px] text-slate-500">Thông tin thanh toán sẽ xuất hiện ngay sau khi hóa đơn được phát hành.</p>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Card 3: Notes & Instructions */}
          <div
            className={`rounded-2xl border p-3.5 space-y-1.5 ${
              isCancelled
                ? "border-rose-200/80 bg-rose-50/40"
                : "border-slate-200 bg-white shadow-2xs"
            }`}
          >
            <p
              className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                isCancelled ? "text-rose-800" : "text-slate-700"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 ${isCancelled ? "text-rose-600" : "text-[#0058bc]"}`}
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
                  className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] ${
                    isCancelled ? "border-rose-100 bg-white/80" : "border-slate-100 bg-slate-50/80"
                  }`}
                >
                  <span
                    className={`font-bold ${
                      isCancelled ? "text-rose-600" : "text-[#0058bc]"
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
            onClick={handleClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-6 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
      <AppointmentInvoiceModal
        invoice={displayedInvoice}
        patientName={appointment.patientName}
        doctorName={appointment.doctor}
        treatmentMethod={appointment.treatmentMethodName || appointment.service}
        onClose={() => setSelectedInvoice(null)}
      />
    </>
  );
}
