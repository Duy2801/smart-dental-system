"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { AppointmentStatusBadge } from "@/src/components/shared/appointment-status-badge";
import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";
import apiClient from "@/src/lib/api/client";
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
  SpinnerGap,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Appointment {
  id: string;
  startTime: string;
  status: AppointmentStatus;
  patient?: { fullName: string; phone: string } | null;
  doctor?: { fullName: string } | null;
  service?: { name: string } | null;
  invoicePending?: boolean;
  notes?: string | null;
}

interface PendingBill {
  id: string;
  patientName: string;
  total: number;
  invoiceId: string;
}

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

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

// ---------------------------------------------------------------------------
// Mock data (dùng khi API chưa sẵn sàng)
// ---------------------------------------------------------------------------

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "AP01",
    startTime: "08:30:00",
    status: "PENDING",
    patient: { fullName: "Nguyễn Văn An", phone: "0901234567" },
    doctor: { fullName: "Trần Sơn" },
    service: { name: "Nhổ răng khôn" },
  },
  {
    id: "AP02",
    startTime: "09:00:00",
    status: "CONFIRMED",
    patient: { fullName: "Lê Hoàng Cường", phone: "0987654321" },
    doctor: { fullName: "Phạm Hà" },
    service: { name: "Tái khám niềng răng" },
  },
  {
    id: "AP03",
    startTime: "10:30:00",
    status: "CHECKED_IN",
    patient: { fullName: "Đỗ Thu Hương", phone: "0977889900" },
    doctor: { fullName: "Lê Hoàng" },
    service: { name: "Khám tổng quát" },
  },
  {
    id: "AP04",
    startTime: "11:00:00",
    status: "IN_PROGRESS",
    patient: { fullName: "Hoàng Minh Quân", phone: "0933445566" },
    doctor: { fullName: "Trần Sơn" },
    service: { name: "Cắm Implant" },
  },
  {
    id: "AP05",
    startTime: "13:00:00",
    status: "COMPLETED",
    patient: { fullName: "Phạm Thị Bích", phone: "0912345678" },
    doctor: { fullName: "Phạm Hà" },
    service: { name: "Tẩy trắng răng" },
    invoicePending: true,
  },
];

const MOCK_BILLS: PendingBill[] = [
  { id: "B01", patientName: "Hoàng Minh Quân", total: 15000000, invoiceId: "INV-001" },
  { id: "B02", patientName: "Phạm Thị Bích", total: 1500000, invoiceId: "INV-002" },
];

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
// Tab config
// ---------------------------------------------------------------------------

type QueueTab = "ALL" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS";

const TABS: { id: QueueTab; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chưa tới" },
  { id: "CONFIRMED", label: "Đã xác nhận" },
  { id: "CHECKED_IN", label: "Đã Check-in" },
  { id: "IN_PROGRESS", label: "Đang khám" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTab>("ALL");
  const [search, setSearch] = useState("");

  // --------------------------------------------------
  // Fetch
  // --------------------------------------------------

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [apptRes] = await Promise.all([
          apiClient.get<{ data: Appointment[] }>(`/appointments?date=${today}`),
        ]);
        setAppointments(apptRes.data ?? []);
      } catch {
        // Dùng mock data khi API chưa sẵn sàng
        setAppointments(MOCK_APPOINTMENTS);
        setPendingBills(MOCK_BILLS);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // --------------------------------------------------
  // Derived stats
  // --------------------------------------------------

  const total = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const checkedInCount = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const billCount = pendingBills.length || appointments.filter((a) => a.status === "COMPLETED" && a.invoicePending).length;

  // --------------------------------------------------
  // Filtered list
  // --------------------------------------------------

  const filtered = appointments.filter((apt) => {
    const matchTab = activeTab === "ALL" || apt.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      apt.patient?.fullName.toLowerCase().includes(q) ||
      apt.patient?.phone.includes(q) ||
      apt.service?.name.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------

  const handleConfirm = async (id: string) => {
    try {
      await apiClient.patch(`/appointments/${id}/confirm`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a))
      );
    } catch {
      // mock
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a))
      );
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await apiClient.patch(`/appointments/${id}/check-in`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CHECKED_IN" } : a))
      );
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CHECKED_IN" } : a))
      );
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

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

      <div className="bg-muted min-h-screen p-6 space-y-6">
        {/* ── STATS ROW ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              {/* Tổng lịch */}
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

              {/* Chờ xác nhận */}
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

              {/* Đã check-in */}
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

              {/* Chờ thu tiền */}
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

        {/* ── ERROR BANNER ───────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <Warning weight="fill" size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── MAIN GRID ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

          {/* ── LIVE QUEUE (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Search bar */}
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tra cứu bệnh nhân (Tên, SĐT, dịch vụ)..."
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Queue card */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              {/* Card header + tabs */}
              <div className="border-b border-border px-5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-brand-dark">Hàng đợi hôm nay</h2>
                  <Link
                    href="/receptionist/appointments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    Xem tất cả <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto">
                  {TABS.map((tab) => {
                    const count =
                      tab.id === "ALL"
                        ? appointments.length
                        : appointments.filter((a) => a.status === tab.id).length;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all -mb-px",
                          activeTab === tab.id
                            ? "border-brand text-brand"
                            : "border-transparent text-muted-foreground hover:text-brand-dark"
                        )}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                              activeTab === tab.id
                                ? "bg-brand text-white"
                                : "bg-slate-100 text-slate-500"
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

              {/* Rows */}
              {loading ? (
                <div className="divide-y divide-border/50">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <QueueRowSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
                  <CalendarBlank size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">Hàng đợi trống hôm nay</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filtered.map((apt) => {
                    const name = apt.patient?.fullName ?? "Khách vãng lai";
                    const initials = getInitials(name);
                    const avatarColor = getAvatarColor(name);

                    return (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted"
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            avatarColor
                          )}
                        >
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-brand-dark truncate">
                              {name}
                            </span>
                            <AppointmentStatusBadge status={apt.status} />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground font-medium">
                            <span className="font-mono">{formatTime(apt.startTime)}</span>
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
                              <span className="text-slate-500">BS. {apt.doctor.fullName}</span>
                            )}
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="shrink-0">
                          {apt.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirm(apt.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
                            >
                              <Phone size={13} weight="fill" />
                              Xác nhận
                            </button>
                          )}
                          {apt.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleCheckIn(apt.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                            >
                              <UserCircleCheck size={13} weight="fill" />
                              Check-in
                            </button>
                          )}
                          {apt.status === "CHECKED_IN" && (
                            <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand-dark shadow-sm transition-all hover:bg-muted active:scale-[0.98]">
                              <BellRinging size={13} />
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── SIDEBAR (1/3) ──────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Quick Actions */}
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

            {/* Pending Bills */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-bold text-slate-900">Phiếu chờ thu</h2>
                {billCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {billCount}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse bg-slate-100" />
                  ))}
                </div>
              ) : pendingBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                  <ReceiptX size={28} className="text-slate-300" />
                  <p className="text-xs font-medium">Không có phiếu chờ thu</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {pendingBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate">{bill.patientName}</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-red-600">
                          {formatVND(bill.total)}
                        </p>
                      </div>
                      <Link
                        href="/receptionist/billing"
                        className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                      >
                        <Receipt size={13} weight="fill" />
                        Thu
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
