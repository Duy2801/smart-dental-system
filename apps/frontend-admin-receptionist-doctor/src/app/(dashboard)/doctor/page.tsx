"use client";

import { useEffect, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  FileText,
  Pill,
  CalendarDots,
  ArrowClockwise,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type TodayAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  service_name: string;
  doctor_name: string;
  status: AppointmentStatus;
};

type DashboardData = {
  todayAppointments: TodayAppointment[];
};

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700 border-blue-200" },
  CHECKED_IN: { label: "Đã check-in", color: "bg-violet-100 text-violet-700 border-violet-200" },
  IN_PROGRESS: { label: "Đang khám", color: "bg-orange-100 text-orange-700 border-orange-200" },
  COMPLETED: { label: "Đã hoàn thành", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600 border-red-200" },
  NO_SHOW: { label: "Không đến", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

const WAITING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
      </div>
      <div className="mt-3 h-9 w-20 rounded bg-slate-200" />
    </div>
  );
}

function AppointmentSkeleton() {
  return (
    <div className="relative pl-6 sm:pl-8 animate-pulse">
      <span className="absolute -left-1.25 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-200 ring-4 ring-white" />
      <div className="rounded-xl border border-border/50 bg-slate-50 p-4">
        <div className="h-4 w-24 rounded bg-slate-200 mb-2" />
        <div className="h-5 w-40 rounded bg-slate-200 mb-1" />
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function DoctorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<DashboardData>("/reports/dashboard");
      setData(res.data);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const appointments = data?.todayAppointments ?? [];
  const totalCount = appointments.length;
  const waitingCount = appointments.filter((a) => WAITING_STATUSES.includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  const statCards = [
    {
      label: "Tổng ca hôm nay",
      value: totalCount,
      suffix: "ca",
      icon: CalendarCheck,
      iconColor: "text-brand",
      bgColor: "bg-brand/8",
    },
    {
      label: "Đang chờ khám",
      value: waitingCount,
      suffix: "người",
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Đã hoàn thành",
      value: completedCount,
      suffix: "ca",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const actionItems = [
    {
      id: "c1",
      type: "medical_record" as const,
      title: "Hồ sơ chưa hoàn thiện",
      desc: "Kiểm tra và cập nhật bệnh án sau mỗi ca khám.",
      action: "Viết bệnh án",
      link: "/doctor/medical-records",
    },
    {
      id: "c2",
      type: "prescription" as const,
      title: "Đơn thuốc chưa kê",
      desc: "Kê đơn thuốc cho bệnh nhân sau điều trị.",
      action: "Kê đơn",
      link: "/doctor/prescriptions/new",
    },
    {
      id: "c3",
      type: "treatment_plan" as const,
      title: "Kế hoạch điều trị",
      desc: "Cập nhật tiến độ kế hoạch điều trị đang thực hiện.",
      action: "Cập nhật",
      link: "/doctor/treatment-plans",
    },
  ];

  const actionIconMap = {
    medical_record: FileText,
    prescription: Pill,
    treatment_plan: CalendarDots,
  };

  return (
    <>
      <Header title="Chào BS. Trần Minh," description={currentDate} />

      <div className="space-y-6 p-6 md:p-8">
        {/* Error */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={fetchDashboard}
              className="flex items-center gap-1.5 font-semibold hover:underline"
            >
              <ArrowClockwise size={14} />
              Thử lại
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", stat.bgColor)}>
                        <Icon size={18} className={stat.iconColor} weight="duotone" />
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <p className="font-mono text-3xl font-bold text-brand-dark">{stat.value}</p>
                      <span className="text-base font-semibold text-muted-foreground">{stat.suffix}</span>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Timeline lịch hẹn hôm nay */}
          <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 className="text-base font-semibold text-brand-dark">Lịch làm việc hôm nay</h3>
              <Link href="/doctor/schedule" className="text-sm font-medium text-brand hover:underline">
                Xem lịch tuần →
              </Link>
            </div>

            <div className="flex-1 p-5">
              {loading ? (
                <div className="relative ml-3 space-y-5 border-l-2 border-muted/50 pb-2 md:ml-4">
                  {Array.from({ length: 4 }).map((_, i) => <AppointmentSkeleton key={i} />)}
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarCheck size={40} className="mb-3 text-slate-300" weight="duotone" />
                  <p className="font-medium text-slate-500">Hôm nay chưa có lịch hẹn nào.</p>
                </div>
              ) : (
                <div className="relative ml-3 space-y-5 border-l-2 border-muted/50 pb-2 md:ml-4">
                  {appointments.map((item) => {
                    const cfg = statusConfig[item.status];
                    return (
                      <div key={item.id} className="group relative pl-6 sm:pl-8">
                        <span className="absolute -left-1.25 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand ring-4 ring-white" />
                        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-slate-50/50 p-4 transition-all hover:border-brand/30 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-mono text-sm font-bold text-brand">
                              {item.start_time} – {item.end_time}
                            </span>
                            <span className="text-base font-semibold text-brand-dark">
                              {item.patient_name}
                            </span>
                            <span className="text-sm text-muted-foreground">{item.service_name}</span>
                          </div>
                          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                              {cfg.label}
                            </span>
                            {item.status === "CHECKED_IN" && (
                              <Link href="/doctor/medical-records" className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]">
                                Bắt đầu khám
                              </Link>
                            )}
                            {item.status === "IN_PROGRESS" && (
                              <button className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 active:scale-[0.98]">
                                Kết thúc khám
                              </button>
                            )}
                            {item.status === "COMPLETED" && (
                              <Link href="/doctor/medical-records" className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]">
                                Cập nhật hồ sơ
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Hồ sơ cần xử lý */}
          <div className="flex h-fit flex-col rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-brand-dark">
                Hồ sơ cần xử lý
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                  {actionItems.length}
                </span>
              </h3>
            </div>
            <div className="flex-1 p-2">
              <div className="divide-y divide-border">
                {actionItems.map((item) => {
                  const Icon = actionIconMap[item.type];
                  return (
                    <div key={item.id} className="flex flex-col gap-2 rounded-xl p-4 transition-colors hover:bg-muted/30">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-lg bg-brand/10 p-1.5 text-brand">
                          <Icon size={16} weight="duotone" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-brand-dark">{item.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <div className="mt-1 flex justify-end">
                        <Link href={item.link} className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-white">
                          {item.action}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
