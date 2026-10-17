"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Star,
  UsersThree,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { formatReportValue } from "../report-utils";
import type { ReportStatCard as ReportStatCardType } from "../types";

type ReportStatCardProps = {
  stat: ReportStatCardType;
  index?: number;
};

const tones = [
  { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  { icon: "bg-brand-light text-brand", bar: "bg-brand" },
  { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
];
const icons: Icon[] = [Wallet, CalendarCheck, UsersThree, Star];

export function ReportStatCard({ stat, index = 0 }: ReportStatCardProps) {
  const isUp = stat.trend >= 0;
  const isRating = stat.type === "decimal";
  const tone = isRating ? tones[3] : tones[index % tones.length];
  const StatIcon = isRating ? Star : stat.type === "currency" ? Wallet : icons[index % icons.length];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className={cn("absolute inset-x-0 top-0 h-1", tone.bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-500">{stat.label}</p>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <StatIcon size={20} weight={isRating ? "fill" : "duotone"} />
        </span>
      </div>
      <p className="mt-1 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">
        {formatReportValue(stat.value, stat.type)}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold",
            isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
          )}
        >
          {isUp ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
          {Math.abs(stat.trend)}%
        </span>
        <span className="truncate text-slate-500">{stat.trendLabel}</span>
      </div>
    </div>
  );
}
