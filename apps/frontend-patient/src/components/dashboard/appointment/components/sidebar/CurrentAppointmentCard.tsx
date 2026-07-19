import type { CurrentAppointment } from "../../types";
import { DashboardIcon } from "../../../common/DashboardIcon";

export function CurrentAppointmentCard({
  appointment,
}: {
  appointment: CurrentAppointment | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Lịch hẹn hiện tại</h2>
        {appointment ? (
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[9px] font-bold uppercase text-cyan-600">
            01 hoạt động
          </span>
        ) : null}
      </div>

      {appointment ? (
        <article className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase text-[#0863c5]">
              {appointment.service}
            </span>
            <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] font-bold uppercase text-slate-500">
              {appointment.status}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#0863c5]">
            {appointment.time}
          </p>
          <h3 className="mt-1 text-sm font-bold leading-6 text-slate-900">
            {appointment.date}
          </h3>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100">
              <DashboardIcon name="user" className="h-3.5 w-3.5" />
            </span>
            {appointment.doctor}
          </p>
        </article>
      ) : (
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <DashboardIcon
              name="calendar"
              className="mx-auto h-9 w-9 text-slate-300"
            />
            <p className="mt-3 text-xs text-slate-400">
              Bạn chưa có lịch hẹn nào.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
