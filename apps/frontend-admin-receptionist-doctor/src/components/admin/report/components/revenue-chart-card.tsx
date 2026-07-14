import { cn } from "@/src/lib/utils/cn";
import type { RevenueChartItem } from "../types";

type RevenueChartCardProps = {
  data: RevenueChartItem[];
};

export function RevenueChartCard({ data }: RevenueChartCardProps) {
  const maxChartValue = Math.max(...data.map((item) => item.value));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
      <h3 className="text-base font-semibold text-brand-dark">
        Doanh thu theo thang (Trieu VND)
      </h3>

      {total === 0 ? (
        <div className="mt-8 flex h-56 items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
          Chua co doanh thu trong khoang thoi gian nay.
        </div>
      ) : null}

      {total > 0 ? (
        <div className="mt-8 grid h-56 grid-cols-6 items-end gap-3 sm:gap-6">
          {data.map((item, index) => {
            const heightPercent =
              maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
            const isCurrent = index === data.length - 1;

            return (
              <div
                key={item.label}
                className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2"
              >
                <div className="absolute top-0 z-10 whitespace-nowrap rounded bg-brand-dark px-2 py-1 font-mono text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {item.value.toLocaleString("vi-VN")}M
                </div>
                <span className="font-mono text-xs font-semibold text-brand-dark">
                  {item.value.toLocaleString("vi-VN")}M
                </span>
                <div className="flex h-36 w-full items-end justify-center rounded-t-md bg-brand-light/40">
                  <div
                    className={cn(
                      "w-full max-w-[48px] rounded-t-md transition-all duration-500",
                      isCurrent ? "bg-brand" : "bg-brand-light hover:bg-brand/70",
                    )}
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: heightPercent > 0 ? "8px" : "0",
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isCurrent
                      ? "font-semibold text-brand-dark"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
