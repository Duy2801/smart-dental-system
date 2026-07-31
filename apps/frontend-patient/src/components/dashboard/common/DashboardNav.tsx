"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Trang chủ", href: "/home" },
  { label: "Lịch hẹn", href: "/appointment" },
  { label: "Dịch vụ", href: "/service" },
  { label: "Hồ sơ", href: "/records" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden h-full items-center justify-center gap-3 md:flex lg:gap-6"
    >
      {navigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-full min-w-[104px] items-center justify-center px-3 text-center text-sm font-semibold transition hover:text-[#0863c5] ${
              active ? "text-[#0863c5]" : "text-slate-500"
            }`}
          >
            {item.label}
            {active && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#0863c5]" />}
          </Link>
        );
      })}
    </nav>
  );
}
