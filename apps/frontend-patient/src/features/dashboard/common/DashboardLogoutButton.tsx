"use client";

import { useState } from "react";
import { useLogout } from "@/features/auth/useLogout";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";

export function DashboardLogoutButton() {
  const { handleLogout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function onClickLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    handleLogout();
  }

  return (
    <button
      type="button"
      onClick={onClickLogout}
      disabled={isLoggingOut}
      aria-label="Đăng xuất"
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <DashboardIcon name="logout" className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isLoggingOut ? "Đang thoát" : "Đăng xuất"}
      </span>
    </button>
  );
}
