import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";
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
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-bold text-slate-700">Smart Dental System</p>
          <p className="mt-0.5">© 2026 Smart Dental System. Chăm sóc nụ cười bằng công nghệ AI.</p>
        </div>
        <div className="flex gap-5">
          <Link href="/contact" className="hover:text-[#0863c5]">Hỗ trợ</Link>
          <Link href="/privacy" className="hover:text-[#0863c5]">Bảo mật</Link>
          <Link href="/terms" className="hover:text-[#0863c5]">Điều khoản</Link>
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
