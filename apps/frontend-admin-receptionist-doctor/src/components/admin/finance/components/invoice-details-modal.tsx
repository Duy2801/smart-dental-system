"use client";

import { Printer, Receipt } from "@phosphor-icons/react";
import { AdminButton, AdminModal } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatVND,
  getInvoiceStatusConfig,
  getPaymentLabel,
} from "../finance-utils";
import type { Invoice } from "../types";

type InvoiceDetailsModalProps = {
  invoice: Invoice;
  onClose: () => void;
};

export function InvoiceDetailsModal({
  invoice,
  onClose,
}: InvoiceDetailsModalProps) {
  const statusConfig = getInvoiceStatusConfig(invoice.status);
  const paymentText = getPaymentLabel(invoice.payment_method);

  return (
    <AdminModal
      title="Chi tiết hóa đơn"
      description={<span className="font-mono font-semibold text-brand">{invoice.invoice_code}</span>}
      icon={<Receipt size={20} weight="duotone" />}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose}>
            Đóng
          </AdminButton>
          <AdminButton onClick={() => window.print()}>
            <Printer size={16} weight="bold" />
            In hóa đơn
          </AdminButton>
        </>
      }
    >
      <div id="print-area" className="mt-4 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</span>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs", statusConfig.color)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
          <InfoItem label="Bệnh nhân" value={invoice.patient_name} />
          <InfoItem label="Ngày lập" value={formatDate(invoice.issued_at)} />
          {invoice.doctor_name ? <InfoItem label="Bác sĩ chỉ định" value={invoice.doctor_name} /> : null}
          <InfoItem label="Phương thức thanh toán" value={paymentText} />
        </div>

        <div>
          <h4 className="mb-2.5 text-sm font-bold text-slate-900">Dịch vụ điều trị</h4>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex-1">Dịch vụ</div>
              <div className="w-12 text-center">SL</div>
              <div className="w-28 text-right">Đơn giá</div>
            </div>
            <div className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <div key={item.service_id || idx} className="flex items-center px-4 py-3 text-sm">
                  <div className="line-clamp-2 flex-1 pr-2 font-medium text-slate-800">{item.description}</div>
                  <div className="w-12 text-center font-semibold text-slate-600">{item.qty}</div>
                  <div className="w-28 text-right font-bold text-slate-900">{formatVND(item.unit_price)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
          <AmountRow label="Tạm tính" value={formatVND(invoice.subtotal)} />
          <AmountRow
            label="Giảm giá voucher"
            value={`-${formatVND(invoice.discount_amount)}`}
            className="font-semibold text-emerald-600"
          />
          <AmountRow
            label="Tổng hóa đơn"
            value={formatVND(invoice.final_amount)}
            className="border-t border-dashed border-slate-300 pt-2.5 text-base font-extrabold text-slate-900"
          />
          {typeof invoice.paid_amount === "number" ? (
            <AmountRow label="Đã thanh toán" value={formatVND(invoice.paid_amount)} className="font-bold text-emerald-600" />
          ) : null}
          {typeof invoice.remaining_amount === "number" && invoice.remaining_amount > 0 ? (
            <AmountRow label="Còn phải trả" value={formatVND(invoice.remaining_amount)} className="font-bold text-red-600" />
          ) : null}
        </div>
      </div>
    </AdminModal>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="truncate font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AmountRow({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("flex justify-between text-slate-600", className)}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
