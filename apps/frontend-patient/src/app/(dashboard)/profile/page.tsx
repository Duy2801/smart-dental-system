"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { apiRefresh } from "@/features/auth/api";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { DashboardLogoutButton } from "@/features/dashboard/common/DashboardLogoutButton";
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
        <p className="text-xs font-bold uppercase text-[#0058bc]">Hồ sơ bệnh nhân</p>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Bạn chưa đăng nhập</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Đăng nhập để xem và cập nhật thông tin cá nhân, hồ sơ y tế và lịch hẹn gần nhất.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/login?redirect=/profile"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0058bc] px-5 text-sm font-bold text-white transition hover:bg-[#044f9f]"
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

function Field({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-bold leading-6 text-slate-900">
        {value || "Chưa cập nhật"}
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
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

  if (loading) {
    return <PatientPageSkeleton />;
  }

  if (!profile) return <EmptyAuthState />;

  const isActive = profile.status?.toUpperCase() === "ACTIVE";

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#0058bc] text-xl font-extrabold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold text-slate-900">
                  {profile.fullName}
                </h1>
                <StatusBadge active={isActive} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {patient?.patientCode ? `Mã bệnh nhân: ${patient.patientCode}` : "Chưa có mã bệnh nhân"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <PatientProfileEditor profile={profile} />
            <DashboardLogoutButton />
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <DashboardIcon name="user" className="h-5 w-5 text-[#0058bc]" />
                <h2 className="text-base font-extrabold text-slate-900">Thông tin cá nhân</h2>
              </div>
              <div className="mt-3 grid rounded-2xl border border-slate-200 px-4 sm:grid-cols-2 sm:px-5">
                <Field label="Họ và tên" value={profile.fullName} />
                <Field label="Số điện thoại" value={profile.phone} />
                <Field label="Email" value={profile.email} />
                <Field label="Email xác thực" value={profile.emailVerified ? "Đã xác thực" : "Chưa xác thực"} />
                <Field label="Ngày sinh" value={formatDate(patient?.dateOfBirth)} />
                <Field label="Giới tính" value={genderLabels[patient?.gender || "UNKNOWN"]} />
                <Field label="Địa chỉ" value={patient?.address} />
                <Field label="Ngày tạo tài khoản" value={formatDate(profile.createdAt)} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <DashboardIcon name="heart" className="h-5 w-5 text-[#0058bc]" />
                <h2 className="text-base font-extrabold text-slate-900">Thông tin y tế</h2>
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 px-4 sm:px-5">
                <Field label="Tiền sử y khoa" value={patient?.medicalHistory} />
                <Field label="Người liên hệ khẩn cấp" value={patient?.emergencyContactName} />
                <Field label="SĐT khẩn cấp" value={patient?.emergencyContactPhone} />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-center gap-2">
                <DashboardIcon name="appointment" className="h-5 w-5 text-[#0058bc]" />
                <h2 className="text-base font-extrabold text-slate-900">Lịch hẹn gần nhất</h2>
              </div>

              {profile.lastAppointment ? (
                <div className="mt-4 space-y-3 text-sm">
                  <Field label="Thời gian" value={formatDate(profile.lastAppointment.scheduledAt)} />
                  <Field label="Dịch vụ" value={profile.lastAppointment.serviceName} />
                  <Field label="Bác sĩ" value={profile.lastAppointment.doctorName} />
                  <Field label="Trạng thái" value={profile.lastAppointment.status} />
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-blue-200 bg-white/70 p-4 text-sm leading-6 text-slate-500">
                  Bạn chưa có lịch hẹn gần đây.
                </p>
              )}

              <Link
                href="/appointment"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-4 text-sm font-bold text-white transition hover:bg-[#044f9f]"
              >
                <DashboardIcon name="calendar" className="h-4 w-4" />
                Quản lý lịch hẹn
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-base font-extrabold text-slate-900">Thao tác nhanh</h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/records"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                >
                  <DashboardIcon name="document" className="h-4 w-4" />
                  Xem hồ sơ điều trị
                </Link>
                <Link
                  href="/auth/forgot-password"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                >
                  <DashboardIcon name="shield" className="h-4 w-4" />
                  Đổi mật khẩu
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
