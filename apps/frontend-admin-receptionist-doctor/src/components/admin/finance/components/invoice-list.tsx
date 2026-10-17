"use client";

import { CalendarBlank, CreditCard, Eye, Receipt, Stethoscope } from "@phosphor-icons/react";
import { AdminEmptyState, SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatVND,
  getInvoiceStatusConfig,
  getPaymentLabel,
} from "../finance-utils";
import type { Invoice } from "../types";

type InvoiceListProps = {
  invoices: Invoice[];
  loading?: boolean;
  onSelectInvoice: (invoice: Invoice) => void;
};

export function InvoiceList({
  invoices,
  loading = false,
  onSelectInvoice,
}: InvoiceListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="hidden items-center border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:flex">
        <div className="w-[22%]">Hóa đơn</div>
        <div className="w-[28%]">Bệnh nhân & bác sĩ</div>
        <div className="w-[20%]">Trạng thái</div>
        <div className="w-[18%] pr-4 text-right">Tổng tiền</div>
        <div className="w-[12%] text-right">Thao tác</div>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <SkeletonRows count={6} />
        ) : invoices.length === 0 ? (
          <AdminEmptyState
            icon={<Receipt size={24} weight="duotone" />}
            title="Không tìm thấy hóa đơn nào phù hợp"
            description="Thử đổi từ khóa, trạng thái hoặc khoảng thời gian."
          />
        ) : (
          invoices.map((invoice) => {
            const statusConfig = getInvoiceStatusConfig(invoice.status);
            const paymentText = getPaymentLabel(invoice.payment_method);

            return (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:gap-0 sm:px-6"
              >
                <div className="flex flex-col sm:w-[22%]">
                  <span className="font-mono text-sm font-extrabold tracking-wide text-slate-900">
                    {invoice.invoice_code}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <CalendarBlank size={12} />
                    {formatDate(invoice.issued_at)}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col sm:w-[28%] sm:pr-4">
                  <span className="line-clamp-1 text-sm font-bold text-slate-900">{invoice.patient_name}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                    {invoice.doctor_name ? <Stethoscope size={12} /> : <CreditCard size={12} />}
                    <span className="line-clamp-1">
                      {invoice.doctor_name ? `BS. ${invoice.doctor_name}` : paymentText}
                    </span>
                  </span>
                </div>

                <div className="flex items-center sm:w-[20%]">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs",
                      statusConfig.color,
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex flex-col sm:w-[18%] sm:pr-4 sm:text-right">
                  <span className="text-sm font-extrabold text-slate-900">{formatVND(invoice.final_amount)}</span>
                  {typeof invoice.paid_amount === "number" && invoice.paid_amount > 0 ? (
                    <span className="mt-0.5 text-xs font-semibold text-emerald-600">
                      Đã thu {formatVND(invoice.paid_amount)}
                    </span>
                  ) : null}
                </div>

                <div className="flex sm:w-[12%] sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectInvoice(invoice)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-brand hover:bg-brand hover:text-white active:scale-[0.98]"
                  >
                    <Eye size={14} weight="bold" />
                    Chi tiết
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
