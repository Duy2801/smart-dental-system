"use client";

import { useEffect, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  ArrowClockwise,
  VideoCamera,
  Storefront,
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
  type: "OFFLINE" | "ONLINE";
  start_time: string;
  end_time: string;
  patient_name: string;
  service_name: string;
  status: AppointmentStatus | "SCHEDULED";
  recordId: string | null;
  sortTime: number;
};

type RawAppointment = {
  id: string;
  scheduledAt: string;
  endAt: string | null;
  status: AppointmentStatus;
  patient?: { fullName?: string | null; user?: { fullName?: string } | null } | null;
  service?: { name?: string } | null;
  medicalRecords?: { id: string }[];
};

type RawVideoConsultation = {
  id: string;
  patientName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700 border-blue-200" },
  CHECKED_IN: { label: "Đã check-in", color: "bg-violet-100 text-violet-700 border-violet-200" },
  IN_PROGRESS: { label: "Đang khám", color: "bg-orange-100 text-orange-700 border-orange-200" },
  COMPLETED: { label: "Đã hoàn thành", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600 border-red-200" },
  NO_SHOW: { label: "Không đến", color: "bg-slate-100 text-slate-600 border-slate-200" },
  SCHEDULED: { label: "Sắp tới", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

const WAITING_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "SCHEDULED"];

function getUserInfo(): { doctorId: string | null; fullName: string | null } {
  if (typeof document === "undefined") return { doctorId: null, fullName: null };
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return { doctorId: null, fullName: null };
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return { doctorId: null, fullName: null };
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function todayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchDashboard = async () => {
    const { doctorId, fullName } = getUserInfo();
    setDoctorName(fullName);
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const date = todayDateStr();
      const [apptRes, vcRes] = await Promise.all([
        apiClient.get<RawAppointment[]>(`/appointments?doctorId=${doctorId}&from=${date}&to=${date}`),
        apiClient.get<RawVideoConsultation[]>(`/video-consultations?doctorId=${doctorId}`),
      ]);

      const offlineList = (apptRes.data ?? []).map((a) => ({
        id: a.id,
        type: "OFFLINE" as const,
        start_time: formatTime(a.scheduledAt),
        end_time: a.endAt ? formatTime(a.endAt) : "—",
        patient_name: a.patient?.fullName ?? a.patient?.user?.fullName ?? "—",
        service_name: a.service?.name ?? "—",
        status: a.status,
        recordId: a.medicalRecords?.[0]?.id ?? null,
        sortTime: new Date(a.scheduledAt).getTime(),
      }));

      // Filter video consultations for today
      const todayStart = new Date(date);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(date);
      todayEnd.setHours(23, 59, 59, 999);

      const onlineList = (vcRes.data ?? [])
        .filter((vc) => {
          const t = new Date(vc.scheduledAt).getTime();
          return t >= todayStart.getTime() && t <= todayEnd.getTime();
        })
        .map((vc) => {
          const start = new Date(vc.scheduledAt);
          const end = new Date(start.getTime() + vc.durationMinutes * 60000);
          return {
            id: vc.id,
            type: "ONLINE" as const,
            start_time: formatTime(vc.scheduledAt),
            end_time: formatTime(end.toISOString()),
            patient_name: vc.patientName,
            service_name: `Tư vấn trực tuyến (${vc.durationMinutes} phút)`,
            status: vc.status,
            recordId: null,
            sortTime: start.getTime(),
          };
        });

      const merged = [...offlineList, ...onlineList].sort((a, b) => a.sortTime - b.sortTime);
      setAppointments(merged);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAppointment = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/appointments/${id}/start`);
      await fetchDashboard();
    } catch {
      alert("Không thể bắt đầu ca khám. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/appointments/${id}/complete`);
      await fetchDashboard();
    } catch {
      alert("Không thể kết thúc ca khám. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  const greeting = doctorName ? `Chào ${doctorName}` : "Chào bác sĩ";

  return (
    <>
      <Header title={greeting} description={currentDate} />

      <div className="space-y-6 p-6 md:p-8">
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

        <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm">
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
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {item.type === "ONLINE" ? (
                              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                <VideoCamera size={12} weight="fill" />
                                Gọi video
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <Storefront size={12} weight="fill" />
                                Tại phòng khám
                              </span>
                            )}
                            {item.service_name}
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg?.color)}>
                            {cfg?.label ?? item.status}
                          </span>
                          
                          {/* Online Actions */}
                          {item.type === "ONLINE" && item.status !== "CANCELLED" && (
                            <Link
                              href={`/doctor/consultations/${item.id}`}
                              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
                            >
                              Mở phòng tư vấn
                            </Link>
                          )}

                          {/* Offline Actions */}
                          {item.type === "OFFLINE" && item.status === "CHECKED_IN" && (
                            <button
                              onClick={() => handleStartAppointment(item.id)}
                              disabled={actionLoading === item.id}
                              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === item.id ? "Đang xử lý..." : "Bắt đầu khám"}
                            </button>
                          )}
                          {item.type === "OFFLINE" && item.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleCompleteAppointment(item.id)}
                              disabled={actionLoading === item.id}
                              className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === item.id ? "Đang xử lý..." : "Kết thúc khám"}
                            </button>
                          )}
                          {item.type === "OFFLINE" && item.status === "COMPLETED" && (
                            <Link
                              href={
                                item.recordId
                                  ? `/doctor/medical-records?recordId=${item.recordId}`
                                  : "/doctor/medical-records"
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
                            >
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
      </div>
    </>
  );
}
