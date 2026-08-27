"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "./DashboardIcon";
import { logout, useAppDispatch, useAppSelector } from "@/providers";

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

type PatientAccountSidebarProps = {
  activeTab: "profile" | "records";
};

export function PatientAccountSidebar({ activeTab }: PatientAccountSidebarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.login);

  const initials = getInitials(user?.fullName);
  const displayName = user?.fullName || "Khách hàng";

  function handleLogout() {
    dispatch(logout());
    router.push("/auth/login");
  }

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* User Info Header Card matching Image 2 */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-[#0863c5] text-lg font-black text-white shadow-sm ring-2 ring-blue-50">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">{displayName}</h2>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200/60">
                <span>⭐</span> Thành viên
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Card matching Image 2 */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
        <nav className="space-y-1">
          {/* 1. Thông tin cá nhân */}
          <Link
            href="/profile"
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "profile"
                ? "bg-blue-50 text-[#0863c5] shadow-2xs"
                : "text-slate-700 hover:bg-slate-50 hover:text-[#0863c5]"
            }`}
          >
            <span className={activeTab === "profile" ? "text-[#0863c5]" : "text-slate-400"}>
              <DashboardIcon name="user" className="h-4 w-4" />
            </span>
            Thông tin cá nhân
          </Link>

          {/* 2. Lịch sử khám bệnh */}
          <Link
            href="/records"
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "records"
                ? "bg-blue-50 text-[#0863c5] shadow-2xs"
                : "text-slate-700 hover:bg-slate-50 hover:text-[#0863c5]"
            }`}
          >
            <span className={activeTab === "records" ? "text-[#0863c5]" : "text-slate-400"}>
              <DashboardIcon name="document" className="h-4 w-4" />
            </span>
            Lịch sử khám bệnh
          </Link>

          {/* 3. Đăng xuất */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
          >
            <span className="text-rose-500">
              <DashboardIcon name="logout" className="h-4 w-4" />
            </span>
            Đăng xuất
          </button>
        </nav>
      </div>
    </aside>
  );
}
