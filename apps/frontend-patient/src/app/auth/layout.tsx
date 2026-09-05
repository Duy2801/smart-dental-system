import Link from "next/link";
import type { ReactNode } from "react";

function AuthFooter() {
  return (
    <footer className="h-12 sm:h-10 shrink-0 border-t border-slate-100 sm:border-slate-200/60 bg-white sm:bg-white/80 backdrop-blur-md z-20">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col sm:flex-row items-center justify-center sm:justify-between px-4 sm:px-6 text-[11px] text-slate-500 gap-1 sm:gap-0">
        <p className="font-medium text-center sm:text-left">
          © 2026 Smart Dental System. Hệ thống nha khoa thông minh.
        </p>
        <nav aria-label="Thông tin pháp lý" className="flex items-center gap-4 font-semibold text-[11px]">
          <Link href="/privacy" className="transition hover:text-[#0863c5]">
            Bảo mật
          </Link>
          <Link href="/terms" className="transition hover:text-[#0863c5]">
            Điều khoản
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between bg-white sm:bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white sm:h-screen sm:overflow-hidden">
      {/* Sleek Floating Back Button */}
      <div className="absolute top-3.5 left-4 sm:top-5 sm:left-6 z-30">
        <Link
          href="/home"
          className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-blue-200 hover:bg-white hover:text-[#0863c5] hover:shadow-xs active:scale-95"
        >
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Trang chủ</span>
        </Link>
      </div>

      {/* Main Content: Full-screen on mobile, perfectly centered compact card container on desktop */}
      <main className="relative flex flex-1 flex-col items-center justify-center p-4 sm:p-6 sm:auth-background overflow-y-auto">
        <div className="w-full flex items-center justify-center my-auto">
          {children}
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}



