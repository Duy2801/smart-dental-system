"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Panel ảnh bên trái (chỉ hiện trên desktop) */
function AuthShowcase() {
  return (
    <aside className="relative hidden lg:block h-full overflow-hidden rounded-[28px]">
      <Image
        src="/auth-dental-clinic.jpg"
        alt="Phòng khám nha khoa hiện đại"
        fill
        priority
        sizes="50vw"
        className="object-cover object-center"
      />
      {/* Gradient nhẹ ở đáy để chữ trắng dễ đọc, phần trên giữ ảnh sáng rõ */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[#04213f]/80 via-[#04213f]/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-10 xl:p-12 text-white">
        <h2 className="max-w-md text-3xl xl:text-[34px] font-black leading-tight tracking-tight">
          Nụ cười khỏe mạnh bắt đầu từ hôm nay.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
          Đặt lịch khám, theo dõi hồ sơ điều trị và nhận ưu đãi — tất cả trong một tài khoản.
        </p>
      </div>
    </aside>
  );
}

function AuthFooter() {
  return (
    <footer className="w-full px-4 sm:px-6 py-3 text-[11px] text-slate-500 shrink-0">
      <div className="mx-auto flex max-w-105 lg:max-w-none flex-col sm:flex-row items-center justify-between gap-1">
        <p className="text-center sm:text-left">© 2026 Smart Dental System.</p>
        <nav aria-label="Thông tin pháp lý" className="flex items-center gap-4 font-semibold text-slate-600">
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
    <div className="grid min-h-dvh lg:h-dvh w-full lg:grid-cols-2 lg:gap-3 lg:p-3 bg-white text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      <AuthShowcase />

      {/* Cột form: nền trắng trên desktop, form không khung viền */}
      <div className="flex min-h-dvh lg:min-h-0 flex-col sm:bg-[#f3f6fb] lg:bg-white lg:overflow-y-auto">
        <header className="w-full px-4 sm:px-6 pt-3 sm:pt-5 shrink-0">
          <Link
            href="/home"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-blue-300 hover:text-[#0863c5] active:scale-95"
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
        </header>

        <main className="flex flex-1 w-full items-center justify-center p-0 sm:p-4">
          <div className="w-full h-full sm:h-auto sm:max-w-105 flex flex-col justify-center sm:[&>section]:p-6 lg:[&>section]:border-0 lg:[&>section]:p-0 lg:[&>section]:shadow-none">
            {children}
          </div>
        </main>

        <AuthFooter />
      </div>
    </div>
  );
}
