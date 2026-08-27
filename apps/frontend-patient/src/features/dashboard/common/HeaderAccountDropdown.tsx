"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DashboardIcon } from "./DashboardIcon";
import { logout, useAppDispatch, useAppSelector } from "@/providers";
import { ROUTES } from "./routes";

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

export function HeaderAccountDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.login);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user?.fullName);
  const displayName = user?.fullName || "Khách hàng";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setIsOpen(false);
    dispatch(logout());
    router.push(ROUTES.login);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={ROUTES.login}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0863c5] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#0753a8]"
        >
          Đăng nhập
        </Link>
        <Link
          href={ROUTES.register}
          className="hidden sm:inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account trigger button matching Image 2 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-full p-1 text-left transition hover:bg-slate-100/80 focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-[#0863c5] text-xs font-black tracking-wider text-white shadow-sm ring-2 ring-blue-100">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-[11px] font-normal text-slate-500">Xin chào</span>
          <span className="max-w-[100px] truncate text-xs font-bold text-slate-900">
            {displayName}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Dropdown Menu matching Image 2 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 z-50 w-60 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Top pointing triangle arrow matching Image 2 */}
          <div className="flex justify-end pr-5 -mb-1">
            <div className="h-3 w-3 rotate-45 border-l border-t border-slate-200/90 bg-white" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl ring-1 ring-black/5">
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>

            <nav className="space-y-0.5 text-xs font-semibold text-slate-700">
              <Link
                href={ROUTES.profile}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 hover:text-[#0863c5]"
              >
                <span className="text-slate-400">
                  <DashboardIcon name="user" className="h-4 w-4" />
                </span>
                Thông tin cá nhân
              </Link>

              <Link
                href={ROUTES.records}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 hover:text-[#0863c5]"
              >
                <span className="text-slate-400">
                  <DashboardIcon name="document" className="h-4 w-4" />
                </span>
                Lịch sử khám bệnh
              </Link>
            </nav>

            <div className="mt-1 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <DashboardIcon name="logout" className="h-4 w-4 text-rose-500" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
