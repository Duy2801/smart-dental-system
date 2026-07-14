type MarketingSummaryCardsProps = {
  avgReadRate: number;
  totalCampaigns: number;
  totalSent: number;
};

export function MarketingSummaryCards({
  avgReadRate,
  totalCampaigns,
  totalSent,
}: MarketingSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard
        label="Tong chien dich"
        value={String(totalCampaigns)}
        suffix="chien dich"
      />
      <SummaryCard
        label="Tong tiep can"
        value={new Intl.NumberFormat("vi-VN").format(totalSent)}
        suffix="luot gui"
      />
      <SummaryCard
        label="Ty le mo / da doc"
        value={`${avgReadRate}%`}
        suffix="trung binh"
        valueClassName="text-brand"
      />
    </div>
  );
}

function SummaryCard({
  label,
  suffix,
  value,
  valueClassName = "text-brand-dark",
}: {
  label: string;
  suffix: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`font-mono text-3xl font-bold ${valueClassName}`}>
          {value}
        </p>
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
