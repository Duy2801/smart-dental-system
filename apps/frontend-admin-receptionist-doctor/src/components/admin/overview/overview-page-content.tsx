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
    label: "Cho xac nhan",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Da xac nhan",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  CHECKED_IN: {
    label: "Da check-in",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  IN_PROGRESS: {
    label: "Dang kham",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  COMPLETED: {
    label: "Da hoan thanh",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Da huy",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  NO_SHOW: {
    label: "Khong den",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  RESCHEDULED: {
    label: "Doi lich",
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
      <Header title="Tong quan Quan ly" description={currentDate}>
      </Header>

      <div className="space-y-6 p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-6">
            <SkeletonCardGrid count={5} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SkeletonChart />
              </div>
              <div className="rounded-2xl border border-border bg-white shadow-sm">
                <div className="border-b border-border p-5">
                  <SkeletonRows count={1} />
                </div>
                <SkeletonRows count={3} />
              </div>
            </div>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Khong tai duoc du lieu tong quan.
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
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <p className="font-mono text-3xl font-bold text-brand-dark">
          {formatStatValue(stat)}
        </p>
        <span
          className={cn(
            "text-base font-semibold",
            stat.isStar ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          {stat.suffix}
        </span>
      </div>
      <div className="mt-3 flex items-center text-xs">
        <span
          className={cn(
            "rounded-full bg-opacity-10 px-1.5 py-0.5 font-medium",
            isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
          )}
        >
          {isPositive ? "+" : ""}
          {stat.trend}%
        </span>
        <span className="ml-2 text-muted-foreground">{stat.trendLabel}</span>
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
    <div className="flex max-h-[400px] flex-col rounded-2xl border border-border bg-white shadow-sm">
      <div className="shrink-0 border-b border-border p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-brand-dark">
          Thong tin can theo doi
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand">
            {items.length}
          </span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Chua co thong tin can theo doi.
            </div>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl p-4 transition-colors hover:bg-muted/10"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="line-clamp-1 text-sm font-semibold text-brand-dark">
                  {item.title}
                </h4>
                <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">
                  {formatRelativeTime(item.time)}
                </span>
              </div>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
              <div className="mt-1 flex justify-end">
                <Link
                  href={item.href}
                  className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-white"
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
    <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h3 className="text-base font-semibold text-brand-dark">
          Lich trinh hom nay
        </h3>
        <Link
          href="/admin/schedules"
          className="text-sm font-medium text-brand hover:underline"
        >
          Tat ca lich
        </Link>
      </div>
      <div className="flex-1 p-5">
        {appointments.length === 0 ? (
          <div className="rounded-xl bg-muted/30 p-6 text-sm text-muted-foreground">
            Hom nay chua co lich hen.
          </div>
        ) : null}
        <div className="relative ml-3 space-y-6 border-l-2 border-muted/50 pb-2 md:ml-4">
          {appointments.map((item) => (
            <div key={item.id} className="group relative pl-6 sm:pl-8">
              <span className="absolute -left-[5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand ring-4 ring-white" />
              <div className="flex flex-col gap-3 rounded-xl border border-transparent p-4 transition-colors hover:border-border hover:bg-muted/10 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-sm font-bold text-brand">
                    {item.start_time} - {item.end_time}
                  </span>
                  <span className="text-base font-semibold text-brand-dark">
                    {item.patient_name}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.service_name}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-sm text-brand">{item.doctor_name}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
    return `${diffMinutes} phut truoc`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} gio truoc`;
  }

  return `${Math.round(diffHours / 24)} ngay truoc`;
}
