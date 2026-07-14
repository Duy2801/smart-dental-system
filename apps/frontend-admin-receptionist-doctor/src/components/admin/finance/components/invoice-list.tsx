import { SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatVND,
  invoiceStatusConfig,
  paymentLabels,
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
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="hidden items-center border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
        <div className="w-[20%]">Ma hoa don</div>
        <div className="w-[25%]">Benh nhan</div>
        <div className="w-[20%]">Trang thai</div>
        <div className="w-[20%] pr-4 text-right">Tong tien</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={6} />
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Khong tim thay hoa don nao phu hop.
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="group relative flex flex-col gap-2 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:gap-0"
            >
              <div className="flex shrink-0 flex-col sm:w-[20%]">
                <span className="font-semibold text-brand-dark">
                  {invoice.invoice_code}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(invoice.issued_at)}
                </span>
              </div>

              <div className="flex shrink-0 flex-col sm:w-[25%]">
                <span className="font-medium text-brand-dark">
                  {invoice.patient_name}
                </span>
                {invoice.payment_method ? (
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    TT: {paymentLabels[invoice.payment_method]}
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center sm:w-[20%]">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    invoiceStatusConfig[invoice.status].color,
                  )}
                >
                  {invoiceStatusConfig[invoice.status].label}
                </span>
              </div>

              <div className="flex shrink-0 sm:w-[20%] sm:justify-end sm:pr-4">
                <span className="font-mono font-medium text-brand-dark">
                  {formatVND(invoice.final_amount)}
                </span>
              </div>

              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  title="Xem chi tiet"
                  onClick={() => onSelectInvoice(invoice)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand"
                >
                  Xem
                </button>
                <div className="mx-1 h-4 w-[1px] bg-border" />
                <button
                  type="button"
                  title="In hoa don"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-dark"
                >
                  In
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
