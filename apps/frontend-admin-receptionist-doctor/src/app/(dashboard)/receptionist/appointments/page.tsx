"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { AppointmentStatusBadge } from "@/src/components/shared/appointment-status-badge";
import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";
import apiClient from "@/src/lib/api/client";
import { mapAppointments, localDateStr } from "@/src/lib/receptionist/mappers";
import type { ReceptionistAppointment } from "@/src/lib/receptionist/mappers";
import {
  CalendarPlus,
  MagnifyingGlass,
  Funnel,
  CalendarBlank,
  Phone,
  UserCheck,
  BellSimpleRinging,
  Receipt,
  DotsThree,
  Eye,
  CalendarDots,
  X,
  Warning,
  CaretLeft,
  CaretRight,
  Stethoscope,
  UserMinus,
} from "@phosphor-icons/react";

type Appointment = ReceptionistAppointment;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
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

function formatTime(t?: string): string {
  if (!t) return "--:--";
  return t.slice(0, 5);
}

function toDateStr(d: Date): string {
  return localDateStr(d);
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  const diff = Math.round(
    (d.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000
  );
  const label = d.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  if (diff === 0) return `Hôm nay — ${label}`;
  if (diff === -1) return `Hôm qua — ${label}`;
  if (diff === 1) return `Ngày mai — ${label}`;
  return label;
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function TableRowSkeleton() {
  return (
    <tr>
      {[120, 160, 140, 100, 90, 80].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 rounded animate-pulse bg-slate-200"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Dropdown menu (click-based, accessible)
// ---------------------------------------------------------------------------

function ActionMenu({
  apt,
  onStatusChange,
}: {
  apt: Appointment;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
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
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
        aria-label="Tùy chọn"
      >
        <DotsThree size={18} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-border bg-white py-1.5 shadow-xl">
          <Link
            href={`/receptionist/appointments/${apt.id}`}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-brand-dark"
            onClick={() => setOpen(false)}
          >
            <Eye size={13} /> Xem chi tiết
          </Link>
          {apt.patient?.id && (
            <Link
              href={`/receptionist/patients/${apt.patient.id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-brand-dark"
              onClick={() => setOpen(false)}
            >
              <Eye size={13} /> Hồ sơ bệnh nhân
            </Link>
          )}
          {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
            <>
              <div className="my-1 mx-2 h-px bg-slate-100" />
              <button
                onClick={() => { onStatusChange(apt.id, "CANCELLED"); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <X size={13} /> Khách báo hủy
              </button>
              <button
                onClick={() => { onStatusChange(apt.id, "NO_SHOW"); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <UserMinus size={13} /> Đánh dấu vắng mặt
              </button>
              <Link
                href={`/receptionist/appointments/${apt.id}`}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-brand-dark"
                onClick={() => setOpen(false)}
              >
                <CalendarDots size={13} /> Đổi lịch
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter panel (click-based)
// ---------------------------------------------------------------------------

function FilterPanel({
  open,
  onClose,
  statusFilter,
  onStatusFilter,
  onApply,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  statusFilter: AppointmentStatus | "";
  onStatusFilter: (s: AppointmentStatus | "") => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-border bg-white p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900">Lọc nâng cao</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-slate-900">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Trạng thái
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value as AppointmentStatus | "")}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã Check-in</option>
            <option value="IN_PROGRESS">Đang khám</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="NO_SHOW">Vắng mặt</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900 active:scale-[0.98]"
        >
          Xóa lọc
        </button>
        <button
          onClick={() => { onApply(); onClose(); }}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

export default function ReceptionistAppointmentsPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [doctorFilter, setDoctorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [appliedStatus, setAppliedStatus] = useState<AppointmentStatus | "">("");
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get("/doctors")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setDoctors(
          list.map((d: { id: string; user?: { fullName?: string }; fullName?: string }) => ({
            id: d.id,
            fullName: d.user?.fullName ?? d.fullName ?? "Bác sĩ",
          })),
        );
      })
      .catch(() => setDoctors([]));
  }, []);

  // fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dateStr = toDateStr(selectedDate);
        const params = new URLSearchParams({ date: dateStr });
        if (doctorFilter) params.append("doctorId", doctorFilter);
        const res = await apiClient.get(`/appointments?${params.toString()}`);
        setAppointments(mapAppointments(res.data));
      } catch {
        setError("Không tải được lịch hẹn từ máy chủ.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setPage(1);
  }, [selectedDate, doctorFilter]);

  // derived
  const filtered = appointments.filter((a) => {
    if (appliedStatus && a.status !== appliedStatus) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.patient?.fullName.toLowerCase().includes(q) ||
      a.patient?.phone.includes(q) ||
      a.appointmentCode.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.service?.name.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // nav date
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const isToday = toDateStr(selectedDate) === toDateStr(today);
  const isYesterday = toDateStr(selectedDate) === toDateStr(new Date(today.getTime() - 86400000));
  const isTomorrow = toDateStr(selectedDate) === toDateStr(new Date(today.getTime() + 86400000));

  // status action
  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const endpoint =
      status === "CONFIRMED" ? "confirm" :
      status === "CHECKED_IN" ? "check-in" :
      status === "IN_PROGRESS" ? "start" :
      status === "CANCELLED" ? "cancel" :
      status === "NO_SHOW" ? "no-show" : null;

    if (!endpoint) return;

    try {
      await apiClient.patch(`/appointments/${id}/${endpoint}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch {
      setError("Cập nhật trạng thái thất bại.");
    }
  };

  // active filter badge count
  const filterCount = [appliedStatus].filter(Boolean).length;

  return (
    <>
      <Header
        title="Lịch hẹn"
        description="Theo dõi và điều phối lịch khám toàn phòng."
      >
        <Link
          href="/receptionist/appointments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
        >
          <CalendarPlus weight="bold" size={16} />
          Tạo lịch / Walk-in
        </Link>
      </Header>

      <div className="bg-muted min-h-screen p-6 space-y-5">

        {/* ── TOOLBAR ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative min-w-0 flex-1" style={{ maxWidth: 360 }}>
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tên, SĐT, mã lịch, dịch vụ..."
              className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Date navigation */}
          <div className="flex items-center rounded-lg border border-border bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => shiftDate(-1)}
              className="flex h-9 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900"
            >
              <CaretLeft size={15} weight="bold" />
            </button>
            <div className="flex items-center">
              <button
                onClick={() => setSelectedDate(new Date(today.getTime() - 86400000))}
                className={cn(
                  "px-3 h-9 text-xs font-semibold transition-colors border-x border-border",
                  isYesterday ? "bg-brand text-white" : "text-muted-foreground hover:bg-muted hover:text-slate-900"
                )}
              >
                Hôm qua
              </button>
              <button
                onClick={() => setSelectedDate(new Date(today))}
                className={cn(
                  "px-3 h-9 text-xs font-semibold transition-colors border-r border-border",
                  isToday ? "bg-brand text-white" : "text-muted-foreground hover:bg-muted hover:text-slate-900"
                )}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setSelectedDate(new Date(today.getTime() + 86400000))}
                className={cn(
                  "px-3 h-9 text-xs font-semibold transition-colors",
                  isTomorrow ? "bg-brand text-white" : "text-muted-foreground hover:bg-muted hover:text-slate-900"
                )}
              >
                Ngày mai
              </button>
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="flex h-9 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900 border-l border-border"
            >
              <CaretRight size={15} weight="bold" />
            </button>
          </div>

          {/* Date input */}
          <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-muted cursor-pointer">
            <CalendarDots size={15} className="text-brand shrink-0" />
            <input
              type="date"
              value={toDateStr(selectedDate)}
              onChange={(e) => {
                const d = new Date(e.target.value + "T00:00:00");
                if (!isNaN(d.getTime())) setSelectedDate(d);
              }}
              className="w-28 bg-transparent outline-none text-xs font-semibold text-slate-700 cursor-pointer"
            />
          </label>

          {/* Doctor filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
          >
            <option value="">Tất cả bác sĩ</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                BS. {d.fullName}
              </option>
            ))}
          </select>

          {/* Advanced filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]",
                filterCount > 0
                  ? "border-brand bg-brand text-white hover:bg-brand-dark"
                  : "border-border bg-white text-slate-700 hover:bg-muted"
              )}
            >
              <Funnel size={14} weight={filterCount > 0 ? "fill" : "regular"} />
              Lọc{filterCount > 0 ? ` (${filterCount})` : ""}
            </button>
            <FilterPanel
              open={showFilter}
              onClose={() => setShowFilter(false)}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              onApply={() => { setAppliedStatus(statusFilter); setPage(1); }}
              onReset={() => { setStatusFilter(""); setAppliedStatus(""); setPage(1); }}
            />
          </div>
        </div>

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <Warning weight="fill" size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── TABLE CARD ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">

          {/* Sub-header: date label + count */}
          <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarBlank size={15} className="text-brand" />
              <span className="text-sm font-semibold text-brand-dark">
                {formatDateLabel(new Date(selectedDate))}
              </span>
            </div>
            {!loading && (
              <span className="text-xs font-medium text-muted-foreground">
                {filtered.length} lịch hẹn
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-border bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 w-36">Thời gian</th>
                  <th className="px-5 py-3">Bệnh nhân</th>
                  <th className="px-5 py-3">Dịch vụ</th>
                  <th className="px-5 py-3">Bác sĩ</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                        <CalendarBlank size={36} className="text-slate-300" />
                        <p className="text-sm font-medium">Không có lịch hẹn nào</p>
                        <Link
                          href="/receptionist/appointments/new"
                          className="text-xs font-bold text-brand hover:text-brand-dark hover:underline"
                        >
                          + Tạo lịch mới
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((apt) => {
                    const name = apt.patient?.fullName ?? "Khách vãng lai";
                    const initials = getInitials(name);
                    const avatarColor = getAvatarColor(name);

                    return (
                      <tr
                        key={apt.id}
                        className="group transition-colors hover:bg-muted"
                      >
                        {/* Time */}
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-[11px] text-muted-foreground">{apt.appointmentCode}</p>
                          <p className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                            {formatTime(apt.startTime)}
                            {apt.endTime && (
                              <span className="font-normal text-muted-foreground">
                                {" "}- {formatTime(apt.endTime)}
                              </span>
                            )}
                          </p>
                        </td>

                        {/* Patient */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                avatarColor
                              )}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{name}</p>
                              {apt.patient?.phone && (
                                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                                  {apt.patient.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Stethoscope size={13} className="text-muted-foreground shrink-0" />
                            <span className="font-medium">{apt.service?.name ?? "--"}</span>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="px-5 py-3.5">
                          {apt.doctor ? (
                            <span className="inline-flex items-center rounded-md bg-brand-light px-2 py-1 text-xs font-semibold text-brand-dark ring-1 ring-inset ring-brand/20">
                              {/^bs\.?\s/i.test(apt.doctor.fullName)
                                ? apt.doctor.fullName
                                : `BS. ${apt.doctor.fullName}`}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <AppointmentStatusBadge status={apt.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {/* Primary action button per status */}
                            {apt.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
                              >
                                <Phone size={12} weight="fill" /> Xác nhận
                              </button>
                            )}
                            {apt.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleStatusChange(apt.id, "CHECKED_IN")}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                              >
                                <UserCheck size={12} weight="fill" /> Check-in
                              </button>
                            )}
                            {apt.status === "CHECKED_IN" && (
                              <button
                                onClick={() => handleStatusChange(apt.id, "IN_PROGRESS")}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand-dark shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
                              >
                                <BellSimpleRinging size={12} /> Nhắc BS
                              </button>
                            )}
                            {apt.status === "COMPLETED" && apt.invoicePending && (
                              <Link
                                href="/receptionist/billing"
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                              >
                                <Receipt size={12} weight="fill" /> Thu tiền
                              </Link>
                            )}

                            {/* 3-dot menu */}
                            <ActionMenu apt={apt} onStatusChange={handleStatusChange} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Hiển thị{" "}
                <span className="font-bold text-slate-900">
                  {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                / <span className="font-bold text-slate-900">{filtered.length}</span> lịch hẹn
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900 disabled:opacity-40 active:scale-[0.98]"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-colors active:scale-[0.98]",
                      page === n
                        ? "border-brand bg-brand text-white shadow-sm"
                        : "border-border bg-white text-muted-foreground hover:bg-muted hover:text-slate-900"
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900 disabled:opacity-40 active:scale-[0.98]"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
