import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { DashboardFooterClinicInfo } from "@/features/dashboard/common/DashboardFooterClinicInfo";
import { DashboardNav } from "@/features/dashboard/common/DashboardNav";
import { ScrollRevealProvider } from "@/features/dashboard/common/ScrollReveal";
import { PatientBottomNav } from "@/features/dashboard/common/PatientBottomNav";
import { ChatbotWidget } from "@/features/dashboard/chatbot/ChatbotWidget";
import { NotificationNavbarBadge } from "@/features/dashboard/notification/components/NotificationNavbarBadge";
import { HeaderAccountDropdown } from "@/features/dashboard/common/HeaderAccountDropdown";
import { ROUTES, FOOTER_LINKS } from "@/features/dashboard/common/routes";
import { T } from "@/features/dashboard/common/typography";

function DashboardHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-2xs backdrop-blur-md">
      <div className="mx-auto flex h-[76px] w-full max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} className="flex shrink-0 items-center gap-3 text-[#0863c5] group transition">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-slate-200 transition duration-300 group-hover:scale-105 group-hover:shadow-md">
            <Image
              src="/clinic-logo.png"
              alt="Logo Smart Dental System"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span className={`${T.brandName} transition group-hover:text-[#0863c5]`}>Smart Dental System</span>
        </Link>

        <div className="flex h-full items-center justify-center">
          <Suspense fallback={<div className="h-full" />}>
            <DashboardNav />
          </Suspense>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <NotificationNavbarBadge />
          <HeaderAccountDropdown />
        </div>
      </div>
    </header>
  );
}

function DashboardFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 text-xs text-slate-600 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <p className={T.brandNameFooter}>Smart Dental System</p>
            <p className={T.caption}>
              Hệ thống nha khoa kỹ thuật số chuẩn quốc tế, ứng dụng AI chẩn đoán và điều trị chuyên sâu.
            </p>
          </div>
          <DashboardFooterClinicInfo />
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500">
          <p>© 2026 Smart Dental System. Chăm sóc nụ cười bằng công nghệ AI.</p>
          <div className="flex gap-5">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#0863c5]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f6f8fc] text-slate-900">
      <DashboardHeader />
      <div className="pt-[72px] pb-[62px] md:pb-0">
        <ScrollRevealProvider>{children}</ScrollRevealProvider>
      </div>
      <DashboardFooter />
      <PatientBottomNav />
      <ChatbotWidget />
    </div>
  );
}
