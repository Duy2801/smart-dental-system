type BannerSummaryCardsProps = {
  activeBanners: number;
  inactiveBanners: number;
  totalBanners: number;
};

export function MarketingSummaryCards({
  activeBanners,
  inactiveBanners,
  totalBanners,
}: BannerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard
        icon={
          <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        label="Tổng số Banner"
        value={String(totalBanners)}
        suffix="banner"
      />
      <SummaryCard
        icon={
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        label="Đang hiển thị"
        value={String(activeBanners)}
        suffix="banner hoạt động"
        valueClassName="text-emerald-600"
      />
      <SummaryCard
        icon={
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.05 10.05 0 012.122-.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
          </svg>
        }
        label="Đã tạm ẩn"
        value={String(inactiveBanners)}
        suffix="banner tạm ẩn"
        valueClassName="text-amber-600"
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  suffix,
  value,
  valueClassName = "text-brand-dark",
}: {
  icon: React.ReactNode;
  label: string;
  suffix: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className={`font-mono text-3xl font-bold tracking-tight ${valueClassName}`}>
          {value}
        </p>
        <span className="text-xs font-medium text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
