"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import {
  AppointmentStatusBadge,
  type AppointmentStatus,
} from "@/src/components/shared/appointment-status-badge";
import apiClient from "@/src/lib/api/client";
import { mapAppointments, localDateStr } from "@/src/lib/receptionist/mappers";
import type { ReceptionistAppointment } from "@/src/lib/receptionist/mappers";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import { formatDoctorName } from "@/src/lib/utils/format";
import {
  CalendarBlank,
  Clock,
  UserCheck,
  ReceiptX,
  MagnifyingGlass,
  Phone,
  UserCircleCheck,
  BellRinging,
  Receipt,
  CalendarPlus,
  Users,
  Stethoscope,
  ArrowRight,
  Warning,
  ArrowClockwise,
  DotsThree,
  Eye,
  X,
  UserMinus,
  CircleNotch,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Appointment = ReceptionistAppointment;

type QueueTab = "ALL" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS";

const TABS: { id: QueueTab; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ xác nhận" },
  { id: "CONFIRMED", label: "Đã xác nhận" },
  { id: "CHECKED_IN", label: "Đã Check-in" },
  { id: "IN_PROGRESS", label: "Đang khám" },
];

const REFRESH_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-brand-light text-brand-dark",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "--:--";
  return timeStr.slice(0, 5);
}

function statusEndpoint(status: AppointmentStatus): string | null {
  if (status === "CONFIRMED") return "confirm";
  if (status === "CHECKED_IN") return "check-in";
  if (status === "IN_PROGRESS") return "start";
  if (status === "CANCELLED") return "cancel";
  if (status === "NO_SHOW") return "no-show";
  return null;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
      <div className="h-3 w-24 rounded animate-pulse bg-slate-200" />
      <div className="h-8 w-16 rounded animate-pulse bg-slate-200" />
    </div>
  );
}

function QueueRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5">
      <div className="h-9 w-9 rounded-full animate-pulse bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded animate-pulse bg-slate-200" />
        <div className="h-3 w-48 rounded animate-pulse bg-slate-200" />
      </div>
      <div className="h-8 w-24 rounded-lg animate-pulse bg-slate-200 shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Queue action menu
// ---------------------------------------------------------------------------

