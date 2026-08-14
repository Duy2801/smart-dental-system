import Link from "next/link";
import type { ReactNode } from "react";

function ToothLogo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
      <svg aria-hidden="true" className="h-4.5 w-4.5" viewBox="0 0 32 32" fill="none">
        <path
          d="M8.4 4.8c2.6-1.3 5.1.2 7.6.2s5-1.5 7.6-.2c4 2 3.2 7.6 1.8 11.2-1.8 4.6-2.8 11.2-6.1 11.2-2.1 0-1.4-7.5-3.3-7.5s-1.2 7.5-3.3 7.5c-3.3 0-4.3-6.6-6.1-11.2C5.2 12.4 4.4 6.8 8.4 4.8Z"
          fill="currentColor"
        />
        <path
          d="M11.1 7.8c1.4-.7 2.9.1 4.9.1"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity=".72"
        />
      </svg>
    </div>
  );
}

function AuthHeader() {
  return (
    <header className="h-14 shrink-0 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-sm font-bold tracking-tight text-slate-900 transition hover:opacity-90"
        >
          <ToothLogo />
          <span className="font-extrabold text-slate-900">Smart Dental System</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống sẵn sàng
          </span>
        </div>
      </div>
    </header>
  );
}

function AuthFooter() {
  return (
    <footer className="h-10 shrink-0 border-t border-slate-200/70 bg-white/60 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6 text-[11px] text-slate-500">
        <p className="font-medium">
          © 2026 DentaAI Precision. Clinical AI for Modern Dentistry.
        </p>
        <nav aria-label="Thông tin pháp lý" className="flex items-center gap-5 font-medium">
          <Link href="/privacy" className="transition hover:text-blue-600">
            Privacy Policy
          </Link>
          <Link href="/standards" className="transition hover:text-blue-600">
            HIPAA Compliance
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
      <AuthHeader />
      <main className="auth-background flex flex-1 items-center justify-center p-4 overflow-hidden">
        {children}
      </main>
      <AuthFooter />
    </div>
  );
}
