import Link from "next/link";
import type { ReactNode } from "react";

function ToothLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 32 32" fill="none">
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
  );
}

function AuthHeader() {
  return (
    <header className="shrink-0 border-b border-[#e7eaf0] bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold tracking-[-0.02em] text-[#0863c5]"
        >
          <ToothLogo />
          <span>Smart Dental System</span>
        </Link>

        <nav
          aria-label="Liên kết hỗ trợ"
          className="hidden items-center gap-5 text-[11px] font-medium text-slate-600 sm:flex"
        >
        </nav>
      </div>
    </header>
  );
}

function AuthFooter() {
  return (
    <footer className="shrink-0 border-t border-[#e7eaf0] bg-white/80">
      <div className="mx-auto flex min-h-14 w-full max-w-[1440px] flex-col justify-center gap-2 px-5 py-2.5 text-[10px] text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
        <p className="font-medium text-slate-600">
          © 2026 DentaAI Precision. Clinical AI for Modern Dentistry.
        </p>
        <nav aria-label="Thông tin pháp lý" className="flex items-center gap-5">
          <Link href="/privacy" className="transition hover:text-[#0863c5]">
            Privacy Policy
          </Link>
          <Link href="/standards" className="transition hover:text-[#0863c5]">
            HIPAA Compliance
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#fafaff] text-slate-900">
      <AuthHeader />
      <main className="auth-background flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-5 sm:px-6">
        <div className="flex max-h-full w-full max-w-[500px] items-center justify-center">
          {children}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
