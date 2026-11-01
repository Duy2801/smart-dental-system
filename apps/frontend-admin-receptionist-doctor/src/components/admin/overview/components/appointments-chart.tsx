"use client";

import { ChartBar } from "@phosphor-icons/react";
import { AdminCard, AdminEmptyState } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";

type DayData = {
  day: string;
  count: number;
};

type AppointmentsChartProps = {
  data: DayData[];
};

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  const maxCount = Math.max(0, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const average = data.length ? Math.round((total / data.length) * 10) / 10 : 0;

  return (
    <AdminCard
      title="Lịch hẹn 7 ngày qua"
      description={`Tổng ${total} lịch hẹn · trung bình ${average}/ngày`}
      icon={<ChartBar size={18} weight="duotone" />}
      className="h-full"
    >
      {total === 0 ? (
        <AdminEmptyState
          icon={<ChartBar size={24} weight="duotone" />}
          title="Chưa có lịch hẹn trong 7 ngày gần nhất"
          className="h-56"
        />
      ) : (
        <div className="relative h-60">
          {/* Đường lưới ngang */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="h-px w-full border-t border-dashed border-slate-100" />
            ))}
          </div>

          <div className="relative grid h-full grid-cols-7 items-end gap-2 sm:gap-4">
            {data.map((item) => {
              const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const isPeak = item.count === maxCount && maxCount > 0;

              return (
                <div key={item.day} className="group flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs font-bold transition-colors",
                      isPeak ? "bg-brand text-white" : "text-slate-600 group-hover:text-brand",
                    )}
                  >
                    {item.count}
                  </span>
                  <div className="flex h-40 w-full max-w-12 items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110",
                        isPeak
                          ? "bg-linear-to-t from-brand to-sky-400 shadow-md shadow-brand/25"
                          : "bg-linear-to-t from-brand/70 to-sky-300/80",
                      )}
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: heightPercent > 0 ? "8px" : "0",
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminCard>
  );
}
