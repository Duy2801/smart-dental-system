"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import {
  UserPlus,
  MagnifyingGlass,
  Funnel,
  Phone,
  Warning,
  WarningCircle,
  CalendarPlus,
  Eye,
  PencilSimple,
  DotsThree,
  CaretLeft,
  CaretRight,
  Users,
  X,
  ClockCounterClockwise,
  ArrowClockwise,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string | null;
  gender?: "MALE" | "FEMALE" | string | null;
  allergies?: string[];
  medicalHistory?: string | null;
  lastVisit?: string | null;
  totalVisits?: number;
}

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
  "bg-rose-100 text-rose-800",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDob(dob?: string | null): string {
  if (!dob) return "--";
  const m = String(dob).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    return new Date(dob).toLocaleDateString("vi-VN", { timeZone: "UTC" });
  } catch {
    return dob;
  }
}

function formatLastVisit(v?: string | null): string {
  if (!v) return "Chưa khám";
  try {
    const d = new Date(v);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Hôm nay";
    return d.toLocaleDateString("vi-VN");
  } catch {
    return v;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function RowSkeleton() {
  return (
    <tr>
      {[180, 130, 160, 100, 70, 90].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse bg-slate-200" style={{ width: w }} />
          {i === 0 && <div className="h-3 w-20 rounded animate-pulse bg-slate-100 mt-2" />}
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Dropdown menu — click-based
// ---------------------------------------------------------------------------

function PatientMenu({ patient }: { patient: Patient }) {
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
      >
        <DotsThree size={18} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-white py-1.5 shadow-xl">
          <Link
            href={`/receptionist/patients/${patient.id}`}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-brand-dark"
            onClick={() => setOpen(false)}
          >
            <Eye size={13} /> Xem hồ sơ
          </Link>
          <Link
            href={`/receptionist/appointments/new?patientId=${patient.id}`}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-brand-dark"
            onClick={() => setOpen(false)}
          >
            <CalendarPlus size={13} /> Tạo lịch hẹn
          </Link>
          <div className="my-1 mx-2 h-px bg-slate-100" />
          <Link
            href={`/receptionist/patients/${patient.id}?tab=edit`}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-brand-dark"
            onClick={() => setOpen(false)}
          >
            <PencilSimple size={13} /> Chỉnh sửa
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter panel — click-based
// ---------------------------------------------------------------------------

type AlertFilter = "" | "HAS_ALERT" | "NO_ALERT";
type VisitFilter = "" | "NEW" | "RETURNING";

function FilterPanel({
  open,
  onClose,
  alertFilter,
  setAlertFilter,
  visitFilter,
  setVisitFilter,
  onApply,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  alertFilter: AlertFilter;
  setAlertFilter: (v: AlertFilter) => void;
  visitFilter: VisitFilter;
  setVisitFilter: (v: VisitFilter) => void;
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
      className="absolute right-0 top-full z-40 mt-2 w-60 rounded-2xl border border-border bg-white p-4 shadow-xl"
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
            Cảnh báo y tế
          </label>
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Tất cả</option>
            <option value="HAS_ALERT">Có cảnh báo dị ứng</option>
            <option value="NO_ALERT">Không có cảnh báo</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Loại bệnh nhân
          </label>
          <select
            value={visitFilter}
            onChange={(e) => setVisitFilter(e.target.value as VisitFilter)}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Tất cả</option>
            <option value="NEW">Khách mới (chưa khám)</option>
            <option value="RETURNING">Tái khám</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={() => { onReset(); onClose(); }}
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

export default function ReceptionistPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  // filter state (editing)
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("");
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("");
  // filter state (applied)
  const [appliedAlert, setAppliedAlert] = useState<AlertFilter>("");
  const [appliedVisit, setAppliedVisit] = useState<VisitFilter>("");

  const fetchPatients = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      const q = query.trim();
      if (q) params.set("search", q);
      const res = await apiClient.get(`/patients?${params}`);
      const list = Array.isArray(res.data) ? res.data : [];
      setPatients(
        list.map(
          (p: {
            id: string;
            patientCode?: string;
            fullName: string;
            phone?: string | null;
            dateOfBirth?: string | null;
            gender?: "MALE" | "FEMALE" | null;
            allergies?: string[];
            medicalHistory?: string | null;
            lastVisit?: string | null;
            lastVisitDate?: string | null;
            totalVisits?: number;
          }) => ({
            id: p.id,
            patientCode: p.patientCode ?? p.id.slice(0, 8).toUpperCase(),
            fullName: p.fullName,
            phone: p.phone ?? "",
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            allergies: p.allergies ?? [],
            medicalHistory: p.medicalHistory,
            lastVisit: p.lastVisit ?? p.lastVisitDate ?? null,
            totalVisits: p.totalVisits ?? 0,
          }),
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tải được danh sách bệnh nhân từ máy chủ."));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPatients(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, fetchPatients]);

  // filter + paginate
  const filtered = patients.filter((p) => {
    if (appliedAlert === "HAS_ALERT" && (!p.allergies || p.allergies.length === 0)) return false;
    if (appliedAlert === "NO_ALERT" && p.allergies && p.allergies.length > 0) return false;
    if (appliedVisit === "NEW" && (p.totalVisits ?? 0) > 0) return false;
    if (appliedVisit === "RETURNING" && (p.totalVisits ?? 0) === 0) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterCount = [appliedAlert, appliedVisit].filter(Boolean).length;
  const searchQuery = search.trim();
  const isEmptyDueToFilter =
    filterCount > 0 && filtered.length === 0 && patients.length > 0;
  const isEmptyDueToSearch =
    searchQuery.length > 0 && filtered.length === 0 && patients.length === 0 && !loading;

  return (
    <>
      <Header
        title="Bệnh nhân"
        description="Tra cứu hồ sơ và thông tin y tế của khách hàng."
      >
        <Link
          href="/receptionist/patients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
        >
          <UserPlus weight="bold" size={16} />
          Thêm bệnh nhân
        </Link>
      </Header>

      <div className="bg-muted p-6 space-y-5">

        {/* ── TOOLBAR ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1" style={{ maxWidth: 420 }}>
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tên, SĐT, mã bệnh nhân..."
              className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => void fetchPatients(search)}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-muted disabled:opacity-50 active:scale-[0.98]"
            title="Làm mới"
          >
            <ArrowClockwise size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>

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
              alertFilter={alertFilter}
              setAlertFilter={setAlertFilter}
              visitFilter={visitFilter}
              setVisitFilter={setVisitFilter}
              onApply={() => {
                setAppliedAlert(alertFilter);
                setAppliedVisit(visitFilter);
                setPage(1);
              }}
              onReset={() => {
                setAlertFilter("");
                setVisitFilter("");
                setAppliedAlert("");
                setAppliedVisit("");
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <div className="flex items-center gap-2 min-w-0">
              <Warning weight="fill" size={16} className="shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void fetchPatients(search)}
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
            >
              <ArrowClockwise size={14} />
              Thử lại
            </button>
          </div>
        )}

        {/* ── TABLE CARD ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white shadow-sm">

          {/* Sub-header */}
          <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-brand" />
              <span className="text-sm font-semibold text-brand-dark">Danh sách bệnh nhân</span>
            </div>
            {!loading && (
              <span className="text-xs font-medium text-muted-foreground">
                {filtered.length} bệnh nhân
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-border bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Bệnh nhân</th>
                  <th className="px-5 py-3">Liên hệ</th>
                  <th className="px-5 py-3">Cảnh báo dị ứng</th>
                  <th className="px-5 py-3">Lần khám cuối</th>
                  <th className="px-5 py-3 text-center">Số lần khám</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
                ) : isEmptyDueToFilter ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                        <Funnel size={36} className="text-slate-300" />
                        <p className="text-sm font-medium">Không có bệnh nhân phù hợp bộ lọc</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAlertFilter("");
                            setVisitFilter("");
                            setAppliedAlert("");
                            setAppliedVisit("");
                            setPage(1);
                          }}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : isEmptyDueToSearch ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                        <MagnifyingGlass size={36} className="text-slate-300" />
                        <p className="text-sm font-medium">Không tìm thấy bệnh nhân phù hợp</p>
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          Xóa tìm kiếm
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                        <Users size={36} className="text-slate-300" />
                        <p className="text-sm font-medium">Không tìm thấy bệnh nhân nào</p>
                        <Link
                          href="/receptionist/patients/new"
                          className="text-xs font-bold text-brand hover:text-brand-dark hover:underline"
                        >
                          + Thêm bệnh nhân mới
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((patient) => {
                    const name = patient.fullName;
                    const initials = getInitials(name);
                    const avatarColor = getAvatarColor(name);
                    const hasAllergy = (patient.allergies?.length ?? 0) > 0;
                    const lastVisitStr = formatLastVisit(patient.lastVisit);
                    const isNew = (patient.totalVisits ?? 0) === 0;
                    const isToday = lastVisitStr === "Hôm nay";

                    return (
                      <tr
                        key={patient.id}
                        className="group cursor-pointer transition-colors hover:bg-muted"
                        onClick={() => router.push(`/receptionist/patients/${patient.id}`)}
                      >
                        {/* Patient */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                avatarColor
                              )}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{name}</span>
                                {isNew && (
                                  <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand ring-1 ring-inset ring-brand/20">
                                    Khách mới
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="font-mono">{patient.patientCode}</span>
                                {patient.gender &&
                                  patient.gender !== "UNKNOWN" && (
                                  <span className="border-l border-border pl-2">
                                    {patient.gender === "MALE"
                                      ? "Nam"
                                      : patient.gender === "FEMALE"
                                        ? "Nữ"
                                        : patient.gender}
                                    {patient.dateOfBirth &&
                                      ` • ${formatDob(patient.dateOfBirth)}`}
                                  </span>
                                )}
                                {(!patient.gender ||
                                  patient.gender === "UNKNOWN") &&
                                  patient.dateOfBirth && (
                                  <span className="border-l border-border pl-2">
                                    {formatDob(patient.dateOfBirth)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Phone size={13} className="text-muted-foreground shrink-0" />
                            <span className="font-mono font-medium">{patient.phone}</span>
                          </div>
                        </td>

                        {/* Allergies */}
                        <td className="px-5 py-3.5 whitespace-normal max-w-55">
                          {hasAllergy ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.allergies!.map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 ring-1 ring-inset ring-red-600/20"
                                >
                                  <WarningCircle size={10} weight="fill" />
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">Không có</span>
                          )}
                        </td>

                        {/* Last visit */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <ClockCounterClockwise
                              size={13}
                              className={cn(
                                isToday ? "text-emerald-500" : "text-muted-foreground"
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isToday
                                  ? "text-emerald-700"
                                  : lastVisitStr === "Chưa khám"
                                  ? "text-muted-foreground italic"
                                  : "text-slate-700"
                              )}
                            >
                              {lastVisitStr}
                            </span>
                          </div>
                        </td>

                        {/* Total visits */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {patient.totalVisits ?? 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-5 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative z-10 flex items-center justify-end gap-2">
                            <Link
                              href={`/receptionist/appointments/new?patientId=${patient.id}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-brand hover:text-brand active:scale-[0.98]"
                              title="Tạo lịch hẹn"
                            >
                              <CalendarPlus size={13} />
                              Lịch hẹn
                            </Link>
                            <PatientMenu patient={patient} />
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
                /{" "}
                <span className="font-bold text-slate-900">{filtered.length}</span> bệnh nhân
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-slate-900 disabled:opacity-40 active:scale-[0.98]"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | "...")[]>((acc, n, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === "number" && (n as number) - (arr[i - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-colors active:scale-[0.98]",
                          page === item
                            ? "border-brand bg-brand text-white shadow-sm"
                            : "border-border bg-white text-muted-foreground hover:bg-muted hover:text-slate-900"
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
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
