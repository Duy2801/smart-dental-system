"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiMe, apiRefresh, type AuthUser } from "@/components/auth/api";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";
import { DashboardLogoutButton } from "@/components/dashboard/common/DashboardLogoutButton";
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
    <main className="mx-auto w-full max-w-[960px] px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-[#0863c5]">
          <DashboardIcon name="user" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
          Bạn chưa đăng nhập
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Đăng nhập để xem hồ sơ bệnh nhân, mã bệnh nhân, thông tin liên hệ và
          lịch khám gần nhất của bạn.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/login?redirect=/profile"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#0756aa]"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5]"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user: storedUser, accessToken } = useAppSelector(
    (state) => state.login,
  );
  const [message, setMessage] = useState<string | null>(null);

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

        const meResponse = await apiMe();
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

  const profile = profileQuery.data ?? (storedUser as AuthUser | null);
  const loading = profileQuery.isLoading && !profile;

  const patient = profile?.patientProfile ?? null;
  const initials = useMemo(() => getInitials(profile?.fullName), [profile]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" />
      </main>
    );
  }

  if (!profile) return <EmptyAuthState />;

  const personalItems = [
    ["Số điện thoại", profile.phone || "Chưa cập nhật"],
    ["Email", profile.email],
    ["Ngày sinh", formatDate(patient?.dateOfBirth)],
    ["Địa chỉ", patient?.address || "Chưa cập nhật"],
  ];

  const healthItems = [
    ["Giới tính", genderLabels[patient?.gender || "UNKNOWN"]],
    ["Tiền sử y khoa", patient?.medicalHistory || "Chưa cập nhật"],
    ["Lần khám gần nhất", formatDate(profile.lastAppointment?.scheduledAt)],
  ];

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0863c5] to-cyan-500 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/15 text-xl font-extrabold backdrop-blur">
                {initials}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-100">
                  Hồ sơ bệnh nhân
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">
                  {profile.fullName}
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Mã bệnh nhân: {patient?.patientCode || "Chưa có hồ sơ"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() =>
                  setMessage(
                    "Chức năng cập nhật hồ sơ sẽ dùng dữ liệu thật ở bước tiếp theo.",
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#0863c5] shadow-sm transition hover:bg-blue-50"
              >
                <DashboardIcon name="document" className="h-4 w-4" />
                Cập nhật hồ sơ
              </button>
              <DashboardLogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Thông tin cá nhân
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {personalItems.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {patient ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Liên hệ khẩn cấp
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {patient.emergencyContactName || "Chưa cập nhật tên"}
                  </p>
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {patient.emergencyContactPhone ||
                      "Chưa cập nhật số điện thoại"}
                  </p>
                </div>
              </div>
            ) : null}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700"
              >
                {message}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <DashboardIcon name="heart" className="h-4 w-4 text-[#0863c5]" />
              Tóm tắt sức khỏe
            </h2>
            <div className="mt-4 space-y-3">
              {healthItems.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <strong className="max-w-[180px] text-right text-slate-900">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
