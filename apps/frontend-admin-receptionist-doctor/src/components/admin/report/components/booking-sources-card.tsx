"use client";

import { Globe, Robot, Storefront, UsersThree } from "@phosphor-icons/react";
import { AdminCard } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { BookingSources } from "../types";

type BookingSourcesCardProps = {
  sources: BookingSources;
};

export function BookingSourcesCard({ sources }: BookingSourcesCardProps) {
  const sourceItems = [
    {
      label: "Đặt qua Web/App",
      color: "bg-brand",
      soft: "bg-brand-light text-brand",
      icon: Globe,
      value: sources.online,
    },
    {
      label: "Đến trực tiếp",
      color: "bg-orange-400",
      soft: "bg-orange-50 text-orange-600",
      icon: Storefront,
      value: sources.walkIn,
    },
    {
      label: "AI Chatbot gợi ý",
      color: "bg-violet-500",
      soft: "bg-violet-50 text-violet-600",
      icon: Robot,
      value: sources.aiChatbot,
    },
  ];

  return (
    <AdminCard
      title="Nguồn khách hàng"
      description={`Tổng ${sources.total} lịch hẹn`}
      icon={<UsersThree size={18} weight="duotone" />}
    >
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {sourceItems.map((item) => (
          <div
            key={item.label}
            className={cn(item.color, "transition-all first:rounded-l-full last:rounded-r-full")}
            style={{ width: `${item.value.percentage}%` }}
            title={`${item.label}: ${item.value.percentage}%`}
          />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {sourceItems.map((item) => {
          const SourceIcon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", item.soft)}>
                <SourceIcon size={20} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-500">{item.label}</p>
                <p className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900">{item.value.percentage}%</span>
                  <span className="text-xs text-slate-500">{item.value.count} ca</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}
