import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";

const statusInfo: Record<
  AppointmentStatus,
  { label: string; dotColor: string; className: string }
> = {
  confirmed: {
    label: "Đã xác nhận",
    dotColor: "bg-emerald-500",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "Chờ xác nhận",
    dotColor: "bg-amber-500",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Hoàn thành",
    dotColor: "bg-blue-500",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  cancelled: {
    label: "Đã hủy",
    dotColor: "bg-rose-500",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  missed: {
    label: "Vắng mặt",
    dotColor: "bg-slate-400",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  in_progress: {
    label: "Đang khám",
    dotColor: "bg-cyan-500",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  rescheduled: {
    label: "Đã đổi lịch",
    dotColor: "bg-violet-500",
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
  const status = statusInfo[appointment.status] ?? statusInfo.pending;
  const notes = appointment.preparation ?? [];

  return (
    <article className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2 min-w-0">
        {/* Header row: Doctor name + Service Badge + Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-extrabold text-slate-900 text-base">
            {appointment.doctor}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0058bc] border border-blue-100">
            {appointment.service}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${status.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor} ${appointment.status === 'pending' ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
        </div>

        {/* Info row: Scheduled Date & Time */}
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <DashboardIcon name="clock" className="h-3.5 w-3.5 text-slate-400" />
          <span>Thời gian hẹn:</span>
          <strong className="text-slate-800 font-bold">
            {appointment.time} - {appointment.date}
          </strong>
        </p>

        {/* Preparation Notes pill list if any */}
        {notes.length ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-semibold text-slate-400">Ghi chú:</span>
            {notes.map((note) => (
              <span
                key={note}
                className="inline-flex items-center rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {note}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onReschedule}
          className="px-4 py-2 bg-white hover:bg-blue-50 border border-blue-200 text-[#0058bc] font-bold rounded-xl text-xs transition-all shadow-2xs"
        >
          Đổi lịch
        </button>
        {canCancel && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition-all disabled:opacity-60"
          >
            {isCancelling ? "Đang hủy..." : "Hủy"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
