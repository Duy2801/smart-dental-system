"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { apiRefresh } from "@/features/auth/api";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { DashboardLogoutButton } from "@/features/dashboard/common/DashboardLogoutButton";
import { LoginRequiredPanel } from "@/features/dashboard/common/LoginRequiredPanel";
import { PatientPageSkeleton } from "@/features/dashboard/common/PatientSkeleton";
import { apiGetPatientProfile } from "@/features/dashboard/profile/api";
import { PatientProfileEditor } from "@/features/dashboard/profile/components/PatientProfileEditor";
import type { PatientProfileUser } from "@/features/dashboard/profile/types";
import {
  login,
  logout,
  updateAccessToken,
  useAppDispatch,
  useAppSelector,
} from "@/providers";

const genderLabels: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
  UNKNOWN: "Chưa cập nhật",
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
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function EmptyAuthState() {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase text-[#0863c5]">Hồ sơ tài khoản</p>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
          Bạn chưa đăng nhập
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Đăng nhập để xem và cập nhật thông tin cá nhân, hồ sơ y tế và lịch hẹn gần nhất.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/login?redirect=/profile"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-5 text-sm font-bold text-white transition hover:bg-[#0753a8]"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-bold leading-6 text-slate-900">
        {value || "Chưa cập nhật"}
      </span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#0863c5]">
          <DashboardIcon name={icon} className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Đang hoạt động" : "Tạm khóa"}
    </span>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user: storedUser, accessToken } = useAppSelector((state) => state.login);

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
  const initials = useMemo(() => getInitials(profile?.fullName), [profile?.fullName]);

  if (loading) return <PatientPageSkeleton />;
  if (!profile) {
    return (
      <LoginRequiredPanel
        title="Xem hồ sơ tài khoản"
        description="Đăng nhập để xem và cập nhật thông tin cá nhân, hồ sơ y tế, lịch hẹn gần nhất và các dữ liệu riêng tư của bạn."
        loginLabel="Đăng nhập để xem hồ sơ"
        redirectTo="/profile"
        secondaryHref="/service"
        secondaryLabel="Xem dịch vụ"
        icon="user"
      />
    );
  }

  const isActive = profile.status?.toUpperCase() === "ACTIVE";
  const accountCode = patient?.patientCode ?? "Chưa có mã bệnh nhân";

  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Link href="/home" className="hover:text-[#0863c5]">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800">Tài khoản</span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#0863c5] text-2xl font-black text-white shadow-sm sm:h-20 sm:w-20">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-black text-slate-950 sm:text-3xl">
                    {profile.fullName}
                  </h1>
                  <StatusBadge active={isActive} />
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {accountCode}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Thành viên từ {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <PatientProfileEditor />
              <DashboardLogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-0 border-t border-slate-100 sm:grid-cols-3">
          <QuickStat label="Số điện thoại" value={profile.phone || "Chưa cập nhật"} />
          <QuickStat label="Email" value={profile.email} />
          <QuickStat
            label="Xác thực email"
            value={profile.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <SectionCard icon="user" title="Thông tin cá nhân">
            <InfoRow label="Họ và tên" value={profile.fullName} />
            <InfoRow label="Ngày sinh" value={formatDate(patient?.dateOfBirth)} />
            <InfoRow label="Giới tính" value={genderLabels[patient?.gender || "UNKNOWN"]} />
            <InfoRow label="Địa chỉ" value={patient?.address} />
          </SectionCard>

          <SectionCard icon="heart" title="Thông tin y tế">
            <InfoRow label="Tiền sử y khoa" value={patient?.medicalHistory} />
            <InfoRow label="Liên hệ khẩn cấp" value={patient?.emergencyContactName} />
            <InfoRow label="SĐT khẩn cấp" value={patient?.emergencyContactPhone} />
          </SectionCard>
        </div>

        <aside className="space-y-5">
          <SectionCard icon="calendar" title="Lịch hẹn gần nhất">
            {profile.lastAppointment ? (
              <>
                <InfoRow label="Thời gian" value={formatDate(profile.lastAppointment.scheduledAt)} />
                <InfoRow label="Dịch vụ" value={profile.lastAppointment.serviceName} />
                <InfoRow label="Bác sĩ" value={profile.lastAppointment.doctorName} />
                <InfoRow label="Trạng thái" value={profile.lastAppointment.status} />
              </>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-blue-100 bg-blue-50/50 p-4 text-sm leading-6 text-slate-500">
                Bạn chưa có lịch hẹn gần đây.
              </p>
            )}
            <Link
              href="/appointment"
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-4 text-sm font-bold text-white transition hover:bg-[#0753a8]"
            >
              <DashboardIcon name="calendar" className="h-4 w-4" />
              Quản lý lịch hẹn
            </Link>
          </SectionCard>

          <SectionCard icon="shield" title="Tác vụ nhanh">
            <div className="mt-3 grid gap-3">
              <QuickLink href="/records" icon="document" label="Hồ sơ điều trị" />
              <QuickLink href="/auth/forgot-password" icon="shield" label="Đổi mật khẩu" />
            </div>
          </SectionCard>
        </aside>
      </div>
    </main>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5]"
    >
      <DashboardIcon name={icon} className="h-4 w-4" />
      {label}
    </Link>
  );
}
