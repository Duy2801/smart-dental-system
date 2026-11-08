"use client";

import { useEffect, useState, useTransition } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { ArrowsCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

export function DataRefreshControl() {
  const queryClient = useQueryClient();
  const isFetchingCount = useIsFetching();
  const [isPending, startTransition] = useTransition();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Auto-refresh all active queries every 15 minutes (900,000 ms) in background
  useEffect(() => {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const interval = setInterval(() => {
      startTransition(async () => {
        await queryClient.invalidateQueries();
      });
    }, FIFTEEN_MINUTES_MS);

    return () => clearInterval(interval);
  }, [queryClient]);

  const isBusy = isManualRefreshing || isFetchingCount > 0 || isPending;

  const handleManualRefresh = async () => {
    if (isBusy) return;
    setIsManualRefreshing(true);
    setJustRefreshed(false);

    try {
      await queryClient.invalidateQueries();
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2500);
    } finally {
      // Ensure smooth visual rotation feedback (minimum 650ms)
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 650);
    }
  };

  return (
    <button
      type="button"
      onClick={handleManualRefresh}
      disabled={isBusy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all",
        "hover:bg-slate-50 hover:text-brand focus:outline-none focus:ring-1 focus:ring-brand/30",
        "disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
        isBusy && "text-brand bg-brand/5"
      )}
      title="Nhấn để làm mới toàn bộ dữ liệu ngay lập tức"
      aria-label="Làm mới dữ liệu"
    >
      <ArrowsCounterClockwise
        size={14}
        weight="bold"
        className={cn("transition-transform", isBusy && "animate-spin text-brand")}
      />
      <span className="hidden sm:inline">
        {isBusy ? "Đang đồng bộ..." : justRefreshed ? "Đã cập nhật" : "Làm mới"}
      </span>
    </button>
  );
}
