import { cn } from "@/src/lib/utils/cn";
import { formatReportValue } from "../report-utils";
import type { ReportStatCard as ReportStatCardType } from "../types";

type ReportStatCardProps = {
  stat: ReportStatCardType;
};

export function ReportStatCard({ stat }: ReportStatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-mono text-2xl font-semibold text-brand-dark">
          {formatReportValue(stat.value, stat.type)}
          {stat.type === "decimal" ? (
            <span className="ml-1 text-base text-yellow-500">*</span>
          ) : null}
        </p>
      </div>
      <div className="mt-2 flex items-center text-xs">
        <span
          className={cn(
            "flex items-center font-medium",
            stat.trend >= 0 ? "text-green-600" : "text-red-600",
          )}
        >
          {stat.trend >= 0 ? "+" : "-"}
          {Math.abs(stat.trend)}%
        </span>
        <span className="ml-1.5 text-muted-foreground">{stat.trendLabel}</span>
      </div>
    </div>
  );
}
