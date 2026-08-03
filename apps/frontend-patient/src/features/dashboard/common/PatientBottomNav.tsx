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
import { MAIN_NAV, ROUTES } from "./routes";

type BottomNavItem = {
  label: string;
  href: string;
  icon: string;
};

const bottomNavItems: BottomNavItem[] = [
  { label: "Trang chủ", href: ROUTES.home, icon: "home" },
  { label: "Lịch hẹn", href: ROUTES.appointment, icon: "calendar" },
  { label: "Dịch vụ", href: ROUTES.service, icon: "grid" },
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
            item.href === ROUTES.service
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

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

                <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-[#0863c5]" : "text-slate-400"}`}>
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
