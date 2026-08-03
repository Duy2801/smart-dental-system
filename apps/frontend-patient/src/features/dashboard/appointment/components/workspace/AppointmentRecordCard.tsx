import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { T } from "../../../common/typography";

const statusInfo: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  confirmed: {
    label: "Đã xác nhận",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "Chờ xác nhận",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Hoàn thành",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  missed: {
    label: "Vắng mặt",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  in_progress: {
    label: "Đang khám",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  rescheduled: {
    label: "Đã đổi lịch",
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
  const notes = appointment.preparation ?? [];

  return (
    <article className="rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,.04)] transition hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(15,23,42,.06)]">
      <div className="grid gap-4 p-4 lg:grid-cols-[96px_minmax(0,1fr)_220px] lg:items-start lg:p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 text-center">
          <p className="border-b border-slate-200 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {dateParts?.[2] ?? "--"}
          </p>
          <strong className="block px-3 pt-2 text-[28px] font-extrabold leading-none text-slate-900">
            {dateParts?.[1] ?? "--"}
          </strong>
          <p className="px-3 pb-2 pt-1 text-[11px] text-slate-500">
            {dateParts?.[3] ?? "----"}
          </p>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xs font-bold text-[#0058bc]">
                {appointment.initials}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold text-slate-900">
                  {appointment.doctor}
                </h3>
                <p className={`mt-1 line-clamp-2 ${T.body}`}>
                  {appointment.service}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-slate-700">
              <DashboardIcon name="clock" className="h-4 w-4 text-[#0058bc]" />
              {appointment.time}
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <DashboardIcon name="document" className="h-4 w-4 text-slate-400" />
              {notes.length ? `${notes.length} ghi chú` : "Không có ghi chú"}
            </div>
          </div>

          {notes.length ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className={`flex items-center gap-2 ${T.overline} text-[#0058bc]`}>
                <DashboardIcon name="document" className="h-4 w-4" />
                Chuẩn bị trước khám
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {notes.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600"
                  >
                    <span className="text-slate-300">•</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0058bc]"
            aria-label="Thêm vào lịch"
          >
            <DashboardIcon name="calendar" className="h-4 w-4" />
          </button>
          <button
            onClick={onReschedule}
            className="rounded-xl border border-[#0058bc]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#0058bc] transition hover:border-[#0058bc] hover:bg-blue-50"
          >
            Đổi lịch
          </button>
          {canCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCancelling ? "Đang hủy..." : "Hủy"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
