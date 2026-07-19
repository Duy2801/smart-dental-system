import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { AppointmentRecordCard } from "./AppointmentRecordCard";
import { AppointmentsEmptyState } from "./AppointmentsEmptyState";
import { AppointmentHistoryList } from "./AppointmentHistoryList";
import { StatCard } from "./StatCard";

type ManageModeViewProps = {
  appointments: AppointmentItem[];
  upcoming: AppointmentItem[];
  history: AppointmentItem[];
  query: string;
  statusFilter: AppointmentStatus | "all";
  loading: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: AppointmentStatus | "all") => void;
  onResetFilters: () => void;
  onOpenBooking: () => void;
  onReschedule: (appointment: AppointmentItem) => void;
  onCancelAppointment: (appointmentId: string) => void;
  cancellingAppointmentId: string | null;
};

export function ManageModeView({
  appointments,
  upcoming,
  history,
  query,
  statusFilter,
  loading,
  onQueryChange,
  onStatusFilterChange,
  onResetFilters,
  onOpenBooking,
  onReschedule,
  onCancelAppointment,
  cancellingAppointmentId,
}: ManageModeViewProps) {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#064f9f] via-[#0668cb] to-[#0795d7] px-6 py-8 text-white shadow-[0_22px_60px_rgba(0,88,188,.22)] sm:px-9 sm:py-10">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border-[50px] border-white/5" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase text-blue-50 backdrop-blur">
              <DashboardIcon name="calendar" className="h-4 w-4" />
              Trung tam lich hen
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Quan ly lich hen cua ban
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Theo doi lich trinh, chuan bi truoc kham va quan ly toan bo hanh
              trinh cham soc nu cuoi tai mot noi.
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-[#0058bc] shadow-xl transition hover:-translate-y-0.5"
          >
            <span className="text-lg leading-none">+</span>
            Dat lich moi
          </button>
        </div>
      </header>

      <div className="relative z-10 -mt-3 grid gap-4 px-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="appointment"
          value={String(appointments.length)}
          label="Tong so lich hen"
          detail={`${upcoming.length} sap toi`}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon="checkup"
          value={String(
            appointments.filter((item) => item.status === "completed").length,
          )}
          label="Da hoan thanh"
          detail="Thanh cong"
          tone="bg-emerald-50 text-emerald-600"
        />
        <article className="relative overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-r from-[#f0f7ff] to-[#e8fbff] p-6 shadow-[0_10px_35px_rgba(15,23,42,.05)] md:col-span-2">
          <div className="relative flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0058bc] text-white shadow-lg shadow-blue-200">
              <DashboardIcon name="sparkles" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase text-[#0058bc]">
                Nhac lich thong minh
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {upcoming[0]
                  ? `Lich gan nhat cua ban la ${upcoming[0].date} luc ${upcoming[0].time}.`
                  : "Ban chua co lich hen sap toi. Hay dat lich de phong kham ho tro som."}
              </p>
            </div>
          </div>
        </article>
      </div>

      <section className="mt-8 rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">
            Tim kiem va loc lich hen
          </p>
          <button
            onClick={onResetFilters}
            className="text-[10px] font-bold text-[#0058bc]"
          >
            Dat lai bo loc
          </button>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <DashboardIcon
              name="search"
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tim theo bac si hoac dich vu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as AppointmentStatus | "all")
            }
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 outline-none focus:border-blue-400"
          >
            <option value="all">Tat ca trang thai</option>
            <option value="completed">Da hoan thanh</option>
            <option value="cancelled">Da huy</option>
            <option value="missed">Vang mat</option>
            <option value="rescheduled">Da doi lich</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[24px] bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <>
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#0058bc]">
                  Lich trinh cua ban
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    Lich hen sap toi
                  </h2>
                  <span className="rounded-full bg-[#0058bc] px-2.5 py-1 text-[10px] font-bold text-white">
                    {upcoming.length}
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenBooking}
                className="text-xs font-bold text-[#0058bc] hover:underline"
              >
                + Them lich hen
              </button>
            </div>
            {upcoming.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {upcoming.map((item) => (
                  <AppointmentRecordCard
                    key={item.id}
                    appointment={item}
                    onReschedule={() => onReschedule(item)}
                    onCancel={() => onCancelAppointment(item.id)}
                    canCancel={
                      item.status === "pending" || item.status === "confirmed"
                    }
                    isCancelling={cancellingAppointmentId === item.id}
                  />
                ))}
              </div>
            ) : (
              <AppointmentsEmptyState text="Ban chua co lich hen sap toi." />
            )}
          </section>

          <section className="mt-10">
            <AppointmentHistoryList history={history} />
          </section>
        </>
      )}
    </main>
  );
}
