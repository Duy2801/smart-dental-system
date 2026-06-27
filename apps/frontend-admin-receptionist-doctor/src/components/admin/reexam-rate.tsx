import { reexamRate } from "@/src/components/admin/mock-data";

export function ReexamRate() {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">Tỷ lệ tái khám</h3>
      <p className="mt-1 text-sm text-muted-foreground">6 tháng gần nhất</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold text-brand-dark">{reexamRate.rate}%</span>
        <span className="mb-1 text-sm font-medium text-emerald-600">+{reexamRate.change}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand" style={{ width: `${reexamRate.rate}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        68% bệnh nhân quay lại khám trong vòng 6 tháng.
      </p>
    </div>
  );
}
