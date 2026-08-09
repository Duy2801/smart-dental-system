"use client";

import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";

type AppointmentWorkspaceMode = "manage" | "booking";

type AppointmentWorkspaceHeaderProps = {
  mode: AppointmentWorkspaceMode;
  title: string;
  subtitle?: string;
  onSelectManage: () => void;
  onSelectBooking: () => void;
};

export function AppointmentWorkspaceHeader({
  mode,
  title,
  subtitle,
  onSelectManage,
  onSelectBooking,
}: AppointmentWorkspaceHeaderProps) {
  return (
    <>
      <div className="mb-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_450px]">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_10px_28px_rgba(15,23,42,.05)]">
          <button
            type="button"
            onClick={mode === "booking" ? undefined : onSelectBooking}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${mode === "booking"
              ? "bg-[#0058bc] text-white shadow-sm"
              : "text-slate-600 hover:bg-blue-50 hover:text-[#0058bc]"
              }`}
            aria-current={mode === "booking" ? "page" : undefined}
          >
            <DashboardIcon name="calendar" className="h-4 w-4" />
            Đặt lịch khám mới
          </button>
          <button
            type="button"
            onClick={mode === "manage" ? undefined : onSelectManage}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${mode === "manage"
              ? "bg-[#0058bc] text-white shadow-sm"
              : "text-slate-600 hover:bg-blue-50 hover:text-[#0058bc]"
              }`}
            aria-current={mode === "manage" ? "page" : undefined}
          >
            <DashboardIcon name="appointment" className="h-4 w-4" />
            Lịch khám của tôi
          </button>
        </div>
      </div>
    </>
  );
}
