"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { Plus, CaretLeft, CaretRight, Warning } from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { WeekCalendar } from "./_components/WeekCalendar";
import { AppointmentList } from "./_components/AppointmentList";
import { TimeOffModal } from "./_components/TimeOffModal";
import type { ScheduleAppointment } from "./_components/types";

type ViewMode = "week" | "list";

const DAY_LABELS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getWeekBounds(refDate: Date) {
  const d = new Date(refDate);
  // Monday = 1, shift so week starts Monday
  const day = d.getDay(); // 0=Sun
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
    const iso = d.toISOString().slice(0, 10);
    return {
      iso,
      date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      day: DAY_LABELS[d.getDay()],
      isToday,
    };
  });
}

function isoDateOf(isoString: string) {
  return isoString.slice(0, 10);
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

  return {
    id: raw.id as string,
    appointmentCode: raw.appointmentCode as string,
    scheduledAt,
    durationMinutes,
    dayIso: isoDateOf(scheduledAt),
    status: raw.status as ScheduleAppointment["status"],
    patientName: (patientUser?.fullName as string) ?? "—",
    patientCode: (patient?.patientCode as string) ?? "—",
    patientPhone: (patientUser?.phone as string) ?? "",
    serviceName: (service?.name as string) ?? "—",
    notes: raw.notes as string | null,
  };
}

export default function DoctorSchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [refDate, setRefDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to } = getWeekBounds(refDate);
  const weekDays = buildWeekDays(from);
  const weekLabel = `${from.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – ${to.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}, ${to.getFullYear()}`;

  const doctorId = getUserInfo().doctorId;

  const fetchAppointments = useCallback(async () => {
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fromStr = from.toISOString().slice(0, 10);
      const toStr = to.toISOString().slice(0, 10);
      const res = await apiClient.get<Record<string, unknown>[]>(
        `/appointments?doctorId=${doctorId}&from=${fromStr}&to=${toStr}`,
      );
      setAppointments(res.data.map(toScheduleAppointment));
    } catch {
      setError("Không thể tải lịch hẹn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, from.getTime(), to.getTime()]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleStatusChange(id: string, action: "start" | "complete") {
    const endpoint = action === "start" ? `/appointments/${id}/start` : `/appointments/${id}/complete`;
    await apiClient.patch(endpoint);
    await fetchAppointments();
  }

  function prevWeek() {
    setRefDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }
  function nextWeek() {
    setRefDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  }
  function goToday() {
    setRefDate(new Date());
  }

  return (
    <>
      <Header
        title="Lịch làm việc của tôi"
        description="Quản lý ca trực và lịch hẹn với bệnh nhân"
      >
        <button
          onClick={() => setShowLeaveModal(true)}
          className="ml-auto flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          Đăng ký ngày nghỉ
        </button>
      </Header>

      <div className="space-y-6 p-6 md:p-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
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
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
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
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-brand-dark transition-colors hover:bg-muted"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-brand-dark">
            <button
              onClick={prevWeek}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted"
            >
              <CaretLeft size={16} />
            </button>
            <span className="min-w-[160px] text-center">{weekLabel}</span>
            <button
              onClick={nextWeek}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchAppointments}
              className="ml-auto text-xs font-semibold underline underline-offset-2 hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {viewMode === "week" ? (
          <WeekCalendar
            weekDays={weekDays}
            appointments={appointments}
            loading={loading}
            onStatusChange={handleStatusChange}
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
        />
      )}
    </>
  );
}
