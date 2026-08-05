import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";

const statusInfo: Record<
  AppointmentStatus,
  { label: string; dotColor: string; className: string }
> = {
  confirmed: {
    label: "Đã xác nhận",
    dotColor: "bg-emerald-500",
    className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 shadow-sm shadow-emerald-500/5",
  },
  pending: {
    label: "Chờ xác nhận",
    dotColor: "bg-amber-500",
    className: "border-amber-200/80 bg-amber-50/90 text-amber-700 shadow-sm shadow-amber-500/5",
  },
  completed: {
    label: "Hoàn thành",
    dotColor: "bg-blue-500",
    className: "border-blue-200/80 bg-blue-50/90 text-blue-700 shadow-sm shadow-blue-500/5",
  },
  cancelled: {
    label: "Đã hủy",
    dotColor: "bg-rose-500",
    className: "border-rose-200/80 bg-rose-50/90 text-rose-700 shadow-sm shadow-rose-500/5",
  },
  missed: {
    label: "Vắng mặt",
    dotColor: "bg-slate-400",
    className: "border-slate-200 bg-slate-100/90 text-slate-600 shadow-sm",
  },
  in_progress: {
    label: "Đang khám",
    dotColor: "bg-cyan-500",
    className: "border-cyan-200/80 bg-cyan-50/90 text-cyan-700 shadow-sm shadow-cyan-500/5",
  },
  rescheduled: {
    label: "Đã đổi lịch",
    dotColor: "bg-violet-500",
    className: "border-violet-200/80 bg-violet-50/90 text-violet-700 shadow-sm shadow-violet-500/5",
  },
};

type AppointmentRecordCardProps = {
  appointment: AppointmentItem;
  onReschedule: () => void;
  onCancel?: () => void;
  canCancel?: boolean;
  isCancelling?: boolean;
};

export function AppointmentRecordCard({
  appointment,
  onReschedule,
  onCancel,
  canCancel = false,
  isCancelling = false,
}: AppointmentRecordCardProps) {
  const status = statusInfo[appointment.status] ?? statusInfo.pending;
  const dateParts = appointment.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const notes = appointment.preparation ?? [];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:border-blue-300 hover:shadow-[0_12px_32px_-6px_rgba(8,99,197,0.12)]">
      {/* Top subtle blue accent gradient bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0863c5] via-sky-400 to-[#0863c5] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="grid gap-5 lg:grid-cols-[100px_minmax(0,1fr)_auto] lg:items-start">
        {/* 1. Date Widget Box */}
        <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-center shadow-sm">
          <div className="bg-[#0863c5] py-1 text-[10px] font-black uppercase tracking-wider text-white">
            Tháng {dateParts?.[2] ?? "--"}
          </div>
          <div className="bg-gradient-to-b from-white to-slate-50/80 px-3 py-2">
            <strong className="block text-3xl font-black leading-tight tracking-tight text-slate-900">
              {dateParts?.[1] ?? "--"}
            </strong>
            <span className="block text-[11px] font-semibold text-slate-400">
              {dateParts?.[3] ?? "----"}
            </span>
          </div>
        </div>

        {/* 2. Main Content & Details */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Doctor Avatar */}
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0863c5] to-sky-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
                {appointment.initials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold text-slate-900 group-hover:text-[#0863c5] transition-colors">
                  {appointment.doctor}
                </h3>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#0863c5] border border-blue-100/80">
                    {appointment.service}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <span
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
            >
              <span className={`mr-1.5 h-2 w-2 rounded-full ${status.dotColor} ${appointment.status === 'pending' ? 'animate-pulse' : ''}`} />
              {status.label}
            </span>
          </div>

          {/* Time & Note Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              <DashboardIcon name="clock" className="h-3.5 w-3.5 text-sky-400" />
              <span>{appointment.time}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 border border-slate-200/60 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <DashboardIcon name="document" className="h-3.5 w-3.5 text-slate-400" />
              <span>{notes.length ? `${notes.length} ghi chú` : "Không có ghi chú"}</span>
            </div>
          </div>

          {/* Pre-appointment Checklist Box */}
          {notes.length ? (
            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-blue-50/20 p-3.5 shadow-2xs">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0863c5]">
                <svg className="h-3.5 w-3.5 text-[#0863c5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chuẩn bị trước khám
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {notes.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0863c5]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* 3. Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0863c5] border border-blue-100 transition-all duration-200 hover:bg-[#0863c5] hover:text-white hover:shadow-md hover:shadow-blue-500/20"
            aria-label="Thêm vào lịch"
            title="Thêm vào lịch cá nhân"
          >
            <DashboardIcon name="calendar" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onReschedule}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-xs font-extrabold text-[#0863c5] transition-all duration-200 hover:border-[#0863c5] hover:bg-blue-50 hover:shadow-xs"
          >
            Đổi lịch
          </button>
          {canCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 px-4 text-xs font-extrabold text-rose-600 transition-all duration-200 hover:border-rose-200 hover:bg-rose-600 hover:text-white hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCancelling ? "Đang hủy..." : "Hủy"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
