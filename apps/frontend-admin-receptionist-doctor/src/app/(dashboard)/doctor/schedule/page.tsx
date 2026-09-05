"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import {
  Plus,
  CaretLeft,
  CaretRight,
  Warning,
  CalendarCheck,
  CheckCircle,
  Clock,
  VideoCamera,
  Storefront,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { localDateStr } from "@/src/lib/receptionist/mappers";
import { WeekCalendar } from "./_components/WeekCalendar";
import { AppointmentList } from "./_components/AppointmentList";
import { TimeOffModal } from "./_components/TimeOffModal";
import type { ScheduleAppointment, TimeOffRecord } from "./_components/types";

type ViewMode = "week" | "list";

const DAY_LABELS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getWeekBounds(refDate: Date) {
  const d = new Date(refDate);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMon);
  d.setHours(0, 0, 0, 0);
  const from = new Date(d);
  const to = new Date(d);
  to.setDate(to.getDate() + 6);
  return { from, to };
}

function buildWeekDays(from: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const isToday = d.getTime() === today.getTime();
    return {
      iso: localDateStr(d),
      date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      day: DAY_LABELS[d.getDay()],
      isToday,
    };
  });
}

function getUserInfo(): { doctorId: string | null } {
  if (typeof document === "undefined") return { doctorId: null };
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return { doctorId: null };
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return { doctorId: null };
  }
}

function toScheduleAppointment(raw: Record<string, unknown>): ScheduleAppointment {
  const scheduledAt = raw.scheduledAt as string;
  const endAt = raw.endAt as string | null;
  const durationMinutes = endAt
    ? Math.round((new Date(endAt).getTime() - new Date(scheduledAt).getTime()) / 60000)
    : 30;
  const patient = raw.patient as Record<string, unknown> | null;
  const patientUser = patient?.user as Record<string, unknown> | null;
  const service = raw.service as Record<string, unknown> | null;
  const medicalRecords = raw.medicalRecords as { id: string }[] | undefined;

  return {
    id: raw.id as string,
    type: "OFFLINE",
    appointmentCode: raw.appointmentCode as string,
    scheduledAt,
    durationMinutes,
    dayIso: localDateStr(new Date(scheduledAt)),
    status: raw.status as ScheduleAppointment["status"],
    patientId: (patient?.id as string | undefined) ?? null,
    patientName: (patient?.fullName as string) ?? (patientUser?.fullName as string) ?? "-",
    patientCode: (patient?.patientCode as string) ?? "",
    patientPhone: (patient?.phone as string) ?? (patientUser?.phone as string) ?? "",
    serviceName: (service?.name as string) ?? "-",
    notes: raw.notes as string | null,
    medicalRecordId: medicalRecords?.[0]?.id ?? null,
  };
}

function toTimeOff(raw: Record<string, unknown>): TimeOffRecord | null {
  if (raw.recordType !== "TIME_OFF" || !raw.isActive) return null;
  const specificDate = raw.specificDate as string | null;
  if (!specificDate) return null;
  const approvalStatus =
    raw.approvalStatus === "PENDING" || raw.approvalStatus === "REJECTED"
      ? raw.approvalStatus
      : "APPROVED";
  return {
    id: raw.id as string,
    dayIso: localDateStr(new Date(specificDate)),
    startTime: String(raw.startTime).slice(0, 5),
    endTime: String(raw.endTime).slice(0, 5),
    reason: (raw.reason as string) ?? null,
    approvalStatus,
  };
}

