"use client";

import { ArrowDownRight, ArrowUpRight, ArrowsClockwise } from "@phosphor-icons/react";
import { AdminCard } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { OverviewReexamRate } from "../types";

type ReexamRateProps = {
  data: OverviewReexamRate;
};

export function ReexamRate({ data }: ReexamRateProps) {
  const isUp = data.change >= 0;
  const rate = Math.min(Math.max(data.rate, 0), 100);

  return (
    <AdminCard
      title="Tỷ lệ tái khám"
      description="6 tháng gần nhất"
      icon={<ArrowsClockwise size={18} weight="duotone" />}
    >
      <div className="flex items-end gap-3">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900">{data.rate}%</span>
        <span
          className={cn(
            "mb-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
            isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
          )}
        >
          {isUp ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
          {isUp ? "+" : ""}
          {data.change}%
        </span>
      </div>
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-linear-to-r from-brand to-emerald-400 transition-all"
          style={{ width: `${rate}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400">
        <span>0%</span>
        <span>100%</span>
      </div>
      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
        <strong className="font-bold text-slate-800">{data.rate}%</strong> bệnh nhân quay lại khám trong vòng 6 tháng.
      </p>
    </AdminCard>
  );
}
