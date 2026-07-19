import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";

const statusInfo: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  confirmed: {
    label: "Da xac nhan",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "Cho xac nhan",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Hoan thanh",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  cancelled: {
    label: "Da huy",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  missed: {
    label: "Vang mat",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  in_progress: {
    label: "Dang kham",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  rescheduled: {
    label: "Da doi lich",
    className: "border-violet-200 bg-violet-50 text-violet-700",
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
  const status = statusInfo[appointment.status];
  const dateParts = appointment.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);

  return (
    <article className="group flex min-h-[218px] flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_50px_rgba(37,99,235,.12)]">
      <div className="h-1 bg-gradient-to-r from-[#0058bc] via-sky-400 to-cyan-300" />
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0058bc] to-cyan-400 text-xs font-bold text-white shadow-lg shadow-blue-100">
            {appointment.initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-slate-900">
              {appointment.doctor}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#0058bc]">
              {appointment.service}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
        >
          <span className="mr-1">o</span>
          {status.label}
        </span>
      </header>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="grid grid-cols-[88px_1fr] gap-4">
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 text-center">
            <p className="bg-[#0058bc] py-1.5 text-[9px] font-bold uppercase text-white">
              Tháng {dateParts?.[2] ?? "--"}
            </p>
            <strong className="block py-2 text-[32px] font-extrabold leading-none text-[#0058bc]">
              {dateParts?.[1] ?? "--"}
            </strong>
            <p className="pb-2 text-[11px] text-slate-500">
              {dateParts?.[2] ?? "----"}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#0058bc]">
                <DashboardIcon name="clock" className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-bold text-slate-800">
                {appointment.time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
                <DashboardIcon name="document" className="h-4 w-4" />
              </span>
              <span className="truncate">
                {appointment.preparation?.length
                  ? `${appointment.preparation.length} ghi chú chuẩn bị`
                  : "Không có ghi chú"}
              </span>
            </div>
          </div>
        </div>

        {appointment.preparation?.length ? (
          <div className="mt-4 rounded-2xl border border-cyan-100 bg-gradient-to-r from-blue-50/70 to-cyan-50/70 p-4">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#0058bc]">
              <DashboardIcon name="document" className="h-4 w-4" />
              Chuẩn bị trước khám
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {appointment.preparation.map((item, index) => (
                <p key={item} className="text-[11px] text-slate-600">
                  <span
                    className={index === 0 ? "text-emerald-500" : "text-slate-300"}
                  >
                    {index === 0 ? "o" : "O"}
                  </span>{" "}
                  {item}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <button
            className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0058bc]"
            aria-label="Them vao lich"
          >
            <DashboardIcon name="calendar" className="h-4 w-4" />
          </button>
          <button
            onClick={onReschedule}
            className="rounded-xl border border-[#0058bc]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#0058bc] transition hover:border-[#0058bc] hover:bg-blue-50"
          >
            Đổi lịch hẹn
          </button>
          {canCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="flex-1 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCancelling ? "Đang hủy..." : "Hủy lịch hẹn"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
