"use client";

import { ArrowRight, Trophy } from "@phosphor-icons/react";
import { AdminCard, AdminEmptyState } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatVndCompact } from "../report-utils";
import type { TopService } from "../types";

type TopServicesCardProps = {
  onViewAll: () => void;
  services: TopService[];
};

const rankStyles = [
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-slate-200 text-slate-700 ring-slate-300",
  "bg-orange-100 text-orange-700 ring-orange-200",
];

export function TopServicesCard({ onViewAll, services }: TopServicesCardProps) {
  const previewServices = services.slice(0, 5);
  const maxRevenue = Math.max(1, ...previewServices.map((service) => service.revenue));

  return (
    <AdminCard
      title="Top dịch vụ theo doanh thu"
      icon={<Trophy size={18} weight="duotone" />}
      bodyClassName="flex flex-col p-5"
    >
      {previewServices.length === 0 ? (
        <AdminEmptyState icon={<Trophy size={24} weight="duotone" />} title="Chưa có dữ liệu dịch vụ" />
      ) : (
        <ul className="flex flex-1 flex-col gap-3.5">
          {previewServices.map((service, index) => (
            <li key={service.name} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ring-1",
                  rankStyles[index] ?? "bg-brand-light text-brand ring-brand/15",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800" title={service.name}>
                    {service.name}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-900">
                    {formatVndCompact(service.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-brand to-sky-400"
                    style={{ width: `${(service.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onViewAll}
        disabled={services.length === 0}
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:border-brand/30 hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        Xem tất cả dịch vụ
        <ArrowRight size={14} weight="bold" />
      </button>
    </AdminCard>
  );
}
