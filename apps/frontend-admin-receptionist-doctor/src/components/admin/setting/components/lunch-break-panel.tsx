import { cn } from "@/src/lib/utils/cn";
import type { LunchBreak } from "../types";

type LunchBreakPanelProps = {
  lunchBreak: LunchBreak;
  onChange: (
    field: keyof LunchBreak,
    value: string | boolean,
  ) => void;
};

export function LunchBreakPanel({
  lunchBreak,
  onChange,
}: LunchBreakPanelProps) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-brand-dark">
            Giờ nghỉ trưa của phòng khám
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Áp dụng cho tất cả bác sĩ, dịch vụ và hình thức đặt lịch.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={lunchBreak.isEnabled}
          aria-label="Bật hoặc tắt giờ nghỉ trưa"
          onClick={() => onChange("isEnabled", !lunchBreak.isEnabled)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
            lunchBreak.isEnabled ? "bg-brand" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform",
              lunchBreak.isEnabled ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-semibold text-slate-700">
          <span>Từ</span>
          <input
            type="time"
            value={lunchBreak.start}
            disabled={!lunchBreak.isEnabled}
            onChange={(event) => onChange("start", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-slate-700">
          <span>Đến</span>
          <input
            type="time"
            value={lunchBreak.end}
            disabled={!lunchBreak.isEnabled}
            onChange={(event) => onChange("end", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>
      </div>
    </section>
  );
}
