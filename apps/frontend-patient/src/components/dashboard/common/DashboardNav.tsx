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
      className="mx-4 hidden h-full max-w-[560px] flex-1 grid-cols-5 md:grid lg:mx-10"
    >
      {navigation.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-full items-center justify-center whitespace-nowrap px-2 text-center text-[13px] font-semibold transition hover:text-[#0863c5] ${active ? "text-[#0863c5]" : "text-slate-500"
              }`}
          >
            {item.label}
            {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0863c5]" />}
          </Link>
        );
      })}
    </nav>
  );
}
