import type { OverviewReexamRate } from "../types";

type ReexamRateProps = {
  data: OverviewReexamRate;
};

export function ReexamRate({ data }: ReexamRateProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">Ty le tai kham</h3>
      <p className="mt-1 text-sm text-muted-foreground">6 thang gan nhat</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold text-brand-dark">
          {data.rate}%
        </span>
        <span className="mb-1 text-sm font-medium text-emerald-600">
          {data.change >= 0 ? "+" : ""}
          {data.change}%
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${Math.min(data.rate, 100)}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {data.rate}% benh nhan quay lai kham trong vong 6 thang.
      </p>
    </div>
  );
}
