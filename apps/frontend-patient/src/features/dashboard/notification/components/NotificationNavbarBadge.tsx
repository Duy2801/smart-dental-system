"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/providers";
import { DashboardIcon } from "../../common/DashboardIcon";
import { ROUTES } from "../../common/routes";
import { fetchUserNotifications } from "../api";
import {
  notificationQueryKeys,
  useMarkNotificationRead,
  useUnreadNotificationCount,
  useUserNotifications,
} from "../hooks/useNotificationQueries";
import type { NotificationItem } from "../types";

export function NotificationNavbarBadge() {
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.login);
  const isLoggedIn = isAuthenticated && Boolean(accessToken);
  const { data: countData } = useUnreadNotificationCount(isLoggedIn);
  const unreadCount = countData?.unreadCount ?? 0;

  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const { data: previewData, isLoading } = useUserNotifications("ALL", 1, isLoggedIn && isOpen);
  const markReadMutation = useMarkNotificationRead();

  const handleMouseEnter = useCallback(() => {
    if (!isLoggedIn) return;
    hoverTimerRef.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: notificationQueryKeys.list("ALL", 1),
        queryFn: () => fetchUserNotifications({ page: 1, limit: 5 }),
        staleTime: 30 * 1000,
      });
    }, 100);
  }, [isLoggedIn, queryClient]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
  }, []);

  const notifications = previewData?.data?.slice(0, 5) ?? [];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ""}`}
        className="relative grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#0863c5] focus:outline-hidden"
      >
        <DashboardIcon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && isLoggedIn && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Thông báo mới</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-600">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
              <Link
                href={ROUTES.notification}
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-[#0863c5] hover:underline"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Đang tải...</div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Không có thông báo nào
                </div>
              ) : (
                notifications.map((item: NotificationItem) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) markReadMutation.mutate(item.id);
                    }}
                    className={`group relative flex flex-col gap-1 rounded-xl p-2.5 text-xs transition cursor-pointer ${
                      item.read
                        ? "bg-slate-50/50 hover:bg-slate-100/80 text-slate-600"
                        : "bg-blue-50/60 hover:bg-blue-100/60 text-slate-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate text-slate-900">{item.title}</span>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-[#0863c5] shrink-0" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-slate-500 text-[11px] leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2 text-center">
              <Link
                href={ROUTES.notification}
                onClick={() => setIsOpen(false)}
                className="inline-block w-full rounded-xl bg-slate-50 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Mở trung tâm thông báo
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
