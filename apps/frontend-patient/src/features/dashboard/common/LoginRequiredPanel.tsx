"use client";

import Link from "next/link";
import { DashboardIcon } from "./DashboardIcon";
import { ROUTES } from "./routes";

type LoginRequiredPanelProps = {
  title: string;
  description: string;
  loginLabel: string;
  redirectTo: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  icon?: string;
};

export function LoginRequiredPanel({
  title,
  description,
  loginLabel,
  redirectTo,
  secondaryHref = ROUTES.service,
  secondaryLabel = "Xem dịch vụ",
  icon = "shield",
}: LoginRequiredPanelProps) {
  const loginHref = `${ROUTES.login}?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#0863c5] text-white shadow-sm">
              <DashboardIcon name={icon} className="h-7 w-7" />
            </span>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0863c5]">
              Cần đăng nhập
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={loginHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#0753a8]"
              >
                <DashboardIcon name="user" className="h-4 w-4" />
                {loginLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5]"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
