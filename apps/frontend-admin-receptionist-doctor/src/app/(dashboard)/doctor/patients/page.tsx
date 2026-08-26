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
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import {
  genderLabel,
  getDoctorIdFromCookie,
} from "@/src/lib/doctor/session";

type Patient = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  lastVisitDate: string;
  lastService: string;
  lastStatus: string;
  totalVisits: number;
  medicalHistory: string | null;
};

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const doctorId = getDoctorIdFromCookie();

  useEffect(() => {
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }
    apiClient
      .get<Patient[]>(`/patients?doctorId=${doctorId}`)
      .then((res) => setPatients(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Không thể tải danh sách bệnh nhân."))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.patientCode.toLowerCase().includes(q) ||
        (p.phone ?? "").includes(q) ||
        (p.email ?? "").toLowerCase().includes(q),
    );
  }, [patients, search]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.totalVisits > 1 || Boolean(p.medicalHistory)).length;
    const now = new Date().getTime();
    const recent = patients.filter((p) => {
      if (!p.lastVisitDate) return false;
      const t = new Date(p.lastVisitDate).getTime();
      return now - t <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return { total, active, recent };
  }, [patients]);

  return (
    <>
      <Header
        title="Bệnh nhân của tôi"
        description="Danh sách và hồ sơ theo dõi bệnh nhân đã từng khám với bạn"
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
              <p className="text-xs font-medium text-muted-foreground">Đến khám trong tuần</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-2xl font-extrabold text-emerald-700">{stats.recent}</span>
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          {!loading && !error && (
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {filtered.length}/{patients.length} bệnh nhân
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {!error && (
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
                    <th className="px-5 py-3.5 text-center">Số lần khám</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
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
                    filtered.map((pt) => (
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
                          <p className="font-semibold text-slate-900">
                            {pt.fullName}
                          </p>
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
                          {new Date(pt.lastVisitDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {pt.lastService}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                            {pt.totalVisits}
                          </span>
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
          </div>
        )}
      </div>
    </>
  );
}
