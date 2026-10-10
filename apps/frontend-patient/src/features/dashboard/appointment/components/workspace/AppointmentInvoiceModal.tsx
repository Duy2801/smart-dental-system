"use client";

import { useEffect } from "react";
import { formatCurrency, formatDateTime } from "@/utils/helpers";
import type { AppointmentInvoice } from "../../appointmentFinancials";

type AppointmentInvoiceModalProps = {
  invoice: AppointmentInvoice | null;
  patientName?: string | null;
  doctorName: string;
  treatmentMethod: string;
  onClose: () => void;
};

const paymentStateInfo = {
  unpaid: {
    label: "Chưa thanh toán",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  partial: {
    label: "Thanh toán một phần",
    className: "bg-blue-50 text-[#0058bc] border-blue-200",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-blue-50 text-[#0058bc] border-blue-200 font-bold",
  },
  cancelled: {
    label: "Đã hủy / hoàn tiền",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

function paymentMethodLabel(method?: string | null) {
  const labels: Record<string, string> = {
    CASH: "Tiền mặt",
    CARD: "Thẻ",
    BANK_TRANSFER: "Chuyển khoản",
    E_WALLET: "Ví điện tử",
    ONLINE_GATEWAY: "Cổng thanh toán trực tuyến",
  };
  return method ? (labels[method] ?? method) : "Chưa cập nhật";
}

export function AppointmentInvoiceModal({
  invoice,
  patientName,
  doctorName,
  treatmentMethod,
  onClose,
}: AppointmentInvoiceModalProps) {
  useEffect(() => {
    if (!invoice) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [invoice, onClose]);

  if (!invoice) return null;
  const state = paymentStateInfo[invoice.paymentState];
  const items = invoice.items.length
    ? invoice.items
    : [
        {
          description: treatmentMethod,
          quantity: 1,
          unitPrice: invoice.subtotal,
          amount: invoice.subtotal,
        },
      ];

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs print:static print:bg-white print:p-0"
      role="presentation"
      onClick={onClose}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-invoice-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:max-h-none print:max-w-none print:rounded-none print:shadow-none"
      >
        {/* Brand Blue Invoice Header */}
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#0058bc] to-[#0863c5] px-6 py-4.5 text-white sm:px-7">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-100">
              Smart Dental System
            </p>
            <h3
              id="appointment-invoice-title"
              className="mt-0.5 text-lg sm:text-xl font-black text-white"
            >
              Hóa đơn dịch vụ nha khoa
            </h3>
            <p className="mt-1 font-mono text-xs text-blue-100/90">
              Mã hóa đơn:{" "}
              <span className="font-bold text-white bg-white/15 px-2 py-0.5 rounded">
                {invoice.invoiceCode}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition print:hidden text-xs cursor-pointer border border-white/20"
            aria-label="Đóng hóa đơn"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 sm:p-7 space-y-4">
          {/* Top 3 Info Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100/80 bg-white p-3.5 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Bệnh nhân
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {patientName || "Bệnh nhân"}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100/80 bg-white p-3.5 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Bác sĩ thực hiện
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {doctorName}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100/80 bg-white p-3.5 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Ngày phát hành
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatDateTime(invoice.issuedAt)}
              </p>
            </div>
          </div>

          {/* Service Items Table */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="border-b border-blue-100 bg-blue-50/60 px-4 py-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#0058bc]">
                Chi tiết dịch vụ
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Nội dung</th>
                    <th className="px-4 py-2.5 text-center w-16">SL</th>
                    <th className="px-4 py-2.5 text-right">Đơn giá</th>
                    <th className="px-4 py-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {items.map((item, index) => (
                    <tr key={`${item.description}-${index}`} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0058bc]">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom Grid: Payment History & Blue Accent Summary Card */}
          <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
            {/* Payment History */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Lịch sử thanh toán
              </h4>
              {invoice.payments.filter(
                (payment) => payment.status === "SUCCESS",
              ).length ? (
                <ul className="mt-3 space-y-2">
                  {invoice.payments
                    .filter((payment) => payment.status === "SUCCESS")
                    .map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/40 px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {paymentMethodLabel(payment.paymentMethod)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDateTime(payment.paidAt)}
                          </p>
                        </div>
                        <strong className="font-bold text-[#0058bc]">
                          {formatCurrency(payment.amount)}
                        </strong>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-400">
                  Chưa ghi nhận giao dịch thanh toán thành công.
                </p>
              )}
            </section>

            {/* Summary Card with Primary Blue Accent */}
            <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/40 via-white to-white p-4 space-y-2 shadow-2xs">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính</span>
                  <span className="font-medium text-slate-800">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá</span>
                    <span className="font-semibold">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-blue-100 pt-2 text-sm font-bold text-slate-900">
                  <span>Tổng cộng</span>
                  <span className="font-black text-[#0058bc] text-base">{formatCurrency(invoice.finalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Đã thanh toán</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Còn phải trả</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(invoice.remainingAmount)}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-blue-100/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Trạng thái</span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] ${state.className}`}
                >
                  ✓ {state.label}
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 print:hidden sm:px-7">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-[#0058bc] hover:bg-blue-50 transition cursor-pointer shadow-2xs"
          >
            In / Lưu PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0058bc] px-5 py-2 text-xs font-bold text-white hover:bg-[#004899] transition cursor-pointer shadow-sm"
          >
            Đóng
          </button>
        </footer>
      </article>
    </div>
  );
}
