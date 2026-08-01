import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";
import { DashboardFooterClinicInfo } from "@/components/dashboard/common/DashboardFooterClinicInfo";
import { DashboardNav } from "@/components/dashboard/common/DashboardNav";
import { ScrollRevealProvider } from "@/components/dashboard/common/ScrollReveal";
import { ChatbotWidget } from "@/components/dashboard/chatbot/ChatbotWidget";

function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-[76px] w-full max-w-[1360px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex min-w-0 items-center gap-3 text-[#0863c5]">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
            <Image
              src="/clinic-logo.png"
              alt="Logo Smart Dental System"
              width={44}
              height={44}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span className="truncate text-[17px] font-extrabold leading-none">Smart Dental System</span>
        </Link>

        <DashboardNav />

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/notification"
            aria-label="Thông báo"
            className="relative grid h-11 w-11 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-[#0863c5]"
          >
            <DashboardIcon name="bell" className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
          </Link>
          <Link
            href="/profile"
            aria-label="Hồ sơ cá nhân"
            className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-[#0863c5] ring-2 ring-white shadow-sm"
          >
            AN
          </Link>
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
            <p className="font-extrabold text-[#0058bc] text-sm">Smart Dental System</p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Hệ thống nha khoa kỹ thuật số chuẩn quốc tế, ứng dụng AI chẩn đoán và điều trị chuyên sâu.
            </p>
          </div>
          <DashboardFooterClinicInfo />
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500">
          <p>© 2026 Smart Dental System. Chăm sóc nụ cười bằng công nghệ AI.</p>
          <div className="flex gap-5">
            <Link href="/contact" className="hover:text-[#0863c5]">Hỗ trợ</Link>
            <Link href="/privacy" className="hover:text-[#0863c5]">Bảo mật</Link>
            <Link href="/terms" className="hover:text-[#0863c5]">Điều khoản</Link>
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
      <ScrollRevealProvider>{children}</ScrollRevealProvider>
      <DashboardFooter />
      <ChatbotWidget />
    </div>
  );
}
