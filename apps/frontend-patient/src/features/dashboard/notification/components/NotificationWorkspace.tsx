"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useAppSelector } from "@/providers";
import { DashboardIcon } from "../../common/DashboardIcon";
import { LoginRequiredPanel } from "../../common/LoginRequiredPanel";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
  useUserNotifications,
} from "../hooks/useNotificationQueries";
import type { NotificationCategoryFilter, NotificationItem } from "../types";
import { NotificationItemCard } from "./NotificationItemCard";

const ITEMS_PER_PAGE = 5;

const filterTabs: { id: NotificationCategoryFilter; label: string; icon: string }[] = [
  { id: "ALL", label: "Tất cả", icon: "bell" },
  { id: "UNREAD", label: "Chưa đọc", icon: "sparkles" },
  { id: "APPOINTMENTS", label: "Lịch hẹn", icon: "calendarCheck" },
  { id: "PAYMENTS", label: "Thanh toán", icon: "creditCard" },
  { id: "PROMOTIONS", label: "Ưu đãi", icon: "tag" },
];

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function NotificationWorkspace() {
  const { isAuthenticated, accessToken, isHydrated } = useAppSelector((state) => state.login);
  const isLoggedIn = isAuthenticated && Boolean(accessToken);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as NotificationCategoryFilter) || "ALL";
  const rawPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const handleTabChange = useCallback(
    (tabId: NotificationCategoryFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === "ALL") {
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchParams, router, pathname],
  );

  const {
    data: notificationData,
    isLoading,
    isError,
  } = useUserNotifications(activeTab, rawPage, ITEMS_PER_PAGE, isLoggedIn);

  const { data: unreadData } = useUnreadNotificationCount(isLoggedIn);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = useMemo(() => notificationData?.data ?? [], [notificationData]);
  const meta = notificationData?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? 0;
  const unreadCount = unreadData?.unreadCount ?? meta?.unreadCount ?? 0;

  // If page exceeds totalPages (e.g. after filter change or bulk read), clamp to totalPages
  useEffect(() => {
    if (meta && meta.totalPages > 0 && rawPage > meta.totalPages) {
      handlePageChange(meta.totalPages);
    }
  }, [meta, rawPage, handlePageChange]);

  // Show LoginRequiredPanel ONLY after auth hydration completes and user is confirmed unauthenticated
  if (isHydrated && !isLoggedIn) {
    return (
      <LoginRequiredPanel
        title="Xem thông báo cá nhân"
        description="Đăng nhập để xem thông báo lịch hẹn, nhắc khám, thanh toán và các cập nhật dành riêng cho tài khoản của bạn."
        loginLabel="Đăng nhập để xem thông báo"
        redirectTo="/notification"
        secondaryHref="/promotions"
        secondaryLabel="Xem ưu đãi"
        icon="bell"
      />
    );
  }

  const paginationRange = getPaginationRange(rawPage, totalPages);

  return (
    <div className="space-y-6">
      {/* Intro Header Section (Left-aligned) */}
      <section className="py-2 space-y-3">
        <div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#07366f]">
                Trung Tâm Thông Báo
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-extrabold text-white shadow-xs">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mt-1">
              Cập nhật tức thì trạng thái lịch hẹn, hóa đơn thanh toán và các thông báo quan trọng.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs font-bold text-[#0058bc] hover:bg-blue-100 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <DashboardIcon name="checkup" className="h-4 w-4" />
              {markAllReadMutation.isPending ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
            </button>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#0863c5] text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      {isLoading || !isHydrated ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 w-full animate-pulse rounded-2xl bg-slate-100 border border-slate-200/60"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center">
          <p className="text-sm font-semibold text-rose-600">
            Không thể tải danh sách thông báo. Vui lòng thử lại sau.
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
            <DashboardIcon name="bell" className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            Chưa có thông báo nào
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "UNREAD"
              ? "Bạn đã đọc tất cả thông báo! Rất tuyệt vời."
              : "Các cập nhật lịch hẹn, nhắc nhở và chương trình khuyến mãi sẽ hiển thị tại đây."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {notifications.map((item: NotificationItem) => (
              <NotificationItemCard
                key={item.id}
                notification={item}
                onMarkAsRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-xs">
              <p className="text-xs text-slate-500">
                Hiển thị trang <span className="font-bold text-slate-800">{rawPage}</span> /{" "}
                <span className="font-bold text-slate-800">{totalPages}</span> (Tổng số {totalItems} thông báo)
              </p>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => handlePageChange(rawPage - 1)}
                  disabled={rawPage <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Trước</span>
                </button>

                {paginationRange.map((pageItem, index) => {
                  if (pageItem === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }

                  const pageNumber = pageItem as number;
                  const isCurrent = pageNumber === rawPage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`h-8 min-w-[32px] px-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        isCurrent
                          ? "bg-[#0863c5] text-white shadow-sm"
                          : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(rawPage + 1)}
                  disabled={rawPage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Sau</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
