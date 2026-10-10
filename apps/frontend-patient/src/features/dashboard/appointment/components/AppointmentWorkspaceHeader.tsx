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
    <section className="py-2 space-y-3 mb-6">
      <div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#07366f]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{subtitle}</p>
          ) : null}
        </div>

        <div className="inline-flex w-full md:w-auto shrink-0 rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_10px_28px_rgba(15,23,42,.05)]">
          <button
            type="button"
            onClick={mode === "booking" ? undefined : onSelectBooking}
            className={`inline-flex h-11 flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition cursor-pointer ${
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
            className={`inline-flex h-11 flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition cursor-pointer ${
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
    </section>
  );
}
