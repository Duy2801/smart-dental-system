import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

function AuthFooter() {
  return (
    <footer className="h-9 shrink-0 border-t border-slate-200/80 bg-white/90 backdrop-blur-md z-20">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 text-[11px] text-slate-500">
        <p className="font-semibold">
          © 2026 Smart Dental System. Chăm sóc nha khoa nâng tầm bởi AI.
        </p>
        <nav aria-label="Thông tin pháp lý" className="flex items-center gap-4 font-bold text-[11px]">
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
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Floating Top Back Button (Replaces full-width header bar) */}
      <div className="absolute top-3 left-4 sm:top-5 sm:left-6 z-30">
        <Link
          href="/home"
          className="group inline-flex items-center rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm backdrop-blur-md transition duration-200 hover:border-blue-200 hover:bg-white hover:text-[#0863c5] hover:shadow-md active:scale-95"
        >
          <span>Quay lại Trang chủ</span>
        </Link>
      </div>

      <div className="absolute top-3 right-4 sm:top-5 sm:right-6 z-30">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-white/90 px-3 py-1 text-[11px] font-bold text-emerald-700 shadow-2xs backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Hệ thống trực tuyến
        </span>
      </div>

      <main className="auth-background relative flex flex-1 items-center justify-center p-3 sm:p-4 lg:p-5 overflow-y-auto min-h-0">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-6 lg:grid-cols-12 lg:gap-10 h-full max-h-full">
          {/* Left Side Showcase (Large screens) */}
          <div className="hidden lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-0.5 text-[11px] font-bold text-[#0863c5] shadow-2xs backdrop-blur-sm">
                <span>✨ CÔNG NGHỆ NHA KHOA HIỆN ĐẠI</span>
              </div>

              <h2 className="text-2xl xl:text-3xl font-black text-slate-950 leading-tight">
                Chăm sóc sức khỏe nụ cười với phác đồ chuẩn y khoa
              </h2>

              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                Hệ thống Smart Dental giúp bạn dễ dàng đặt lịch hẹn, nhận tư vấn trực tuyến và quản lý hồ sơ khám chữa bệnh bảo mật tuyệt đối.
              </p>

              {/* Feature bullet list */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 shadow-2xs backdrop-blur-sm">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0863c5]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Đặt lịch hẹn nhanh 30s</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-snug">
                      Chủ động chọn bác sĩ, khung giờ và dịch vụ khám phù hợp.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 shadow-2xs backdrop-blur-sm">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Trợ lý AI Hỗ trợ Chẩn đoán</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-snug">
                      Tự động gợi ý phác đồ và giải đáp thắc mắc 24/7.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 shadow-2xs backdrop-blur-sm">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Bảo mật Chuẩn HIPAA</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-snug">
                      Thông tin bệnh án được bảo vệ mã hóa tiên tiến.
                    </p>
                  </div>
                </div>
              </div>

              {/* Counter Badges */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div className="rounded-lg border border-slate-200/60 bg-white/60 p-2 text-center backdrop-blur-xs">
                  <p className="text-sm font-black text-[#0863c5]">10.000+</p>
                  <p className="text-[9px] font-bold text-slate-500">Bệnh nhân tin dùng</p>
                </div>
                <div className="rounded-lg border border-slate-200/60 bg-white/60 p-2 text-center backdrop-blur-xs">
                  <p className="text-sm font-black text-[#0863c5]">99.8%</p>
                  <p className="text-[9px] font-bold text-slate-500">Hài lòng dịch vụ</p>
                </div>
                <div className="rounded-lg border border-slate-200/60 bg-white/60 p-2 text-center backdrop-blur-xs">
                  <p className="text-sm font-black text-[#0863c5]">24/7</p>
                  <p className="text-[9px] font-bold text-slate-500">Tư vấn trực tuyến</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Form Container */}
          <div className="col-span-12 lg:col-span-6 flex items-center justify-center">
            {children}
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
