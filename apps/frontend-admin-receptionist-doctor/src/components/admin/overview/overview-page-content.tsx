"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SkeletonCardGrid, SkeletonChart, SkeletonRows } from "@/src/components/admin/common";
import { Header } from "@/src/components/layout/header";
import { queryKeys } from "@/src/lib/query/query-keys";
import { cn } from "@/src/lib/utils/cn";
import { AppointmentsChart } from "./components/appointments-chart";
import { PopularServices } from "./components/popular-services";
import { ReexamRate } from "./components/reexam-rate";
import { getOverviewDashboard } from "./overview-api";
import type {
  OverviewAppointment,
  OverviewDashboard,
  OverviewStatCard,
} from "./types";

const statusConfig: Record<
  OverviewAppointment["status"],
  { label: string; color: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  CHECKED_IN: {
    label: "Đã Check-in",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  IN_PROGRESS: {
    label: "Đang khám",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  NO_SHOW: {
    label: "Không đến",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  RESCHEDULED: {
    label: "Dời lịch",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

export function OverviewPageContent() {
  const {
    data: dashboard,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.overview,
    queryFn: getOverviewDashboard,
  });

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Header title="Tổng quan quản lý" description={currentDate} />

      <div className="space-y-6 p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-6">
            <SkeletonCardGrid count={5} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SkeletonChart />
              </div>
              <div className="rounded-2xl border border-border bg-white shadow-xs">
                <div className="border-b border-border p-5">
                  <SkeletonRows count={1} />
                </div>
                <SkeletonRows count={3} />
              </div>
            </div>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Không tải được dữ liệu tổng quan phòng khám.
          </div>
        ) : null}

        {!isLoading && dashboard ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {dashboard.statCards.map((stat) => (
                <OverviewStat key={stat.label} stat={stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AppointmentsChart data={dashboard.appointmentsLast7Days} />
              </div>
              <ActionItems items={dashboard.actionItems} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PopularServices services={dashboard.popularServices} />
              <ReexamRate data={dashboard.reexamRate} />
            </div>

            <TodaySchedule appointments={dashboard.todayAppointments} />
          </>
        ) : null}
      </div>
    </>
  );
}

function OverviewStat({ stat }: { stat: OverviewStatCard }) {
  const isPositive = stat.trend >= 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <p className="font-mono text-3xl font-bold text-brand-dark">
          {formatStatValue(stat)}
        </p>
        <span
          className={cn(
            "text-base font-bold",
            stat.isStar ? "text-amber-500" : "text-muted-foreground",
          )}
        >
          {stat.suffix}
        </span>
      </div>
      <div className="mt-3 flex items-center text-xs">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-bold",
            isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
          )}
        >
          {isPositive ? "+" : ""}
          {stat.trend}%
        </span>
        <span className="ml-2 text-muted-foreground font-medium">{stat.trendLabel}</span>
      </div>
    </div>
  );
}

function ActionItems({
  items,
}: {
  items: OverviewDashboard["actionItems"];
}) {
  return (
    <div className="flex max-h-[400px] flex-col rounded-2xl border border-border bg-white shadow-xs">
      <div className="shrink-0 border-b border-border p-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-brand-dark">
          Thông tin cần theo dõi
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-extrabold text-brand">
            {items.length}
          </span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="p-4 text-sm font-medium text-muted-foreground">
              Chưa có thông tin cần theo dõi.
            </div>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="line-clamp-1 text-sm font-bold text-brand-dark">
                  {item.title}
                </h4>
                <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                  {formatRelativeTime(item.time)}
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground font-medium">
                {item.desc}
              </p>
              <div className="mt-1 flex justify-end">
                <Link
                  href={item.href}
                  className="rounded-xl bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  {item.action}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TodaySchedule({
  appointments,
}: {
  appointments: OverviewAppointment[];
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h3 className="text-base font-bold text-brand-dark">
          Lịch trình hôm nay
        </h3>
        <Link
          href="/admin/schedules"
          className="text-xs font-bold text-brand hover:underline"
        >
          Xem tất cả lịch
        </Link>
      </div>
      <div className="flex-1 p-5">
        {appointments.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm font-medium text-muted-foreground text-center">
            Hôm nay chưa có lịch hẹn nào.
          </div>
        ) : null}
        <div className="relative ml-3 space-y-6 border-l-2 border-slate-100 pb-2 md:ml-4">
          {appointments.map((item) => (
            <div key={item.id} className="group relative pl-6 sm:pl-8">
              <span className="absolute -left-[5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand ring-4 ring-white" />
              <div className="flex flex-col gap-3 rounded-2xl border border-transparent p-4 transition-colors hover:border-border hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-sm font-bold text-brand">
                    {item.start_time} - {item.end_time}
                  </span>
                  <span className="text-base font-bold text-brand-dark">
                    {item.patient_name}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.service_name}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-xs font-bold text-brand">{item.doctor_name}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                      statusConfig[item.status].color,
                    )}
                  >
                    {statusConfig[item.status].label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatStatValue(stat: OverviewStatCard) {
  if (stat.type === "currency") {
    return new Intl.NumberFormat("vi-VN").format(stat.value);
  }

  if (stat.type === "decimal") {
    return stat.value.toFixed(1);
  }

  return new Intl.NumberFormat("vi-VN").format(stat.value);
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  return `${Math.round(diffHours / 24)} ngày trước`;
}
