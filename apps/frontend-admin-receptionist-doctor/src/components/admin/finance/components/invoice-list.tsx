import { SkeletonRows } from "@/src/components/admin/common";
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
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="hidden items-center border-b border-border bg-slate-50/80 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 sm:flex">
        <div className="w-[22%]">Mã hóa đơn & Ngày lập</div>
        <div className="w-[28%]">Bệnh nhân & Bác sĩ</div>
        <div className="w-[20%]">Trạng thái thanh toán</div>
        <div className="w-[18%] pr-4 text-right">Tổng tiền & Đã thu</div>
        <div className="w-[12%] text-right">Thao tác</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={6} />
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-sm font-medium text-slate-500">
            Không tìm thấy hóa đơn nào phù hợp.
          </div>
        ) : (
          invoices.map((invoice) => {
            const statusConfig = getInvoiceStatusConfig(invoice.status);
            const paymentText = getPaymentLabel(invoice.payment_method);

            return (
              <div
                key={invoice.id}
                className="group relative flex flex-col gap-3 p-5 sm:p-6 transition-all hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-0"
              >
                {/* Code & Issued Date */}
                <div className="flex shrink-0 flex-col sm:w-[22%]">
                  <span className="font-mono text-sm font-extrabold text-slate-900 tracking-wide">
                    {invoice.invoice_code}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    📅 {formatDate(invoice.issued_at)}
                  </span>
                </div>

                {/* Patient & Doctor */}
                <div className="flex shrink-0 flex-col sm:w-[28%]">
                  <span className="text-sm font-extrabold text-slate-900 line-clamp-1">
                    👤 {invoice.patient_name}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                    {invoice.doctor_name ? `🩺 BS: ${invoice.doctor_name}` : `💳 ${paymentText}`}
                  </span>
                </div>

                {/* Status */}
                <div className="flex shrink-0 items-center sm:w-[20%]">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs shadow-2xs",
                      statusConfig.color
                    )}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex shrink-0 flex-col sm:w-[18%] sm:justify-end sm:pr-4 sm:text-right">
                  <span className="font-mono text-sm font-extrabold text-slate-900">
                    {formatVND(invoice.final_amount)}
                  </span>
                  {typeof invoice.paid_amount === "number" && invoice.paid_amount > 0 && (
                    <span className="mt-0.5 text-xs font-semibold text-emerald-600">
                      Đã thu: {formatVND(invoice.paid_amount)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 sm:w-[12%] sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectInvoice(invoice)}
                    className="flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-brand hover:text-white hover:border-brand active:scale-[0.98]"
                  >
                    👁️ Chi tiết
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