function QueueActionMenu({
  apt,
  onStatusChange,
  disabled,
}: {
  apt: Appointment;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900 disabled:opacity-50"
        aria-label="Tùy chọn"
      >
        <DotsThree size={16} weight="bold" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-white py-1.5 shadow-xl">
          <Link
            href={`/receptionist/appointments/${apt.id}`}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Eye size={13} /> Xem chi tiết
          </Link>
          {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
            <>
              <div className="my-1 mx-2 h-px bg-slate-100" />
              <button
                type="button"
                onClick={() => {
                  onStatusChange(apt.id, "CANCELLED");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <X size={13} /> Khách báo hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange(apt.id, "NO_SHOW");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <UserMinus size={13} /> Đánh dấu vắng mặt
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTab>("ALL");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const today = localDateStr();
    try {
      setLoading(true);
      setError(null);

      const apptRes = await apiClient.get(`/appointments?date=${today}`);
      setAppointments(mapAppointments(apptRes.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tải được dữ liệu từ máy chủ."));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
    const timer = setInterval(() => void fetchDashboard(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchDashboard]);

  const total = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const checkedInCount = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const billCount = appointments.filter(
    (a) => a.status === "COMPLETED" && a.invoicePending,
  ).length;

  const searchQuery = search.trim().toLowerCase();
  const filtered = appointments.filter((apt) => {
    const matchTab = activeTab === "ALL" || apt.status === activeTab;
    if (!searchQuery) return matchTab;
    const matchSearch =
      apt.patient?.fullName.toLowerCase().includes(searchQuery) ||
      apt.patient?.phone.includes(searchQuery) ||
      apt.appointmentCode.toLowerCase().includes(searchQuery) ||
      apt.service?.name.toLowerCase().includes(searchQuery);
    return matchTab && matchSearch;
  });

  const isEmptyDueToSearch =
    searchQuery.length > 0 && filtered.length === 0 && appointments.length > 0;

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    if (status === "CANCELLED" && !window.confirm("Xác nhận hủy lịch hẹn này?")) return;
    if (status === "NO_SHOW" && !window.confirm("Đánh dấu bệnh nhân vắng mặt?")) return;

    const endpoint = statusEndpoint(status);
    if (!endpoint) return;

    setActionLoading(id);
    setError(null);
    try {
      await apiClient.patch(`/appointments/${id}/${endpoint}`);
      await fetchDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Cập nhật trạng thái thất bại."));
    } finally {
      setActionLoading(null);
    }
  };

  const isActionBusy = (id: string) => actionLoading === id;

  return (
    <>
      <Header
        title="Tổng quan Lễ tân"
        description={`Hôm nay, ${new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}`}
      >
        <Link
          href="/receptionist/appointments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
        >
          <CalendarPlus weight="bold" size={16} />
          Tạo lịch hẹn
        </Link>
      </Header>

      <div className="bg-muted p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Lịch hẹn hôm nay</p>
                  <p className="mt-2 text-3xl font-bold text-brand-dark">{total}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">ca khám</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand shrink-0">
                  <CalendarBlank weight="bold" size={20} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Chờ xác nhận</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">cần gọi điện</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shrink-0">
                  <Clock weight="bold" size={20} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Đã Check-in</p>
                  <p className="mt-2 text-3xl font-bold text-brand">{checkedInCount}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">đang chờ khám</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand shrink-0">
                  <UserCheck weight="bold" size={20} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Chờ thu tiền</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{billCount}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">hóa đơn mở</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-400 shrink-0">
                  <ReceiptX weight="bold" size={20} />
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <div className="flex items-center gap-2 min-w-0">
              <Warning weight="fill" size={16} className="shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
            >
              <ArrowClockwise size={14} />
              Thử lại
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tra cứu bệnh nhân (Tên, SĐT, mã lịch, dịch vụ)..."
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-brand-dark">Hàng đợi hôm nay</h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void fetchDashboard()}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand transition-colors disabled:opacity-50"
                      title="Làm mới"
                    >
                      <ArrowClockwise size={12} className={loading ? "animate-spin" : ""} />
                      Làm mới
                    </button>
                    <Link
                      href="/receptionist/appointments"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                    >
                      Xem tất cả <ArrowRight size={12} weight="bold" />
                    </Link>
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto">
                  {TABS.map((tab) => {
                    const count =
                      tab.id === "ALL"
                        ? appointments.length
                        : appointments.filter((a) => a.status === tab.id).length;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all -mb-px",
                          activeTab === tab.id
                            ? "border-brand text-brand"
                            : "border-transparent text-muted-foreground hover:text-brand-dark",
                        )}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                              activeTab === tab.id
                                ? "bg-brand text-white"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loading ? (
                <div className="divide-y divide-border/50">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <QueueRowSkeleton key={i} />
                  ))}
                </div>
              ) : isEmptyDueToSearch ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
                  <MagnifyingGlass size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">Không tìm thấy kết quả phù hợp</p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
                  <CalendarBlank size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">Hàng đợi trống hôm nay</p>
                  <Link
                    href="/receptionist/appointments/new"
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    + Tạo lịch mới
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filtered.map((apt) => {
                    const name = apt.patient?.fullName ?? "Khách vãng lai";
                    const initials = getInitials(name);
                    const avatarColor = getAvatarColor(name);
                    const busy = isActionBusy(apt.id);

                    return (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            avatarColor,
                          )}
                        >
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-brand-dark truncate">
                              {name}
                            </span>
                            <AppointmentStatusBadge status={apt.status} />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground font-medium">
                            <span className="font-mono">{formatTime(apt.startTime)}</span>
                            <span className="font-mono opacity-60">{apt.appointmentCode}</span>
                            {apt.patient?.phone && (
                              <span className="font-mono opacity-80">{apt.patient.phone}</span>
                            )}
                            {apt.service?.name && (
                              <span className="flex items-center gap-1">
                                <Stethoscope size={11} />
                                {apt.service.name}
                              </span>
                            )}
                            {apt.doctor?.fullName && (
                              <span className="text-slate-500">
                                {formatDoctorName(apt.doctor.fullName)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {apt.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleStatusChange(apt.id, "CONFIRMED")}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
                              >
                                {busy ? (
                                  <CircleNotch size={13} className="animate-spin" />
                                ) : (
                                  <Phone size={13} weight="fill" />
                                )}
                                Xác nhận
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleStatusChange(apt.id, "CHECKED_IN")}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand bg-white px-3 text-xs font-semibold text-brand shadow-sm transition-all hover:bg-brand/5 active:scale-[0.98] disabled:opacity-60"
                                title="Check-in trực tiếp (walk-in)"
                              >
                                {busy ? (
                                  <CircleNotch size={13} className="animate-spin" />
                                ) : (
                                  <UserCircleCheck size={13} weight="fill" />
                                )}
                                Check-in
                              </button>
                            </>
                          )}
                          {apt.status === "CONFIRMED" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleStatusChange(apt.id, "CHECKED_IN")}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
                            >
                              {busy ? (
                                <CircleNotch size={13} className="animate-spin" />
                              ) : (
                                <UserCircleCheck size={13} weight="fill" />
                              )}
                              Check-in
                            </button>
                          )}
                          {apt.status === "CHECKED_IN" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleStatusChange(apt.id, "IN_PROGRESS")}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand-dark shadow-sm transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
                            >
                              {busy ? (
                                <CircleNotch size={13} className="animate-spin" />
                              ) : (
                                <BellRinging size={13} />
                              )}
                              Nhắc BS
                            </button>
                          )}
                          {apt.status === "COMPLETED" && apt.invoicePending && (
                            <Link
                              href="/receptionist/billing"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                            >
                              <Receipt size={13} weight="fill" />
                              Thu tiền
                            </Link>
                          )}
                          {(apt.status === "IN_PROGRESS" ||
                            apt.status === "RESCHEDULED" ||
                            (apt.status === "COMPLETED" && !apt.invoicePending) ||
                            apt.status === "CANCELLED" ||
                            apt.status === "NO_SHOW") && (
                            <Link
                              href={`/receptionist/appointments/${apt.id}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-brand-dark active:scale-[0.98]"
                            >
                              Chi tiết
                            </Link>
                          )}
                          {(apt.status === "PENDING" ||
                            apt.status === "CONFIRMED" ||
                            apt.status === "CHECKED_IN") && (
                            <QueueActionMenu
                              apt={apt}
                              onStatusChange={(id, status) => void handleStatusChange(id, status)}
                              disabled={busy}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thao tác nhanh
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/receptionist/appointments/new"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted p-4 text-center transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]"
                >
                  <CalendarPlus size={22} className="text-brand" />
                  <span className="text-xs font-semibold text-slate-700 leading-snug">Tạo lịch hẹn</span>
                </Link>
                <Link
                  href="/receptionist/check-in"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted p-4 text-center transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]"
                >
                  <UserCircleCheck size={22} className="text-brand" />
                  <span className="text-xs font-semibold text-slate-700 leading-snug">Check-in nhanh</span>
                </Link>
                <Link
                  href="/receptionist/patients/new"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted p-4 text-center transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]"
                >
                  <Users size={22} className="text-brand" />
                  <span className="text-xs font-semibold text-slate-700 leading-snug">Thêm bệnh nhân</span>
                </Link>
                <Link
                  href="/receptionist/billing"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted p-4 text-center transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]"
                >
                  <Receipt size={22} className="text-brand" />
                  <span className="text-xs font-semibold text-slate-700 leading-snug">Thu ngân</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
