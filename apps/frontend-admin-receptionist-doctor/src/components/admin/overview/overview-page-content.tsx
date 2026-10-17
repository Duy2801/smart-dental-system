"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRinging,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Clock,
  Star,
  Stethoscope,
  Tooth,
  UserPlus,
  UsersThree,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import {
  AdminAlert,
  AdminCard,
  AdminEmptyState,
  SkeletonCardGrid,
  SkeletonChart,
  SkeletonRows,
} from "@/src/components/admin/common";
import { Header } from "@/src/components/layout/header";
import { queryKeys } from "@/src/lib/query/query-keys";
import { cn } from "@/src/lib/utils/cn";
import { AppointmentsChart } from "./components/appointments-chart";
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
  CANCELLATION_REQUESTED: {
    label: "Chờ xác nhận hủy",
    color: "bg-rose-100 text-rose-700 border-rose-200",
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

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
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
          <AdminAlert message="Không tải được dữ liệu tổng quan phòng khám." />
        ) : null}

        {!isLoading && dashboard ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {dashboard.statCards.map((stat, index) => (
                <OverviewStat key={stat.label} stat={stat} index={index} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AppointmentsChart data={dashboard.appointmentsLast7Days} />
              </div>
              <ActionItems items={dashboard.actionItems} />
            </div>

            <TodaySchedule appointments={dashboard.todayAppointments} />
          </>
        ) : null}
      </div>
    </>
  );
}

const statTones = [
  { icon: "bg-brand-light text-brand", bar: "bg-brand" },
  { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  { icon: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
];

const statIcons: Icon[] = [CalendarCheck, UsersThree, UserPlus, Tooth, Stethoscope];

function OverviewStat({ stat, index }: { stat: OverviewStatCard; index: number }) {
  const isPositive = stat.trend >= 0;
  const tone = stat.isStar ? statTones[4] : statTones[index % statTones.length];
  const StatIcon = stat.isStar ? Star : stat.type === "currency" ? Wallet : statIcons[index % statIcons.length];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className={cn("absolute inset-x-0 top-0 h-1", tone.bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-500">{stat.label}</p>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <StatIcon size={20} weight={stat.isStar ? "fill" : "duotone"} />
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <p className="text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
          {formatStatValue(stat)}
        </p>
        <span className={cn("text-sm font-bold", stat.isStar ? "text-amber-500" : "text-slate-400")}>
          {stat.suffix}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold",
            isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
          )}
        >
          {isPositive ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
          {isPositive ? "+" : ""}
          {stat.trend}%
        </span>
        <span className="truncate font-medium text-slate-500">{stat.trendLabel}</span>
      </div>
    </div>
  );
}

function ActionItems({ items }: { items: OverviewDashboard["actionItems"] }) {
  return (
    <AdminCard
      title="Thông tin cần theo dõi"
      icon={<BellRinging size={18} weight="duotone" />}
      action={
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-extrabold text-white">
          {items.length}
        </span>
      }
      className="max-h-[420px] h-full"
      bodyClassName="custom-scrollbar overflow-y-auto p-2"
    >
      {items.length === 0 ? (
        <AdminEmptyState
          icon={<CheckCircle size={24} weight="duotone" />}
          title="Mọi thứ đều ổn"
          description="Chưa có thông tin cần theo dõi."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl p-3.5 transition-colors hover:bg-slate-50">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <BellRinging size={16} weight="duotone" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="line-clamp-1 text-sm font-bold text-slate-900">{item.title}</h4>
                    <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-400">
                      {formatRelativeTime(item.time)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-light px-3 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    {item.action}
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}

function TodaySchedule({
  appointments,
}: {
  appointments: OverviewAppointment[];
}) {
  return (
    <AdminCard
      title="Lịch trình hôm nay"
      description={`${appointments.length} lịch hẹn`}
      icon={<Clock size={18} weight="duotone" />}
      action={
        <Link
          href="/admin/schedules"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand-light"
        >
          Xem tất cả lịch
          <ArrowRight size={12} weight="bold" />
        </Link>
      }
    >
      {appointments.length === 0 ? (
        <AdminEmptyState
          icon={<CalendarBlank size={24} weight="duotone" />}
          title="Hôm nay chưa có lịch hẹn nào"
        />
      ) : (
        <div className="relative ml-2 space-y-3 border-l-2 border-dashed border-slate-200 md:ml-3">
          {appointments.map((item) => {
            const status = statusConfig[item.status] ?? {
              label: item.status || "Không rõ trạng thái",
              color: "bg-slate-100 text-slate-700 border-slate-200",
            };

            return (
              <div key={item.id} className="relative pl-5 sm:pl-7">
                <span className="absolute -left-[7px] top-6 h-3 w-3 rounded-full border-2 border-white bg-brand shadow-sm" />
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="shrink-0 rounded-lg bg-brand-light px-2.5 py-1.5 text-center">
                      <p className="text-sm font-extrabold leading-tight text-brand">{item.start_time}</p>
                      <p className="text-[10px] font-semibold text-brand/70">{item.end_time}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{item.patient_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className="text-slate-500">{item.service_name}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Stethoscope size={12} />
                          {item.doctor_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                      status.color,
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
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
