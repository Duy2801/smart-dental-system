import type { CSSProperties } from "react";
import { cn } from "@/src/lib/utils/cn";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80",
        className,
      )}
      style={style}
    />
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border bg-white p-5 shadow-sm"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-8 w-24" />
          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-3 h-4 w-32" />
      <div className="mt-10 flex h-48 items-end gap-4">
        {[35, 58, 44, 72, 52, 86, 64].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-3">
            <Skeleton
              className="w-full rounded-t-lg"
              style={{ height: `${height}%` }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRows({
  count = 5,
  hasAvatar = false,
}: {
  count?: number;
  hasAvatar?: boolean;
}) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-5">
          {hasAvatar ? <Skeleton className="h-10 w-10 rounded-full" /> : null}
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
          <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSettings() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="space-y-8 rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
