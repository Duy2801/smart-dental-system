"use client";

import { ChartLineUp } from "@phosphor-icons/react";
import { AdminCard, AdminEmptyState } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { RevenueChartItem } from "../types";

type RevenueChartCardProps = {
  data: RevenueChartItem[];
};

export function RevenueChartCard({ data }: RevenueChartCardProps) {
  const maxChartValue = Math.max(0, ...data.map((item) => item.value));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminCard
      title="Doanh thu theo tháng"
      description={`Đơn vị: triệu VNĐ · tổng ${total.toLocaleString("vi-VN")} triệu`}
      icon={<ChartLineUp size={18} weight="duotone" />}
      className="lg:col-span-2"
    >
      {total === 0 ? (
        <AdminEmptyState
          icon={<ChartLineUp size={24} weight="duotone" />}
          title="Chưa có doanh thu trong khoảng thời gian này"
          className="h-60"
        />
      ) : (
        <div className="relative h-64">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-7 bottom-8 flex flex-col justify-between">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="h-px w-full border-t border-dashed border-slate-100" />
            ))}
          </div>
          <div className="relative grid h-full grid-cols-6 items-end gap-3 sm:gap-6">
            {data.map((item, index) => {
              const heightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
              const isCurrent = index === data.length - 1;

              return (
                <div key={item.label} className="group flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs font-bold",
                      isCurrent ? "bg-brand text-white" : "text-slate-600",
                    )}
                  >
                    {item.value.toLocaleString("vi-VN")}
                  </span>
                  <div className="flex h-40 w-full items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-12 rounded-t-lg transition-all duration-500 group-hover:brightness-110",
                        isCurrent
                          ? "bg-linear-to-t from-brand to-sky-400 shadow-md shadow-brand/25"
                          : "bg-linear-to-t from-sky-200 to-sky-100",
                      )}
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: heightPercent > 0 ? "8px" : "0",
                      }}
                    />
                  </div>
                  <span className={cn("text-xs", isCurrent ? "font-bold text-slate-900" : "text-slate-500")}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminCard>
  );
}
