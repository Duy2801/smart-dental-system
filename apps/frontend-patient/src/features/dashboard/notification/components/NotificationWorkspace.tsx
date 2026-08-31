"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAppSelector } from "@/providers";
import { DashboardIcon } from "../../common/DashboardIcon";
import { LoginRequiredPanel } from "../../common/LoginRequiredPanel";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
  useUserNotificationsInfinite,
} from "../hooks/useNotificationQueries";
import type { NotificationCategoryFilter, NotificationItem } from "../types";
import { NotificationItemCard } from "./NotificationItemCard";

const filterTabs: { id: NotificationCategoryFilter; label: string; icon: string }[] = [
  { id: "ALL", label: "Tất cả", icon: "bell" },
  { id: "UNREAD", label: "Chưa đọc", icon: "sparkles" },
  { id: "APPOINTMENTS", label: "Lịch hẹn", icon: "calendarCheck" },
  { id: "PAYMENTS", label: "Thanh toán", icon: "creditCard" },
  { id: "PROMOTIONS", label: "Ưu đãi", icon: "tag" },
];

export function NotificationWorkspace() {
  const { isAuthenticated, accessToken, isHydrated } = useAppSelector((state) => state.login);
  const isLoggedIn = isAuthenticated && Boolean(accessToken);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as NotificationCategoryFilter) || "ALL";

  const handleTabChange = useCallback(
    (tabId: NotificationCategoryFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === "ALL") {
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserNotificationsInfinite(activeTab, isLoggedIn);

  const { data: unreadData } = useUnreadNotificationCount(isLoggedIn);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const allNotifications = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const unreadCount = unreadData?.unreadCount ?? data?.pages[0]?.meta?.unreadCount ?? 0;

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-blue-900 via-[#0863c5] to-cyan-700 p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Trung tâm thông báo
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-extrabold text-white shadow-xs">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-blue-100 sm:text-sm">
            Cập nhật tức thì trạng thái lịch hẹn, hóa đơn thanh toán và ưu đãi độc quyền.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <DashboardIcon name="checkup" className="h-4 w-4" />
            {markAllReadMutation.isPending ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
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
          {[1, 2, 3, 4].map((i) => (
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
      ) : allNotifications.length === 0 ? (
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
            {allNotifications.map((item: NotificationItem) => (
              <NotificationItemCard
                key={item.id}
                notification={item}
                onMarkAsRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Đang tải thêm..." : "Tải thêm thông báo"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
