import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { AppointmentRecordCard } from "./AppointmentRecordCard";
import { AppointmentsEmptyState } from "./AppointmentsEmptyState";
import { AppointmentHistoryList } from "./AppointmentHistoryList";
import { T } from "../../../common/typography";

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
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,.04)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className={`inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 ${T.overline} text-[#0058bc]`}>
              <DashboardIcon name="calendar" className="h-4 w-4" />
              Appointment
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.15rem]">
              Quản lý lịch hẹn
            </h1>
            <p className={`mt-2 max-w-2xl ${T.body}`}>
              Bố cục gọn, rõ thao tác, tối ưu để nhìn nhanh lịch sắp tới và xử lý
              ngay trên cả desktop lẫn mobile.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenBooking}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0058bc] px-5 text-sm font-bold text-white transition hover:bg-[#064ea3]"
            >
              <span className="text-lg leading-none">+</span>
              Đặt lịch mới
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(15,23,42,.04)] sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className={`${T.fieldLabel}`}>Tổng lịch</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{appointments.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className={`${T.fieldLabel}`}>Sắp tới</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{upcoming.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className={`${T.fieldLabel}`}>Chờ xác nhận</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {appointments.filter((item) => item.status === "pending").length}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.04)]">
          <p className={`${T.fieldLabel}`}>Tìm kiếm</p>
          <div className="relative mt-3">
            <DashboardIcon
              name="search"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm theo bác sĩ hoặc dịch vụ..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <p className={`mt-4 ${T.fieldLabel}`}>Trạng thái</p>
          <label className="relative mt-3 block">
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
              className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="missed">Vắng mặt</option>
              <option value="rescheduled">Đã đổi lịch</option>
            </select>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ" },
              { value: "confirmed", label: "Xác nhận" },
              { value: "completed", label: "Xong" },
              { value: "cancelled", label: "Hủy" },
            ].map((item) => {
              const active = statusFilter === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() =>
                    onStatusFilterChange(item.value as AppointmentStatus | "all")
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${active
                    ? "border-[#0058bc] bg-[#0058bc] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
            <p className={`${T.fieldLabel}`}>
              Lịch gần nhất
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {upcoming[0]
                ? `${upcoming[0].date} lúc ${upcoming[0].time} với ${upcoming[0].doctor}.`
                : "Bạn chưa có lịch hẹn sắp tới."}
            </p>
          </div>
        </aside>

        <div className="space-y-5">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-[24px] bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className={`${T.fieldLabel}`}>
                      Lịch sắp tới
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      Các cuộc hẹn gần nhất
                    </h2>
                  </div>
                </div>

                {upcoming.length ? (
                  <div className="grid gap-4">
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

              <section>
                <AppointmentHistoryList history={history} />
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
