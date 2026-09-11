"use client";

/**
 * PatientBottomNav.tsx – Bottom navigation bar cho Patient Dashboard
 *
 * Chỉ hiển thị trên mobile (md:hidden), nổi cố định ở đáy màn hình.
 * Tái sử dụng: chỉ cần import và đặt vào layout.
 *
 * Cách dùng:
 *   import { PatientBottomNav } from "@/features/dashboard/common/PatientBottomNav";
 *   <PatientBottomNav />
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "./DashboardIcon";
import { ROUTES } from "./routes";

type BottomNavItem = {
  label: string;
  href: string;
  icon: string;
  isSpecial?: boolean;
};

const bottomNavItems: BottomNavItem[] = [
  { label: "Trang chủ", href: ROUTES.home, icon: "home" },
  { label: "Lịch hẹn", href: ROUTES.appointment, icon: "calendar" },
  { label: "Tư vấn", href: ROUTES.consultation, icon: "chat", isSpecial: true },
  { label: "Hồ sơ", href: ROUTES.records, icon: "document" },
  { label: "Tôi", href: ROUTES.profile, icon: "user" },
];

export function PatientBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-md" />

      <ul className="relative flex h-[62px] items-center justify-around px-1">
        {bottomNavItems.map((item) => {
          const isActive =
            item.href === ROUTES.home
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.isSpecial) {
            return (
              <li key={item.href} className="flex-1 flex justify-center">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative -mt-5 flex flex-col items-center group active:scale-95 transition-transform"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full shadow-lg border-2 border-white transition-all ${
                      isActive
                        ? "bg-[#004899] text-white shadow-blue-500/40 ring-2 ring-blue-300 scale-105"
                        : "bg-[#0058bc] text-white shadow-blue-500/30 hover:bg-[#004899]"
                    }`}
                  >
                    <DashboardIcon name={item.icon} className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-[10px] font-bold text-[#0058bc]">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-1 transition-colors ${
                  isActive ? "text-[#0863c5]" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {/* Active dot indicator */}
                {isActive && (
                  <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#0863c5]" />
                )}

                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-[#0863c5]"
                      : "bg-transparent text-slate-400"
                  }`}
                >
                  <DashboardIcon name={item.icon} className="h-5 w-5" />
                </span>

                <span
                  className={`text-[10px] font-semibold leading-none ${
                    isActive ? "text-[#0863c5]" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
