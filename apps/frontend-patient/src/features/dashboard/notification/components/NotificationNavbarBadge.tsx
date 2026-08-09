"use client";

import Link from "next/link";
import { ROUTES } from "../../common/routes";
import { DashboardIcon } from "../../common/DashboardIcon";
import { useUnreadNotificationCount } from "../hooks/useNotificationQueries";

export function NotificationNavbarBadge() {
  const { data } = useUnreadNotificationCount();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Link
      href={ROUTES.notification}
      aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ""}`}
      className="relative grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#0863c5]"
    >
      <DashboardIcon name="bell" className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
