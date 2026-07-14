import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatVND,
  invoiceStatusConfig,
  paymentLabels,
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-brand-dark">
              Chi tiet hoa don
            </h3>
            <p className="font-mono text-sm text-muted-foreground">
              {invoice.invoice_code}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              invoiceStatusConfig[invoice.status].color,
            )}
          >
            {invoiceStatusConfig[invoice.status].label}
          </span>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="Benh nhan" value={invoice.patient_name} />
            <InfoItem label="Ngay lap" value={formatDate(invoice.issued_at)} />
            {invoice.payment_method ? (
              <InfoItem
                label="Phuong thuc"
                value={paymentLabels[invoice.payment_method]}
              />
            ) : null}
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-brand-dark">
              Dich vu dieu tri
            </h4>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex border-b border-border bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                <div className="flex-1">Ten dich vu</div>
                <div className="w-12 text-center">SL</div>
                <div className="w-24 text-right">Don gia</div>
              </div>
              <div className="divide-y divide-border">
                {invoice.items.map((item) => (
                  <div
                    key={item.service_id}
                    className="flex items-center px-4 py-3 text-sm"
                  >
                    <div className="line-clamp-2 flex-1 pr-2 font-medium text-brand-dark">
                      {item.description}
                    </div>
                    <div className="w-12 text-center text-muted-foreground">
                      {item.qty}
                    </div>
                    <div className="w-24 text-right font-mono text-brand-dark">
                      {formatVND(item.unit_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-sm">
            <AmountRow label="Tam tinh (Subtotal)" value={formatVND(invoice.subtotal)} />
            <AmountRow
              label="Giam gia (Voucher)"
              value={`-${formatVND(invoice.discount_amount)}`}
              className="text-green-600"
            />
            <AmountRow
              label="Thanh tien"
              value={formatVND(invoice.final_amount)}
              className="border-t border-dashed border-border pt-2 text-base font-semibold text-brand-dark"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
          >
            Dong
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
          >
            In hoa don
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-brand-dark">{value}</p>
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
    <div className={cn("flex justify-between text-muted-foreground", className)}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
