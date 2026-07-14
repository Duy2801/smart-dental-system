import { formatVND } from "../finance-utils";

type FinanceSummaryCardsProps = {
  cancelledCount: number;
  pendingCount: number;
  totalRevenue: number;
};

export function FinanceSummaryCards({
  cancelledCount,
  pendingCount,
  totalRevenue,
}: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard label="Doanh thu (Da thu)" value={formatVND(totalRevenue)} />
      <SummaryCard
        label="Hoa don cho thu"
        value={String(pendingCount)}
        suffix="hoa don"
        valueClassName="text-amber-600"
      />
      <SummaryCard
        label="Hoa don da huy"
        value={String(cancelledCount)}
        suffix="hoa don"
        valueClassName="text-gray-500"
      />
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  suffix?: string;
  valueClassName?: string;
};

function SummaryCard({
  label,
  suffix,
  value,
  valueClassName = "text-brand-dark",
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-2xl font-semibold ${valueClassName}`}>{value}</p>
        {suffix ? (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
