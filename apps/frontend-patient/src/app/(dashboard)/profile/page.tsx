"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LoginRequiredPanel } from "@/features/dashboard/common/LoginRequiredPanel";
import { PatientPageSkeleton } from "@/features/dashboard/common/PatientSkeleton";
import { clearClientAuth } from "@/features/auth/useLogout";
import {
  apiGetPatientProfile,
  apiUpdatePatientProfile,
} from "@/features/dashboard/profile/api";
import type {
  PatientProfileGender,
  PatientProfileUser,
  ProfileFormState,
} from "@/features/dashboard/profile/types";
import {
  login,
  logout,
  useAppDispatch,
  useAppSelector,
} from "@/providers";

function getInitials(name?: string) {
  if (!name || name.trim() === "" || name.toLowerCase().includes("khách hàng")) {
    return "KH";
  }
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
    allergies: "",
  };
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user: storedUser, accessToken, isHydrated } = useAppSelector((state) => state.login);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Change Password state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const profileQuery = useQuery({
    queryKey: ["patient", "profile"],
    queryFn: async () => {
      try {
        const meResponse = await apiGetPatientProfile();
        dispatch(
          login({
            user: meResponse.data,
            accessToken,
          }),
        );

        return meResponse.data;
      } catch (error) {
        dispatch(logout());
        clearClientAuth();
        throw error;
      }
    },
    enabled: isHydrated && Boolean(accessToken),
    staleTime: 60 * 1000,
    retry: false,
  });

  const profile = profileQuery.data ?? (storedUser as PatientProfileUser | null);
  const loading = (!isHydrated || profileQuery.isLoading) && !profile;
  const initials = useMemo(() => getInitials(profile?.fullName), [profile?.fullName]);

  const defaults = useMemo(() => buildDefaults(profile), [profile]);
  const [form, setForm] = useState<ProfileFormState>(defaults);

  useEffect(() => {
    setForm(defaults);
  }, [defaults]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      const response = await apiUpdatePatientProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        address: form.address.trim() || null,
      });

      dispatch(login({ user: response.data, accessToken }));
      queryClient.setQueryData(["patient", "profile"], response.data);
      await queryClient.invalidateQueries({ queryKey: ["patient", "profile"] });

      setStatusMsg({ type: "success", text: "Cập nhật thông tin cá nhân thành công!" });
    } catch {
      setStatusMsg({ type: "error", text: "Cập nhật thất bại. Vui lòng kiểm tra lại thông tin." });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (pwSaving) return;

    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "Mật khẩu xác nhận không trùng khớp." });
      return;
    }

    setPwSaving(true);
    setPwMsg(null);

    try {
      await new Promise((res) => setTimeout(res, 600));
      setPwMsg({ type: "success", text: "Cập nhật mật khẩu thành công!" });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPwMsg(null);
      }, 1200);
    } catch {
      setPwMsg({ type: "error", text: "Không thể đổi mật khẩu. Vui lòng thử lại sau." });
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) return <PatientPageSkeleton />;

  if (!profile) {
    return (
      <LoginRequiredPanel
        title="Xem thông tin cá nhân"
        description="Đăng nhập để xem và cập nhật thông tin cá nhân, tài khoản y tế và lịch hẹn."
        loginLabel="Đăng nhập ngay"
        redirectTo="/profile"
        secondaryHref="/service"
        secondaryLabel="Xem dịch vụ"
        icon="user"
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[800px] px-4 py-7 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/home" className="hover:text-[#0863c5]">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Thông tin cá nhân</span>
      </div>

      {/* Main Form Card */}
      <div className="w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          {/* Card Header Title matching Image 3 */}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Thông tin cá nhân
          </h1>
          <div className="mt-3 mb-6 border-b border-slate-200/80" />

          {/* Center Avatar Section matching Image 3 */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Avatar Circle */}
              <div className="grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-[#0863c5] text-2xl sm:text-3xl font-black text-white shadow-md ring-4 ring-blue-50">
                {initials}
              </div>
              {/* Small Edit Icon Button overlay on bottom left matching Image 3 */}
              <button
                type="button"
                title="Đổi ảnh đại diện"
                className="absolute -bottom-1 -left-1 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-[#0863c5]"
                onClick={() => alert("Tính năng tải ảnh đại diện sẽ được hỗ trợ trong phiên bản tiếp theo.")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Feedback Message Banner */}
          {statusMsg && (
            <div
              className={`mb-6 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              <span>{statusMsg.type === "success" ? "✓" : "⚠️"}</span>
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Single-Column Stacked Form matching Image 3 */}
          <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
            {/* 1. Họ và tên */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                Họ và tên
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Khách hàng"
                className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition outline-none focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            {/* 2. Số điện thoại */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="**** *** 035"
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-800 transition outline-none focus:border-[#0863c5] focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* 3. Email */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition outline-none focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* 4. Ngày sinh */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                Ngày sinh
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition outline-none focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100"
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 5. Giới tính */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                Giới tính
              </label>
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gender: e.target.value as PatientProfileGender,
                    }))
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition outline-none focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="UNKNOWN">Giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 6. Mật khẩu matching Image 3 */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                Mật khẩu
              </label>
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2">
                <div className="flex items-center gap-3">
                  {/* Lock icon */}
                  <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-black tracking-widest text-slate-800">
                    ••••••••••
                  </span>
                </div>

                {/* Blue outline button "Cập nhật 🔄" matching Image 3 */}
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0863c5] transition hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                >
                  <span>Cập nhật</span>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Centered Primary Action Button "Lưu thay đổi" matching Image 3 */}
            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {/* Save / Floppy Disk icon matching Image 3 */}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
            </div>
          </form>
        </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cập nhật mật khẩu</h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {pwMsg && (
              <div
                className={`mt-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                  pwMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-[#0863c5]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-[#0863c5]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-[#0863c5]"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="rounded-xl bg-[#0863c5] px-4 py-2 text-xs font-bold text-white hover:bg-[#0753a8] disabled:opacity-60 cursor-pointer"
                >
                  {pwSaving ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
