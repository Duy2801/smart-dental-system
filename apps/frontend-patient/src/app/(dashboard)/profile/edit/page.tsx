"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRefresh } from "@/features/auth/api";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { LoginRequiredPanel } from "@/features/dashboard/common/LoginRequiredPanel";
import { PatientPageSkeleton } from "@/features/dashboard/common/PatientSkeleton";
import {
  apiGetPatientProfile,
  apiUpdatePatientProfile,
} from "@/features/dashboard/profile/api";
import { PatientProfileForm } from "@/features/dashboard/profile/components/PatientProfileForm";
import type {
  PatientProfileUser,
  ProfileFormState,
} from "@/features/dashboard/profile/types";
import {
  login,
  logout,
  updateAccessToken,
  useAppDispatch,
  useAppSelector,
} from "@/providers";

function splitAllergies(value?: string | null) {
  return (
    value
      ?.replace(/^Di ung:\s*/i, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function buildDefaults(profile?: PatientProfileUser | null): ProfileFormState {
  return {
    fullName: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
    dateOfBirth: profile?.patientProfile?.dateOfBirth?.slice(0, 10) ?? "",
    gender: profile?.patientProfile?.gender ?? "UNKNOWN",
    address: profile?.patientProfile?.address ?? "",
    medicalHistory: profile?.patientProfile?.medicalHistory ?? "",
    allergies: splitAllergies(profile?.patientProfile?.medicalHistory).join(", "),
  };
}

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user: storedUser, accessToken } = useAppSelector((state) => state.login);
  const [saving, setSaving] = useState(false);
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
  const defaults = useMemo(() => buildDefaults(profile), [profile]);
  const [form, setForm] = useState<ProfileFormState>(defaults);

  useEffect(() => {
    setForm(defaults);
  }, [defaults]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await apiUpdatePatientProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        address: form.address.trim() || null,
        medicalHistory: form.medicalHistory.trim() || null,
        allergies: form.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      dispatch(login({ user: response.data, accessToken }));
      queryClient.setQueryData(["patient", "profile"], response.data);
      await queryClient.invalidateQueries({ queryKey: ["patient", "profile"] });
      router.push("/profile");
    } catch {
      setMessage("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (profileQuery.isLoading && !profile) return <PatientPageSkeleton />;

  if (!profile) {
    return (
      <LoginRequiredPanel
        title="Chỉnh sửa hồ sơ"
        description="Đăng nhập để cập nhật thông tin cá nhân, liên hệ và ghi chú y tế trong tài khoản bệnh nhân của bạn."
        loginLabel="Đăng nhập để chỉnh sửa"
        redirectTo="/profile/edit"
        secondaryHref="/profile"
        secondaryLabel="Quay lại hồ sơ"
        icon="document"
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Link href="/home" className="hover:text-[#0863c5]">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/profile" className="hover:text-[#0863c5]">
          Tài khoản
        </Link>
        <span>/</span>
        <span className="text-slate-800">Chỉnh sửa hồ sơ</span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0863c5] text-white shadow-sm">
                <DashboardIcon name="document" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0863c5]">
                  Thông tin tài khoản
                </p>
                <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                  Chỉnh sửa hồ sơ
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Cập nhật thông tin cá nhân, liên hệ và ghi chú y tế cơ bản để phòng khám hỗ trợ chính xác hơn.
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5]"
            >
              Quay lại hồ sơ
            </Link>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {message ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {message}
          </div>
        ) : null}

        <PatientProfileForm form={form} setForm={setForm} />

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            Dữ liệu sẽ được cập nhật ngay sau khi lưu thay đổi.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/profile"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </Link>
            <button
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
