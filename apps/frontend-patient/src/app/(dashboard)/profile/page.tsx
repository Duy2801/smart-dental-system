"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { apiRefresh } from "@/components/auth/api";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";
import { DashboardLogoutButton } from "@/components/dashboard/common/DashboardLogoutButton";
import { apiGetPatientProfile } from "@/components/dashboard/profile/api";
import { PatientProfileEditor } from "@/components/dashboard/profile/components/PatientProfileEditor";
import type { PatientProfileUser } from "@/components/dashboard/profile/types";
import {
  login,
  logout,
  updateAccessToken,
  useAppDispatch,
  useAppSelector,
} from "@/providers";

const genderLabels: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nu",
  OTHER: "Khac",
  UNKNOWN: "Chua cap nhat",
};

function getInitials(name?: string) {
  return (name || "BN")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "Chua cap nhat";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chua cap nhat";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function EmptyAuthState() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-[#0058bc] via-[#0863c5] to-cyan-500 px-6 py-8 text-white sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              Ho so benh nhan
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">
              Ban chua dang nhap
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-blue-50/90">
              Dang nhap de xem ho so ca nhan, lich hen gan day, lich su dieu tri
              va thong tin lien he.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/auth/login?redirect=/profile"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#0058bc] transition hover:bg-blue-50"
              >
                Dang nhap
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Tao tai khoan
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:p-8">
            <QuickInfo label="Kieu giao dien" value="Dashboard nhieu khu vuc" />
            <QuickInfo label="Ho tro" value="Xem, sua, mo rong sau nay" />
            <QuickInfo label="Tinh huong" value="De doc, de thao tac, de them muc moi" />
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function InfoTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4",
        accent
          ? "border-blue-100 bg-blue-50/60"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function Pill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="max-w-[65%] truncate text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user: storedUser, accessToken } = useAppSelector(
    (state) => state.login,
  );
  const profileQuery = useQuery({
    queryKey: ["patient", "profile"],
    queryFn: async () => {
      try {
        let sessionAccessToken = accessToken;

        if (!sessionAccessToken) {
          const refreshResponse = await apiRefresh();
          sessionAccessToken = refreshResponse.data.accessToken;
          dispatch(updateAccessToken(sessionAccessToken));
        }

        const meResponse = await apiGetPatientProfile();
        dispatch(
          login({
            user: meResponse.data,
            accessToken: sessionAccessToken,
          }),
        );

        return meResponse.data;
      } catch (error) {
        dispatch(logout());
        throw error;
      }
    },
    retry: false,
  });

  const profile = profileQuery.data ?? (storedUser as PatientProfileUser | null);
  const loading = profileQuery.isLoading && !profile;
  const patient = profile?.patientProfile ?? null;
  const initials = useMemo(() => getInitials(profile?.fullName), [profile]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="h-[560px] animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  if (!profile) return <EmptyAuthState />;

  const quickStats = [
    {
      label: "Lien he",
      value: profile.phone || "Chua cap nhat",
    },
    {
      label: "Lich hen gan nhat",
      value: profile.lastAppointment ? formatDate(profile.lastAppointment.scheduledAt) : "Chua co",
    },
    {
      label: "Ma benh nhan",
      value: patient?.patientCode || "Chua co ho so",
    },
  ];

  const personalRows = [
    ["Ho va ten", profile.fullName],
    ["So dien thoai", profile.phone || "Chua cap nhat"],
    ["Email", profile.email],
    ["Ngay sinh", formatDate(patient?.dateOfBirth)],
    ["Dia chi", patient?.address || "Chua cap nhat"],
    ["Gioi tinh", genderLabels[patient?.gender || "UNKNOWN"]],
  ];

  const healthRows = [
    ["Tien su y khoa", patient?.medicalHistory || "Chua cap nhat"],
    ["Di ung / luu y", "Co the mo rong thanh nhom rieng khi can"],
    ["Email da xac thuc", profile.emailVerified ? "Da xac thuc" : "Chua xac thuc"],
  ];

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-gradient-to-br from-[#0058bc] via-[#0863c5] to-cyan-500 px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 text-xl font-extrabold backdrop-blur">
                  {initials}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                    Ho so benh nhan
                  </p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">
                    {profile.fullName}
                  </h1>
                  <p className="mt-2 text-sm text-blue-100">
                    Ma benh nhan: {patient?.patientCode || "Chua co ho so"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <PatientProfileEditor profile={profile} />
                <DashboardLogoutButton />
              </div>
            </div>
          </div>

          <div className="grid gap-3 bg-slate-50 p-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t border-slate-100 bg-slate-50 p-4 sm:p-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <SectionCard
              title="Tong quan"
              description="Cac thong tin quan trong duoc gom theo nhom de de doc hon."
              action={
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/appointment"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                  >
                    <DashboardIcon name="calendar" className="h-4 w-4" />
                    Lich hen
                  </Link>
                  <Link
                    href="/records"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                  >
                    <DashboardIcon name="document" className="h-4 w-4" />
                    Ho so dieu tri
                  </Link>
                </div>
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile
                  label="Trang thai tai khoan"
                  value={profile.status}
                  accent
                />
                <InfoTile
                  label="Email xac thuc"
                  value={profile.emailVerified ? "Da xac thuc" : "Chua xac thuc"}
                />
                <InfoTile
                  label="Ngay tao"
                  value={formatDate(profile.createdAt)}
                />
              </div>
            </SectionCard>

            <SectionCard title="Thong tin ca nhan" description="Bo cuc 2 cot, de xem nhanh va de sua sau nay.">
              <div className="grid gap-3 sm:grid-cols-2">
                {personalRows.map(([label, value], index) => (
                  <InfoTile
                    key={label}
                    label={label}
                    value={value}
                    accent={index < 2}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Suc khoe va luu y"
              description="Khu vuc nay co the mo rong them cho di ung, bao hiem, ghi chu lam sang."
            >
              <div className="grid gap-3">
                {healthRows.map(([label, value]) => (
                  <Pill key={label} label={label} value={value} />
                ))}
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-6">
            <SectionCard
              title="Thao tac nhanh"
              description="Cac hanh dong hay dung duoc dat o cot rieng de thao tac nhanh hon."
            >
              <div className="grid gap-3">
                <PatientProfileEditor profile={profile} />
                <Link
                  href="/appointment"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                >
                  <DashboardIcon name="appointment" className="h-4 w-4" />
                  Dat lich hen
                </Link>
                <Link
                  href="/records"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                >
                  <DashboardIcon name="heart" className="h-4 w-4" />
                  Xem ho so dieu tri
                </Link>
                <Link
                  href="/auth/forgot-password"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                >
                  <DashboardIcon name="shield" className="h-4 w-4" />
                  Doi mat khau
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Lich hen gan nhat"
              description="Khu vuc mo rong cho cac thong tin lich hen va trang thai."
            >
              {profile.lastAppointment ? (
                <div className="space-y-3">
                  <InfoTile
                    label="Thoi gian"
                    value={formatDate(profile.lastAppointment.scheduledAt)}
                    accent
                  />
                  <InfoTile
                    label="Dich vu"
                    value={profile.lastAppointment.serviceName}
                  />
                  <InfoTile
                    label="Bac si"
                    value={profile.lastAppointment.doctorName}
                  />
                  <InfoTile
                    label="Trang thai"
                    value={profile.lastAppointment.status}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Chua co lich hen gan day.
                </div>
              )}
            </SectionCard>
          </aside>
        </div>
      </section>
    </main>
  );
}
