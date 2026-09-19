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
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Đã hủy / hoàn tiền",
    className: "bg-slate-100 text-slate-600 border-slate-200",
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm print:static print:bg-white print:p-0"
      role="presentation"
      onClick={onClose}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-invoice-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl print:max-h-none print:max-w-none print:rounded-none print:shadow-none"
      >
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#0058bc] to-cyan-600 px-5 py-4 text-white sm:px-7">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-100">
              Smart Dental System
            </p>
            <h3
              id="appointment-invoice-title"
              className="mt-1 text-xl font-black"
            >
              Hóa đơn dịch vụ nha khoa
            </h3>
            <p className="mt-1 font-mono text-xs text-blue-100">
              Mã hóa đơn: {invoice.invoiceCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/15 text-lg transition hover:bg-white/25 print:hidden"
            aria-label="Đóng hóa đơn"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/60 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Bệnh nhân
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {patientName || "Bệnh nhân"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Bác sĩ thực hiện
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {doctorName}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Ngày phát hành
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {formatDateTime(invoice.issuedAt)}
              </p>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Chi tiết dịch vụ
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nội dung</th>
                    <th className="px-4 py-3 text-center">SL</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={`${item.description}-${index}`}>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_280px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-700">
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
                        className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-emerald-800">
                            {paymentMethodLabel(payment.paymentMethod)}
                          </p>
                          <p className="text-[10px] text-emerald-700">
                            {formatDateTime(payment.paidAt)}
                          </p>
                        </div>
                        <strong className="font-mono text-emerald-800">
                          {formatCurrency(payment.amount)}
                        </strong>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Chưa ghi nhận giao dịch thanh toán thành công.
                </p>
              )}
            </section>

            <section className="rounded-2xl bg-slate-900 p-4 text-white">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-white/15 pt-2 font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(invoice.finalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Còn phải trả</span>
                  <span>{formatCurrency(invoice.remainingAmount)}</span>
                </div>
              </div>
              <span
                className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold ${state.className}`}
              >
                {state.label}
              </span>
            </section>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 print:hidden sm:px-7">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            In / Lưu PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Đóng
          </button>
        </footer>
      </article>
    </div>
  );
}
