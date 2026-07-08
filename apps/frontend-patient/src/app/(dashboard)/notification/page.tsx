"use client";

import { useState } from "react";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";

const notifications = [
  {
    id: 1,
    title: "Lịch hẹn đã được xác nhận",
    description: "Cuộc hẹn vệ sinh răng ngày 24/07/2026 lúc 09:30 đã được phòng khám xác nhận.",
    time: "5 phút trước",
    icon: "appointment" as const,
    unread: true,
  },
  {
    id: 2,
    title: "Nhắc chuẩn bị trước khám",
    description: "Vui lòng mang theo hồ sơ điều trị và vệ sinh răng miệng trước khi đến phòng khám.",
    time: "1 giờ trước",
    icon: "bell" as const,
    unread: true,
  },
  {
    id: 3,
    title: "Thanh toán thành công",
    description: "Hóa đơn INV-2024-089 đã được thanh toán và lưu vào lịch sử giao dịch.",
    time: "Hôm qua",
    icon: "shield" as const,
    unread: false,
  },
];

export default function NotificationPage() {
  const [readIds, setReadIds] = useState<number[]>([]);

  const visibleNotifications = notifications.map((notification) => ({
    ...notification,
    unread: notification.unread && !readIds.includes(notification.id),
  }));
  const unreadCount = visibleNotifications.filter((notification) => notification.unread).length;

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#0863c5]">Trung tâm thông báo</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-900">Thông báo của bạn</h1>
          <p className="mt-2 text-sm text-slate-500">Theo dõi lịch hẹn, thanh toán và nhắc nhở chăm sóc răng miệng.</p>
        </div>

        <button
          type="button"
          onClick={() => setReadIds(notifications.map((notification) => notification.id))}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-xs font-bold text-[#0863c5] shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        >
          <DashboardIcon name="checkup" className="h-4 w-4" />
          Đánh dấu đã đọc
        </button>
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Mới nhất</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-[#0863c5]">
            {unreadCount} chưa đọc
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {visibleNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => setReadIds((ids) => [...new Set([...ids, notification.id])])}
              className="flex w-full gap-4 px-5 py-5 text-left transition hover:bg-blue-50/40"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0863c5]">
                <DashboardIcon name={notification.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-slate-900">{notification.title}</span>
                  {notification.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{notification.description}</span>
                <span className="mt-2 block text-[10px] font-semibold text-slate-400">{notification.time}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
