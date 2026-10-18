"use client";

import { useEffect, useState, useTransition } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { ArrowsCounterClockwise, CheckCircle, Clock } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

export function DataRefreshControl() {
  const queryClient = useQueryClient();
  const isFetchingCount = useIsFetching();
  const [isPending, startTransition] = useTransition();

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Initialize time on client mount to avoid SSR hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // Auto-refresh all active queries every 15 minutes (900,000 ms)
  useEffect(() => {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const interval = setInterval(() => {
      startTransition(async () => {
        await queryClient.invalidateQueries();
        setLastUpdated(new Date());
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
      setLastUpdated(new Date());
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2500);
    } finally {
      // Ensure smooth visual rotation feedback (minimum 650ms)
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 650);
    }
  };

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <div className="flex items-center gap-2">
      {/* Auto-sync indicator badge */}
      <div
        className="hidden xl:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs"
        title="Dữ liệu được lưu cache để tải trang tức thì và tự động đồng bộ lại mỗi 15 phút"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Clock size={12} className="text-slate-400" />
        <span>Tự động cập nhật mỗi 15p</span>
      </div>

      {/* Manual refresh button with live timestamp */}
      <div className="flex items-center rounded-xl border border-border bg-white p-1 shadow-2xs">
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isBusy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all",
            "hover:bg-slate-100 hover:text-brand focus:outline-none focus:ring-1 focus:ring-brand/30",
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

        <span className="hidden md:inline-block border-l border-slate-200 mx-1.5 h-3.5" />

        <span
          className="hidden md:inline-flex items-center gap-1 px-1.5 text-[11px] font-medium text-slate-500"
          title={`Thời gian cập nhật gần nhất: ${formattedTime}`}
        >
          {justRefreshed ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold animate-pulse">
              <CheckCircle size={12} weight="bold" />
              Vừa xong
            </span>
          ) : (
            <>
              <span className="text-slate-400">Cập nhật:</span>
              <span className="font-mono font-semibold text-slate-600">{formattedTime}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
