"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiLogout } from "@/components/auth/api";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";
import apiClient from "@/lib/axios";
import { logout, useAppDispatch } from "@/providers";

const authCookies = [
  "access_token",
  "role",
  "session",
  "user_info",
  "refreshToken",
];

const authStorageKeys = [
  "access_token",
  "role",
  "session",
  "user_info",
  "refreshToken",
  "patient_auth",
];

function removeCookie(name: string) {
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const paths = ["/", "/api/v1", "/api/v1/auth"];

  paths.forEach((path) => {
    document.cookie = `${name}=; path=${path}; ${expires}`;
  });
}

function clearClientAuth() {
  authCookies.forEach(removeCookie);
  authStorageKeys.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
  delete apiClient.defaults.headers.common.Authorization;
}

export function DashboardLogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await apiLogout();
    } catch {
      // Van dang xuat o client neu server khong phan hoi duoc.
    } finally {
      dispatch(logout());
      queryClient.clear();
      clearClientAuth();
      router.replace("/auth/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
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
