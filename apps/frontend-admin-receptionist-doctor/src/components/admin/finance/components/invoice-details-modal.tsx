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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chi tiết hóa đơn
            </h3>
            <p className="font-mono text-sm font-semibold text-brand">
              {invoice.invoice_code}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs shadow-2xs",
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-slate-50/60 p-4 text-sm">
            <InfoItem label="Bệnh nhân" value={invoice.patient_name} />
            <InfoItem label="Ngày lập" value={formatDate(invoice.issued_at)} />
            {invoice.doctor_name && (
              <InfoItem label="Bác sĩ chỉ định" value={invoice.doctor_name} />
            )}
            <InfoItem label="Phương thức TT" value={paymentText} />
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>🏥</span> Danh sách dịch vụ điều trị
            </h4>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex border-b border-border bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">
                <div className="flex-1">Dịch vụ</div>
                <div className="w-12 text-center">SL</div>
                <div className="w-28 text-right">Đơn giá</div>
              </div>
              <div className="divide-y divide-border">
                {invoice.items.map((item, idx) => (
                  <div
                    key={item.service_id || idx}
                    className="flex items-center px-4 py-3 text-sm"
                  >
                    <div className="line-clamp-2 flex-1 pr-2 font-medium text-slate-800">
                      {item.description}
                    </div>
                    <div className="w-12 text-center font-semibold text-slate-600">
                      {item.qty}
                    </div>
                    <div className="w-28 text-right font-mono font-bold text-slate-900">
                      {formatVND(item.unit_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-border bg-slate-50/60 p-4 text-sm">
            <AmountRow label="Tạm tính (Subtotal)" value={formatVND(invoice.subtotal)} />
            <AmountRow
              label="Giảm giá Voucher"
              value={`-${formatVND(invoice.discount_amount)}`}
              className="text-emerald-600 font-semibold"
            />
            <AmountRow
              label="Tổng hóa đơn"
              value={formatVND(invoice.final_amount)}
              className="border-t border-dashed border-border pt-2 text-base font-extrabold text-slate-900"
            />
            {typeof invoice.paid_amount === "number" && (
              <AmountRow
                label="Đã thanh toán"
                value={formatVND(invoice.paid_amount)}
                className="text-emerald-600 font-bold"
              />
            )}
            {typeof invoice.remaining_amount === "number" && invoice.remaining_amount > 0 && (
              <AmountRow
                label="Còn phải trả"
                value={formatVND(invoice.remaining_amount)}
                className="text-red-600 font-bold"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-border bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 active:scale-[0.98]"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
          >
            🖨️ In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
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
      <span className="font-mono">{value}</span>
    </div>
  );
}
