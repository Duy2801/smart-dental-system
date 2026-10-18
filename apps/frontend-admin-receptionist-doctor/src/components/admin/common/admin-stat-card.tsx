import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";

export type AdminStatTone = "brand" | "emerald" | "indigo" | "amber" | "rose" | "slate" | "violet" | "sky";

const tones: Record<AdminStatTone, { icon: string; value: string; bar: string }> = {
  brand: { icon: "bg-brand-light text-brand", value: "text-slate-900", bar: "bg-brand" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", value: "text-emerald-700", bar: "bg-emerald-500" },
  indigo: { icon: "bg-indigo-50 text-indigo-600", value: "text-brand-dark", bar: "bg-indigo-500" },
  amber: { icon: "bg-amber-50 text-amber-600", value: "text-amber-600", bar: "bg-amber-500" },
  rose: { icon: "bg-rose-50 text-rose-600", value: "text-rose-600", bar: "bg-rose-500" },
  slate: { icon: "bg-slate-100 text-slate-500", value: "text-slate-600", bar: "bg-slate-400" },
  violet: { icon: "bg-violet-50 text-violet-600", value: "text-violet-700", bar: "bg-violet-500" },
  sky: { icon: "bg-sky-50 text-sky-600", value: "text-sky-700", bar: "bg-sky-500" },
};

type AdminStatCardProps = {
  label: string;
  value: ReactNode;
  suffix?: string;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: AdminStatTone;
};

/** Thẻ số liệu KPI dùng chung cho các trang quản trị */
export function AdminStatCard({ label, value, suffix, hint, icon, tone = "brand" }: AdminStatCardProps) {
  const t = tones[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className={cn("absolute inset-x-0 top-0 h-1", t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className={cn("truncate text-[26px] font-extrabold leading-none tracking-tight", t.value)}>
              {value}
            </span>
            {suffix ? <span className="text-xs font-semibold text-slate-400">{suffix}</span> : null}
          </p>
        </div>
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", t.icon)}>{icon}</span>
      </div>
      {hint ? <p className="mt-2.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
