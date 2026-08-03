import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";

export type Appointment = {
  day: string;
  month: string;
  time: string;
  doctor: string;
  specialty: string;
  room: string;
  status: string;
};

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <section className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`flex items-center gap-2.5 ${T.sectionTitle}`}>
          <DashboardIcon name="calendar" className="h-6 w-6 text-[#0863c5]" />
          Lịch hẹn sắp tới
        </h2>
        <Link href={ROUTES.appointment} className={T.link}>
          Xem lịch
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex w-full shrink-0 items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-5 text-[#0863c5] sm:h-40 sm:w-32 sm:flex-col sm:gap-1">
          <span className="text-xs font-bold uppercase tracking-wider">{appointment.month}</span>
          <strong className="text-5xl leading-none">{appointment.day}</strong>
          <span className="text-xs font-semibold">{appointment.time}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
              {appointment.status}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <DashboardIcon name="clock" className="h-4 w-4" /> {appointment.time}
            </span>
          </div>
          <h3 className={`mt-4 truncate ${T.cardTitle}`}>{appointment.doctor}</h3>
          <p className={`mt-1.5 ${T.body}`}>{appointment.specialty}</p>

          <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#0863c5] shadow-sm">
                <DashboardIcon name="clock" className="h-4 w-4" />
              </span>
              <div>
                <p className={T.fieldLabel}>Thời gian</p>
                <p className={T.fieldValue}>{appointment.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-cyan-600 shadow-sm">
                <DashboardIcon name="home" className="h-4 w-4" />
              </span>
              <div>
                <p className={T.fieldLabel}>Địa điểm</p>
                <p className={T.fieldValue}>{appointment.room}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button type="button" className="rounded-lg bg-[#0863c5] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0756aa]">
              Chi tiết
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Đổi lịch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