export default function DoctorSchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [refDate, setRefDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { from, to } = getWeekBounds(refDate);
  const weekDays = buildWeekDays(from);
  const weekLabel = `${from.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${to.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}, ${to.getFullYear()}`;

  const doctorId = getUserInfo().doctorId;
  const fromStr = localDateStr(from);
  const toStr = localDateStr(to);

  const fetchSchedule = useCallback(async () => {
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [apptRes, availRes, vcRes] = await Promise.all([
        apiClient.get<Record<string, unknown>[]>(
          `/appointments?doctorId=${doctorId}&from=${fromStr}&to=${toStr}`,
        ),
        apiClient.get<{ records?: Record<string, unknown>[] }>(
          `/doctor-availability?doctorId=${doctorId}`,
        ),
        apiClient.get<Record<string, unknown>[]>(
          `/video-consultations?doctorId=${doctorId}`,
        ),
      ]);
      const offline = apptRes.data.map(toScheduleAppointment);
      const online = (vcRes.data ?? [])
        .filter((vc) => {
          const iso = localDateStr(new Date(vc.scheduledAt as string));
          return iso >= fromStr && iso <= toStr;
        })
        .map((vc) => {
          return {
            id: vc.id as string,
            type: "ONLINE" as const,
            appointmentCode: (vc.id as string).split("-")[0].toUpperCase(),
            scheduledAt: vc.scheduledAt as string,
            durationMinutes: vc.durationMinutes as number,
            dayIso: localDateStr(new Date(vc.scheduledAt as string)),
            status: vc.status as ScheduleAppointment["status"],
            patientId: (vc.patientId as string | undefined) ?? null,
            patientName: (vc.patientName as string) || "Bệnh nhân",
            patientCode: (vc.patientCode as string) || "",
            patientPhone: (vc.patientPhone as string) || "",
            serviceName: "Tư vấn trực tuyến",
            notes: (vc.notes as string) ?? null,
            medicalRecordId: null,
          };
        });
      setAppointments([...offline, ...online]);
      const offs = (availRes.data.records ?? [])
        .map(toTimeOff)
        .filter((r): r is TimeOffRecord => r !== null)
        .filter((r) => r.dayIso >= fromStr && r.dayIso <= toStr);
      setTimeOffs(offs);
    } catch {
      setError("Không thể tải lịch hẹn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, fromStr, toStr]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  async function handleStatusChange(id: string, action: "start" | "complete") {
    setActionError(null);
    const endpoint = action === "start" ? `/appointments/${id}/start` : `/appointments/${id}/complete`;
    try {
      await apiClient.patch(endpoint);
      await fetchSchedule();
    } catch {
      const msg =
        action === "start"
          ? "Không thể bắt đầu ca khám. Kiểm tra bệnh nhân đã check-in chưa."
          : "Không thể kết thúc ca khám. Vui lòng thử lại.";
      setActionError(msg);
      throw new Error(msg);
    }
  }

  function prevWeek() {
    setRefDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 7);
      return n;
    });
  }
  function nextWeek() {
    setRefDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 7);
      return n;
    });
  }
  function goToday() {
    setRefDate(new Date());
  }

  // Weekly Statistics Summary
  const stats = useMemo(() => {
    const total = appointments.length;
    const offline = appointments.filter((a) => a.type === "OFFLINE").length;
    const online = appointments.filter((a) => a.type === "ONLINE").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const timeOffDays = new Set(timeOffs.map((t) => t.dayIso)).size;

    return { total, offline, online, completed, timeOffDays };
  }, [appointments, timeOffs]);

  return (
    <>
      <Header
        title="Lịch làm việc của tôi"
        description="Quản lý ca trực và lịch hẹn với bệnh nhân"
      >
        <button
          onClick={() => setShowLeaveModal(true)}
          className="ml-auto flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98] cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          Đăng ký ngày nghỉ
        </button>
      </Header>

      <div className="space-y-6 p-6 md:p-8">
        {/* 1. WEEKLY SUMMARY STATS COUNTER */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <CalendarCheck size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng ca tuần này</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-brand-dark">{stats.total}</span>
                <span className="text-xs text-muted-foreground font-medium">ca ({stats.offline} trực tiếp)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <VideoCamera size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tư vấn Video Online</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-blue-700">{stats.online}</span>
                <span className="text-xs text-muted-foreground font-medium">ca</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đã hoàn thành</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-emerald-700">{stats.completed}</span>
                <span className="text-xs text-muted-foreground font-medium">ca khám</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đăng ký ngày nghỉ</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-amber-700">{stats.timeOffDays}</span>
                <span className="text-xs text-muted-foreground font-medium">ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CALENDAR CONTROLS & NAVIGATION */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  viewMode === "week"
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-muted-foreground hover:text-brand-dark",
                )}
              >
                Theo Tuần
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-muted-foreground hover:text-brand-dark",
                )}
              >
                Danh Sách
              </button>
            </div>
            <button
              onClick={goToday}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-brand-dark transition-colors hover:bg-muted cursor-pointer"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-brand-dark">
            <button
              onClick={prevWeek}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <CaretLeft size={16} />
            </button>
            <span className="min-w-[160px] text-center font-bold">{weekLabel}</span>
            <button
              onClick={nextWeek}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>

        {(error || actionError) && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            <span>{error || actionError}</span>
            {error && (
              <button
                onClick={fetchSchedule}
                className="ml-auto text-xs font-semibold underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                Thử lại
              </button>
            )}
            {actionError && !error && (
              <button
                onClick={() => setActionError(null)}
                className="ml-auto text-xs font-semibold underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                Đóng
              </button>
            )}
          </div>
        )}

        {viewMode === "week" ? (
          <WeekCalendar
            weekDays={weekDays}
            appointments={appointments}
            timeOffs={timeOffs}
            loading={loading}
            onStatusChange={handleStatusChange}
            onDeleteTimeOff={async (id) => {
              await apiClient.delete(`/doctor-availability/${id}`);
              await fetchSchedule();
            }}
          />
        ) : (
          <AppointmentList
            appointments={appointments}
            loading={loading}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {showLeaveModal && doctorId && (
        <TimeOffModal
          doctorId={doctorId}
          onClose={() => setShowLeaveModal(false)}
          onSuccess={fetchSchedule}
        />
      )}
    </>
  );
}
