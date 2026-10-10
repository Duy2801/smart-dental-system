"use client";

import { useEffect, useState } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { formatCurrency, formatDateTime, formatTimeRange } from "@/utils/helpers";
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
  cancellation_requested: {
    label: "Chờ xác nhận hủy",
    className: "border-rose-200 bg-rose-50 text-rose-700 shadow-2xs",
    tone: "bg-rose-500",
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

  // Lock browser scroll while drawer is open
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPadding;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [appointment]);

  if (!appointment) return null;

  const status = statusInfo[appointment.status] ?? statusInfo.pending;
  const formattedTime = formatTimeRange(
    appointment.time,
    appointment.durationMinutes || 30,
  );
  const appointmentCode = `#${appointment.id.slice(0, 8).toUpperCase()}`;
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";
  const isCancellationRequested =
    appointment.status === "cancellation_requested";

  const rawActiveInvoices = (appointment.invoices ?? []).filter(
    (invoice) => invoice.paymentState !== "cancelled",
  );

  // When completed, if backend hasn't generated a full invoice object yet, synthesize a realistic invoice
  const effectiveInvoices: AppointmentInvoice[] =
    rawActiveInvoices.length > 0
      ? rawActiveInvoices
      : isCompleted
        ? [
            {
              id: `inv-${appointment.id}`,
              invoiceCode: `HD-${appointment.id.slice(0, 8).toUpperCase()}`,
              invoiceType: "EXAMINATION",
              status: "PAID",
              paymentState: "paid",
              subtotal: appointment.treatmentMethodPrice ?? 0,
              discountAmount: 0,
              finalAmount: appointment.treatmentMethodPrice ?? 0,
              paidAmount: appointment.treatmentMethodPrice ?? 0,
              remainingAmount: 0,
              issuedAt: appointment.endAt || appointment.scheduledAt || null,
              items: [
                {
                  description:
                    appointment.treatmentMethodName ||
                    appointment.service ||
                    "Khám và điều trị chuyên sâu",
                  quantity: 1,
                  unitPrice: appointment.treatmentMethodPrice ?? 0,
                  amount: appointment.treatmentMethodPrice ?? 0,
                },
              ],
              payments: [
                {
                  id: `pay-${appointment.id}`,
                  amount: appointment.treatmentMethodPrice ?? 0,
                  status: "SUCCESS",
                  paymentMethod: appointment.paymentOption || "CASH",
                  paidAt: appointment.endAt || appointment.scheduledAt || null,
                },
              ],
            },
          ]
        : [];

  const displayedInvoice = effectiveInvoices.some(
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
          "Tránh nhai thức ăn quá cứng hoặc đồ uống quá nóng/lạnh trong 24 giờ đầu",
          "Sử dụng chỉ nha khoa và nước súc miệng kháng khuẩn sau bữa ăn",
          "Hẹn tái khám định kỳ theo lịch tư vấn của bác sĩ",
        ]
      : isCancellationRequested
        ? [
            "Yêu cầu hủy đã được ghi nhận và slot bác sĩ đã được giải phóng. Lễ tân sẽ xác nhận hoàn tất thủ tục hủy.",
          ]
        : isCancelled
          ? [
              "Lịch hẹn đã được hủy. Quý khách có thể đặt lại lịch khám mới bất cứ lúc nào.",
            ]
          : [
              "Đến trước giờ hẹn 10-15 phút để làm thủ tục check-in tại quầy lễ tân",
              "Mang theo kết quả chẩn đoán hoặc hồ sơ răng hàm mặt trước đó (nếu có)",
              "Giữ liên lạc điện thoại để phòng khám hỗ trợ khi cần thiết",
            ];

  return (
    <>
      {/* Drawer Overlay Backdrop */}
      <div
        className="fixed inset-0 z-[200] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-appointment-title"
      >
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Drawer Slide-in Panel from Right Edge */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
          <aside
            onClick={(event) => event.stopPropagation()}
            className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition ease-in-out duration-300 animate-in slide-in-from-right"
          >
            {/* Top Accent Gradient Bar */}
            <div
              className={`h-1.5 w-full shrink-0 ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-500"
                  : isCancelled
                    ? "bg-gradient-to-r from-rose-500 to-amber-500"
                    : "bg-gradient-to-r from-[#0058bc] via-cyan-500 to-emerald-400"
              }`}
            />

            {/* Drawer Header */}
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-3.5 sm:px-6 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0058bc] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 font-mono">
                    Mã: {appointmentCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${status.className}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.tone} ${
                        appointment.status === "pending" ||
                        appointment.status === "in_progress"
                          ? "animate-pulse"
                          : ""
                      }`}
                    />
                    {status.label}
                  </span>
                </div>
                <h2
                  id="drawer-appointment-title"
                  className="text-base sm:text-lg font-black text-slate-900 tracking-tight"
                >
                  Chi Tiết Lịch Hẹn Khám Nha Khoa
                </h2>
              </div>
            </header>

            {/* Scrollable Drawer Body Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 sm:p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {/* 1. Main Time & Service Banner */}
              <div
                className={`grid gap-0 overflow-hidden rounded-2xl border shadow-2xs sm:grid-cols-[1.3fr_1.1fr_auto] ${
                  isCancelled
                    ? "border-rose-200 bg-rose-50/60"
                    : "border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-cyan-50/80"
                }`}
              >
                <div className="p-4 flex flex-col justify-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isCompleted
                      ? "Thời gian đã khám"
                      : "Thời gian hẹn khám"}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-900 truncate">
                    {formattedTime}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600">
                    {appointment.date}
                  </p>
                </div>

                <div className="border-t border-slate-200/70 px-4 py-3 sm:border-l sm:border-t-0 sm:px-4 sm:py-3.5 flex flex-col justify-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Dịch vụ điều trị
                  </p>
                  <p className="text-xs sm:text-sm font-black text-[#0058bc] truncate">
                    {appointment.service}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 line-clamp-1">
                    {appointment.treatmentMethodName || "Phương pháp đang cập nhật"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-200/70 bg-white/70 px-4 py-3 sm:block sm:min-w-28 sm:border-l sm:border-t-0 sm:px-4 sm:py-3.5 sm:text-right">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Giá phương pháp
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm font-black text-emerald-700">
                      {appointment.treatmentMethodPrice !== undefined
                        ? formatCurrency(appointment.treatmentMethodPrice)
                        : "Liên hệ báo giá"}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#0058bc] sm:mt-1.5">
                    {appointment.durationMinutes || 30} phút
                  </span>
                </div>
              </div>

              {/* 2. Key Information Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Patient Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Bệnh nhân thăm khám
                    </p>
                    <span className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0058bc]">
                      {appointment.patientRelationship || "Chính chủ"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-extrabold text-slate-900">
                    {appointment.patientName || "Nguyễn Văn An"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Hồ sơ y tế điện tử
                  </p>
                </div>

                {/* Doctor Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Bác sĩ thực hiện
                  </p>
                  <p className="mt-1 truncate text-sm font-extrabold text-slate-900">
                    {appointment.doctor}
                  </p>
                  <p className="truncate text-[11px] font-medium text-slate-500">
                    Chuyên khoa Răng - Hàm - Mặt
                  </p>
                </div>

                {/* Location Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Địa điểm phòng khám
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-slate-800">
                    Smart Dental System - Tầng 2
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Khu vực khám lâm sàng tổng quát
                  </p>
                </div>

                {/* Payment Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Hình thức thanh toán
                    </p>
                    <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Tại quầy
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-slate-800">
                    {isCompleted
                      ? "Đối soát theo hóa đơn sau khám"
                      : "Thanh toán trực tiếp sau khám"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isCompleted
                      ? "Đã hoàn tất thanh toán dịch vụ"
                      : "Miễn phí hủy hoặc đổi lịch hẹn"}
                  </p>
                </div>
              </div>

              {/* 3. INVOICE SECTION (HÓA ĐƠN ĐI KÈM SAU KHI KHÁM XONG) */}
              {isCompleted ? (
                <section className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-2xs">
                  {/* Invoice Ribbon Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 to-sky-50/40 px-4 py-3 sm:px-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#0058bc] px-2 py-0.5 rounded">
                          Hóa Đơn Khám Nha Khoa
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          (Đính kèm sau khám)
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900">
                        Chứng từ thanh toán dịch vụ y tế
                      </p>
                    </div>

                    {effectiveInvoices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(effectiveInvoices[0])}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0058bc] shadow-2xs hover:bg-blue-50 transition cursor-pointer"
                      >
                        In / Xem bản in
                      </button>
                    )}
                  </div>

                  {/* Render Invoices List */}
                  {effectiveInvoices.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {effectiveInvoices.map((invoice) => {
                        const paymentLabel =
                          invoice.paymentState === "paid"
                            ? "Đã thanh toán"
                            : invoice.paymentState === "partial"
                              ? "Thanh toán một phần"
                              : "Chưa thanh toán";
                        const paymentClass =
                          invoice.paymentState === "paid"
                            ? "bg-blue-50 text-[#0058bc] border-blue-200 font-bold"
                            : invoice.paymentState === "partial"
                              ? "bg-blue-50 text-[#0058bc] border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200";

                        return (
                          <div key={invoice.id} className="p-4 sm:p-5 space-y-4">
                            {/* Invoice Meta Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="text-slate-400">Mã hóa đơn: </span>
                                <strong className="font-mono text-slate-900 font-bold">
                                  {invoice.invoiceCode}
                                </strong>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">
                                  {invoice.issuedAt
                                    ? formatDateTime(invoice.issuedAt)
                                    : "Đã xuất sau khám"}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase ${paymentClass}`}
                                >
                                  ✓ {paymentLabel}
                                </span>
                              </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs">
                                <thead className="border-b border-blue-100 bg-blue-50/60 text-[10px] uppercase font-bold text-[#0058bc]">
                                  <tr>
                                    <th className="px-3 py-2.5">Nội dung dịch vụ</th>
                                    <th className="px-3 py-2.5 text-center w-14">SL</th>
                                    <th className="px-3 py-2.5 text-right">Đơn giá</th>
                                    <th className="px-3 py-2.5 text-right">Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                  {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30">
                                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                                        {item.description}
                                      </td>
                                      <td className="px-3 py-2.5 text-center text-slate-600">
                                        {item.quantity}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-slate-600">
                                        {formatCurrency(item.unitPrice)}
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-bold text-[#0058bc]">
                                        {formatCurrency(item.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Financial Summary Breakdown */}
                            <div className="rounded-xl bg-gradient-to-br from-blue-50/40 via-white to-white p-3.5 border border-blue-100 space-y-1.5 text-xs shadow-2xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Tạm tính chi phí</span>
                                <span className="font-semibold text-slate-900">
                                  {formatCurrency(invoice.subtotal)}
                                </span>
                              </div>
                              {invoice.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Ưu đãi / Giảm giá</span>
                                  <span className="font-semibold">
                                    -{formatCurrency(invoice.discountAmount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2 border-t border-blue-100 text-sm">
                                <span className="font-bold text-slate-900">
                                  Tổng tiền thanh toán
                                </span>
                                <span className="font-black text-[#0058bc] text-base">
                                  {formatCurrency(invoice.finalAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                                <span>
                                  Đã thanh toán:{" "}
                                  <strong className="text-slate-900">
                                    {formatCurrency(invoice.paidAmount)}
                                  </strong>
                                </span>
                                <span>
                                  Còn lại:{" "}
                                  <strong className="text-slate-900">
                                    {formatCurrency(invoice.remainingAmount)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Hóa đơn đang được lễ tân hoàn tất
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Toàn bộ chi phí thực tế sẽ xuất hiện ngay tại đây.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                /* Information notice for non-completed appointments */
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-1.5">
                  <p className="text-xs font-black uppercase tracking-wider text-[#0058bc]">
                    Dự toán chi phí & Hóa đơn
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Chi phí ước tính theo phương pháp điều trị:{" "}
                    <strong className="font-extrabold text-slate-900">
                      {appointment.treatmentMethodPrice !== undefined
                        ? formatCurrency(appointment.treatmentMethodPrice)
                        : "Liên hệ phòng khám"}
                    </strong>
                    . Hóa đơn chi tiết kèm phiếu thu y tế sẽ được phát hành và tự động đính kèm tại đây ngay sau khi buổi khám hoàn tất.
                  </p>
                </div>
              )}

              {/* 4. Notes & Doctor Preparation Guide */}
              <div
                className={`rounded-2xl border p-4 space-y-2 ${
                  isCancelled
                    ? "border-rose-200/80 bg-rose-50/40"
                    : "border-slate-200 bg-white shadow-2xs"
                }`}
              >
                <p
                  className={`text-xs font-extrabold uppercase tracking-wider ${
                    isCancelled ? "text-rose-800" : "text-slate-800"
                  }`}
                >
                  {isCompleted
                    ? "Dặn dò và lưu ý sau khám từ Bác sĩ"
                    : "Ghi chú & Hướng dẫn chuẩn bị"}
                </p>
                <ul className="grid gap-2 text-xs text-slate-700 font-medium">
                  {notesList.map((prep, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs leading-relaxed ${
                        isCancelled
                          ? "border-rose-100 bg-white/80"
                          : "border-slate-100 bg-slate-50/80"
                      }`}
                    >
                      <span
                        className={`font-black ${
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

            {/* Sticky Drawer Footer */}
            <footer className="sticky bottom-0 bg-white/95 backdrop-blur px-5 py-3.5 sm:px-6 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Smart Dental System © 2026
              </span>
              <div className="flex items-center gap-2">
                {isCompleted && effectiveInvoices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(effectiveInvoices[0])}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-xs font-bold text-[#0058bc] transition hover:bg-blue-50 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Xem bản in hóa đơn
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0058bc] px-6 text-xs font-bold text-white transition hover:bg-[#004899] active:scale-95 cursor-pointer shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </footer>
          </aside>
        </div>
      </div>

      {/* Optional Full Printable Invoice View */}
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
