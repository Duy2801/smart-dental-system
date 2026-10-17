"use client";

import { Tooth } from "@phosphor-icons/react";
import { AdminCard, AdminEmptyState } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { OverviewPopularService } from "../types";

type PopularServicesProps = {
  services: OverviewPopularService[];
};

const rankStyles = [
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-slate-200 text-slate-700 ring-slate-300",
  "bg-orange-100 text-orange-700 ring-orange-200",
];

export function PopularServices({ services }: PopularServicesProps) {
  return (
    <AdminCard
      title="Top dịch vụ phổ biến"
      description="Tháng này"
      icon={<Tooth size={18} weight="duotone" />}
    >
      {services.length === 0 ? (
        <AdminEmptyState icon={<Tooth size={24} weight="duotone" />} title="Chưa có dữ liệu dịch vụ" />
      ) : (
        <ul className="space-y-4">
          {services.map((service, index) => (
            <li key={service.name} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ring-1",
                  rankStyles[index] ?? "bg-brand-light text-brand ring-brand/15",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{service.name}</p>
                  <span className="shrink-0 text-xs font-bold text-slate-700">{service.percent}%</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-brand to-sky-400"
                      style={{ width: `${Math.min(service.percent, 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">{service.count} lượt</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
