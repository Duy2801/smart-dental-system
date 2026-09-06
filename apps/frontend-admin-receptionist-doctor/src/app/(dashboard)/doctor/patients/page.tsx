"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import {
  MagnifyingGlass,
  ArrowRight,
  Users,
  SpinnerGap,
  Warning,
  Stethoscope,
  CalendarCheck,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";
import {
  genderLabel,
  getDoctorIdFromCookie,
} from "@/src/lib/doctor/session";
import {
  cleanSearchText,
  getPatientListStats,
  paginatePatients,
} from "./patient-list";

const PAGE_SIZE = 10;

type Patient = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  lastVisitDate: string | null;
  lastService: string;
  lastStatus: string;
  totalVisits: number;
  totalAppointments?: number;
  medicalHistory: string | null;
  hasActiveTreatmentPlan: boolean;
  upcomingVisitsInNext7Days: number;
};

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  const doctorId = getDoctorIdFromCookie();
  const sessionError = doctorId
    ? null
    : "Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.";

  useEffect(() => {
    if (!doctorId) {
      return;
    }
    apiClient
      .get<Patient[]>(`/patients?doctorId=${doctorId}`)
      .then((res) => setPatients(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Không thể tải danh sách bệnh nhân."))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const filtered = useMemo(() => {
    const raw = search.trim();
    if (!raw) return patients;
    const qNorm = cleanSearchText(raw);
    return patients.filter(
      (p) =>
        cleanSearchText(p.fullName).includes(qNorm) ||
        cleanSearchText(p.patientCode).includes(qNorm) ||
        (p.phone ?? "").includes(raw) ||
        (p.email ?? "").toLowerCase().includes(qNorm),
    );
  }, [patients, search]);

  const stats = useMemo(() => getPatientListStats(patients), [patients]);
  const paginated = useMemo(
    () => paginatePatients(filtered, requestedPage, PAGE_SIZE),
    [filtered, requestedPage],
  );

  return (
    <>
      <Header
        title="Bệnh nhân của tôi"
        description="Danh sách bệnh nhân có lịch hẹn hoặc đã từng khám với bạn"
      />

      <div className="space-y-6 p-6 md:p-8">
        {/* 1. TOP 3 STATS SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Users size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng số bệnh nhân</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-2xl font-extrabold text-brand-dark">{stats.total}</span>
                <span className="text-xs text-muted-foreground font-medium">người</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Stethoscope size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đang theo dõi điều trị</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-2xl font-extrabold text-blue-700">{stats.active}</span>
                <span className="text-xs text-muted-foreground font-medium">bệnh nhân</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CalendarCheck size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Lịch hẹn 7 ngày tới</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-2xl font-extrabold text-emerald-700">{stats.upcoming}</span>
                <span className="text-xs text-muted-foreground font-medium">lượt khám</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SEARCH & LIST TABLE */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Tìm theo tên, mã BN, SĐT, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setRequestedPage(1);
              }}
              className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          {!loading && !error && (
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {filtered.length}/{patients.length} bệnh nhân
            </span>
          )}
        </div>

        {(sessionError || error) && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {sessionError || error}
          </div>
        )}

        {!sessionError && !error && (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5">Mã BN</th>
                    <th className="px-5 py-3.5">Họ tên</th>
                    <th className="px-5 py-3.5">Giới / Tuổi</th>
                    <th className="px-5 py-3.5">Liên hệ</th>
                    <th className="px-5 py-3.5">Lần khám gần nhất</th>
                    <th className="px-5 py-3.5">Dịch vụ gần nhất</th>
                    <th className="px-5 py-3.5 text-center">Đã khám / Lượt hẹn</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {doctorId && loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <SpinnerGap
                          size={28}
                          className="mx-auto animate-spin text-brand"
                        />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Users
                            size={40}
                            className="text-slate-300"
                            weight="duotone"
                          />
                          <p className="text-sm">
                            {search.trim()
                              ? "Không tìm thấy bệnh nhân phù hợp"
                              : "Chưa có bệnh nhân nào"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.items.map((pt) => (
                      <tr
                        key={pt.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                            {pt.patientCode}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/doctor/patients/${pt.id}`}
                            className="font-semibold text-slate-900 transition-colors hover:text-brand cursor-pointer"
                          >
                            {pt.fullName}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          {genderLabel(pt.gender)}
                          {pt.age != null && pt.age > 0 ? `, ${pt.age}T` : ""}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">{pt.phone ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {pt.email ?? "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {pt.lastVisitDate ? (
                            <div className="flex flex-col items-start gap-1.5">
                              <span className="font-mono text-xs text-slate-700">
                                {new Date(pt.lastVisitDate).toLocaleDateString("vi-VN")}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                Đã hoàn thành
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs">Chưa có lần khám hoàn thành</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {pt.lastVisitDate ? pt.lastService : "—"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                                pt.totalVisits > 0
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {pt.totalVisits > 0 ? `${pt.totalVisits} đã khám` : "Chưa khám"}
                            </span>
                            {typeof pt.totalAppointments === "number" && pt.totalAppointments > 0 && (
                              <span className="mt-1 text-[11px] font-medium text-muted-foreground">
                                {pt.totalAppointments} lượt hẹn
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <Link
                            href={`/doctor/patients/${pt.id}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand cursor-pointer"
                          >
                            Xem hồ sơ
                            <ArrowRight size={12} className="shrink-0" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <span className="text-xs text-muted-foreground">
                  Trang <span className="font-mono font-bold text-slate-700">{paginated.page}</span>/{paginated.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Trang trước"
                    disabled={paginated.page === 1}
                    onClick={() => setRequestedPage((page) => page - 1)}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-slate-600 transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CaretLeft size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Trang sau"
                    disabled={paginated.page === paginated.totalPages}
                    onClick={() => setRequestedPage((page) => page + 1)}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-slate-600 transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CaretRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
