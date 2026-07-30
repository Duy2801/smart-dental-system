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
              Trung tâm lịch hẹn
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Quản lý lịch hẹn của bạn
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Theo dõi lịch trình, chuẩn bị trước khám và quản lý toàn bộ hành
              trình chăm sóc nụ cười tại một nơi.
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-[#0058bc] shadow-xl transition hover:-translate-y-0.5"
          >
            <span className="text-lg leading-none">+</span>
            Đặt lịch mới
          </button>
        </div>
      </header>

      <div className="relative z-10 -mt-3 grid gap-4 px-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="appointment"
          value={String(appointments.length)}
          label="Tổng số lịch hẹn"
          detail={`${upcoming.length} sắp tới`}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon="checkup"
          value={String(
            appointments.filter((item) => item.status === "completed").length,
          )}
          label="Đã hoàn thành"
          detail="Thành công"
          tone="bg-emerald-50 text-emerald-600"
        />
        <article className="relative overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-r from-[#f0f7ff] to-[#e8fbff] p-6 shadow-[0_10px_35px_rgba(15,23,42,.05)] md:col-span-2">
          <div className="relative flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0058bc] text-white shadow-lg shadow-blue-200">
              <DashboardIcon name="sparkles" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase text-[#0058bc]">
                Nhắc lịch thông minh
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {upcoming[0]
                  ? `Lịch gần nhất của bạn là ${upcoming[0].date} lúc ${upcoming[0].time}.`
                  : "Bạn chưa có lịch hẹn sắp tới. Hãy đặt lịch để phòng khám hỗ trợ sớm."}
              </p>
            </div>
          </div>
        </article>
      </div>

      <section className="mt-8 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Tìm kiếm và lọc lịch hẹn
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Lọc nhanh theo trạng thái hoặc tra cứu theo bác sĩ, dịch vụ.
            </p>
          </div>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
          >
            <DashboardIcon name="arrow" className="h-4 w-4 rotate-180" />
            Đặt lại bộ lọc
          </button>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="relative block">
            <span className="sr-only">Tìm theo bác sĩ hoặc dịch vụ</span>
            <DashboardIcon
              name="search"
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm theo bác sĩ hoặc dịch vụ..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Lọc theo trạng thái</span>
            <DashboardIcon
              name="calendar"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <DashboardIcon
              name="chevron"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400"
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as AppointmentStatus | "all")
              }
              className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="missed">Vắng mặt</option>
              <option value="rescheduled">Đã đổi lịch</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { value: "all", label: "Tất cả" },
            { value: "pending", label: "Chờ xác nhận" },
            { value: "confirmed", label: "Đã xác nhận" },
            { value: "completed", label: "Hoàn thành" },
            { value: "cancelled", label: "Đã hủy" },
          ].map((item) => {
            const active = statusFilter === item.value;
            return (
              <button
                key={item.value}
                onClick={() =>
                  onStatusFilterChange(item.value as AppointmentStatus | "all")
                }
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-[#0058bc] bg-[#0058bc] text-white shadow-[0_8px_20px_rgba(0,88,188,.18)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
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
                  Lịch trình của bạn
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    Lịch hẹn sắp tới
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
                + Thêm lịch hẹn
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
              <AppointmentsEmptyState text="Bạn chưa có lịch hẹn sắp tới." />
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
