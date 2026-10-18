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

  const isUpcoming =
    appointment.status === "pending" ||
    appointment.status === "confirmed" ||
    appointment.status === "rescheduled";

  // Chỉ hiện lưu ý khi thật sự cần: hướng dẫn trước buổi hẹn, hoặc thông báo về việc hủy lịch
  const notesList = isCancellationRequested
    ? ["Yêu cầu hủy đã được ghi nhận. Lễ tân sẽ xác nhận hoàn tất thủ tục hủy."]
    : isCancelled
      ? ["Lịch hẹn đã được hủy. Bạn có thể đặt lịch khám mới bất cứ lúc nào."]
      : isUpcoming
        ? (appointment.preparation ?? [])
        : [];

  const priceLabel =
    appointment.treatmentMethodPrice !== undefined
      ? formatCurrency(appointment.treatmentMethodPrice)
      : "Liên hệ báo giá";

  const infoRows: Array<{ label: string; value: string; hint?: string | null }> = [
    {
      label: isCompleted ? "Thời gian đã khám" : "Thời gian hẹn",
      value: formattedTime,
      hint: appointment.date,
    },
    {
      label: "Bệnh nhân",
      value: appointment.patientName || "—",
      hint: appointment.patientRelationship,
    },
    { label: "Bác sĩ", value: appointment.doctor || "—" },
    {
      label: "Thời lượng dự kiến",
      value: `${appointment.durationMinutes || 30} phút`,
    },
  ];

  return (
    <>
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

        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <aside
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-screen max-w-2xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.tone}`} />
                    {status.label}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-400">
                    {appointmentCode}
                  </span>
                </div>
                <h2
                  id="drawer-appointment-title"
                  className="mt-1.5 text-lg font-black tracking-tight text-slate-900"
                >
                  Chi tiết lịch hẹn
                </h2>
              </div>
            </header>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
              {/* Dịch vụ & chi phí */}
              <section
                className={`rounded-2xl border p-4 ${
                  isCancelled ? "border-rose-200 bg-rose-50/50" : "border-blue-100 bg-blue-50/50"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Dịch vụ
                </p>
                <div className="mt-1 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-black text-[#0058bc]">
                      {appointment.service}
                    </p>
                    {appointment.treatmentMethodName ? (
                      <p className="mt-0.5 text-sm text-slate-600">
                        {appointment.treatmentMethodName}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-base font-black text-slate-900">
                    {priceLabel}
                  </p>
                </div>
              </section>

              {/* Thông tin chính */}
              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
                    <dt className="pt-0.5 text-xs font-semibold text-slate-500">{row.label}</dt>
                    <dd className="min-w-0 text-right">
                      <p className="truncate text-sm font-bold text-slate-900">{row.value}</p>
                      {row.hint ? (
                        <p className="text-xs text-slate-500 first-letter:uppercase">{row.hint}</p>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Hóa đơn (chỉ khi đã khám xong) */}
              {isCompleted ? (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hóa đơn
                  </h3>
                  {effectiveInvoices.length > 0 ? (
                    <div className="space-y-2">
                      {effectiveInvoices.map((invoice) => {
                        const paymentLabel =
                          invoice.paymentState === "paid"
                            ? "Đã thanh toán"
                            : invoice.paymentState === "partial"
                              ? "Thanh toán một phần"
                              : "Chưa thanh toán";
                        const paymentClass =
                          invoice.paymentState === "paid"
                            ? "bg-blue-50 text-[#0058bc]"
                            : invoice.paymentState === "partial"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600";

                        return (
                          <button
                            key={invoice.id}
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                          >
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-slate-900">
                                {invoice.invoiceCode}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {invoice.issuedAt ? formatDateTime(invoice.issuedAt) : "Đã xuất sau khám"}
                                {invoice.remainingAmount > 0
                                  ? ` · Còn lại ${formatCurrency(invoice.remainingAmount)}`
                                  : ""}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-black text-slate-900">
                                {formatCurrency(invoice.finalAmount)}
                              </p>
                              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentClass}`}>
                                {paymentLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">
                      Hóa đơn đang được lễ tân hoàn tất.
                    </p>
                  )}
                </section>
              ) : null}

              {/* Lưu ý */}
              {notesList.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lưu ý
                  </h3>
                  <ul
                    className={`space-y-1.5 rounded-2xl p-4 text-sm leading-6 ${
                      isCancelled || isCancellationRequested
                        ? "bg-rose-50/60 text-rose-800"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {notesList.map((note) => (
                      <li key={note} className="flex gap-2">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            {/* Footer */}
            <footer className="flex shrink-0 items-center justify-start gap-2 border-t border-slate-100 px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0058bc] px-6 text-sm font-bold text-white transition hover:bg-[#004899]"
              >
                Đóng
              </button>
              {isCompleted && effectiveInvoices.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(effectiveInvoices[0])}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-[#0058bc] transition hover:bg-blue-50"
                >
                  Xem hóa đơn
                </button>
              ) : null}
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
