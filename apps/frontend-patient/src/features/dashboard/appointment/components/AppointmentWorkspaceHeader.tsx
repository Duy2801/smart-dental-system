"use client";

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
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0058bc]">
            <DashboardIcon name="appointment" className="h-3.5 w-3.5" />
            Đặt lịch khám nha khoa
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>

      <div className="inline-flex w-full md:w-auto shrink-0 rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_10px_28px_rgba(15,23,42,.05)]">
        <button
          type="button"
          onClick={mode === "booking" ? undefined : onSelectBooking}
          className={`inline-flex h-11 flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition ${
            mode === "booking"
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
          className={`inline-flex h-11 flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition ${
            mode === "manage"
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
  );
}
