import { formatVND } from "../finance-utils";

type FinanceSummaryCardsProps = {
  cancelledCount: number;
  pendingCount: number;
  totalRevenue: number;
  totalInvoices?: number;
};

export function FinanceSummaryCards({
  cancelledCount,
  pendingCount,
  totalRevenue,
  totalInvoices = 0,
}: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <SummaryCard
        label="Tổng Doanh thu (Thực thu)"
        value={formatVND(totalRevenue)}
        icon="💰"
        valueClassName="text-emerald-700"
      />
      <SummaryCard
        label="Hóa đơn chờ/chưa thu xong"
        value={String(pendingCount)}
        suffix="hóa đơn"
        icon="⏳"
        valueClassName="text-amber-600"
      />
      <SummaryCard
        label="Hóa đơn đã hủy"
        value={String(cancelledCount)}
        suffix="hóa đơn"
        icon="🛑"
        valueClassName="text-slate-500"
      />
      <SummaryCard
        label="Tổng số hóa đơn"
        value={String(totalInvoices)}
        suffix="hóa đơn"
        icon="🧾"
        valueClassName="text-brand"
      />
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  icon?: string;
  suffix?: string;
  valueClassName?: string;
};

function SummaryCard({
  label,
  icon,
  suffix,
  value,
  valueClassName = "text-slate-900",
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className={`text-2xl font-extrabold font-mono ${valueClassName}`}>{value}</p>
        {suffix ? (
          <span className="text-xs font-semibold text-slate-500">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
