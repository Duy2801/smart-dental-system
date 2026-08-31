"use client";

import Link from "next/link";
import { DashboardIcon, type DashboardIconName } from "../../common/DashboardIcon";
import { ROUTES, buildRoute } from "../../common/routes";
import type { NotificationItem, NotificationType } from "../types";

interface NotificationItemCardProps {
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTypeConfig(notification: NotificationItem): {
  icon: DashboardIconName;
  bgClass: string;
  iconClass: string;
  badgeLabel: string;
  badgeClass: string;
  actionHref?: string;
} {
  switch (notification.type) {
    case "APPOINTMENT_CONFIRMED":
      return {
        icon: "appointment",
        bgClass: "bg-blue-50 border-blue-100",
        iconClass: "text-[#0863c5]",
        badgeLabel: "Lịch hẹn",
        badgeClass: "bg-blue-100 text-[#0863c5]",
        actionHref: "/appointment",
      };
    case "APPOINTMENT_REMINDER":
      return {
        icon: "clock",
        bgClass: "bg-cyan-50 border-cyan-100",
        iconClass: "text-cyan-600",
        badgeLabel: "Nhắc lịch",
        badgeClass: "bg-cyan-100 text-cyan-700",
        actionHref: "/appointment",
      };
    case "PAYMENT_SUCCESS":
      return {
        icon: "shield",
        bgClass: "bg-emerald-50 border-emerald-100",
        iconClass: "text-emerald-600",
        badgeLabel: "Thanh toán",
        badgeClass: "bg-emerald-100 text-emerald-700",
        actionHref: "/payment",
      };
    case "PROMOTION_CAMPAIGN":
    case "MARKETING":
      const pId = notification.targetId || notification.promotionId;
      const promoTarget = pId
        ? buildRoute.promotionDetail(pId)
        : `${ROUTES.promotions}?q=${encodeURIComponent(notification.title)}`;
      return {
        icon: "sparkles",
        bgClass: "bg-amber-50 border-amber-100",
        iconClass: "text-amber-600",
        badgeLabel: "Ưu đãi",
        badgeClass: "bg-amber-100 text-amber-800",
        actionHref: promoTarget,
      };
    default:
      return {
        icon: "bell",
        bgClass: "bg-slate-50 border-slate-100",
        iconClass: "text-slate-600",
        badgeLabel: "Hệ thống",
        badgeClass: "bg-slate-100 text-slate-700",
      };
  }
}

export function NotificationItemCard({
  notification,
  onMarkAsRead,
}: NotificationItemCardProps) {
  const config = getTypeConfig(notification);
  const relativeTime = formatRelativeTime(notification.createdAt);

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
        notification.read
          ? "bg-white/80 border-slate-100 opacity-80 hover:bg-slate-50/80"
          : "bg-white border-blue-100 shadow-xs hover:border-blue-200 hover:shadow-md"
      }`}
    >
      {!notification.read && (
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#0863c5] ring-4 ring-blue-50 animate-pulse" />
      )}

      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${config.bgClass}`}
      >
        <DashboardIcon name={config.icon} className={`h-5.5 w-5.5 ${config.iconClass}`} />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}
          >
            {config.badgeLabel}
          </span>
          <span className="text-xs text-slate-400 font-medium">{relativeTime}</span>
        </div>

        <h4
          className={`text-sm font-bold leading-snug transition-colors ${
            notification.read
              ? "text-slate-700 group-hover:text-slate-900"
              : "text-slate-900 group-hover:text-[#0863c5]"
          }`}
        >
          {notification.title}
        </h4>

        <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
          {notification.content}
        </p>

        {config.actionHref && (
          <div className="mt-2.5">
            <Link
              href={config.actionHref}
              onClick={handleDetailClick}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0863c5] hover:underline"
            >
              Xem chi tiết
              <DashboardIcon name="chevron" className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
