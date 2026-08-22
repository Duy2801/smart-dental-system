"use client";

import { useState } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { AppointmentRecordCard } from "./AppointmentRecordCard";
import { AppointmentHistoryList } from "./AppointmentHistoryList";
import { useAppointmentWorkspaceView } from "../../hooks/useAppointmentWorkspaceView";
import { AppointmentWorkspaceHeader } from "../AppointmentWorkspaceHeader";

type ManageModeViewProps = {
  appointments: AppointmentItem[];
  upcoming: AppointmentItem[];
  historyItems: AppointmentItem[];
  loading: boolean;
  onOpenBooking: () => void;
  onReschedule: (appointment: AppointmentItem) => void;
  onCancelAppointment: (appointmentId: string) => void;
  cancellingAppointmentId: string | null;
};

export function ManageModeView({
  appointments,
  upcoming,
  historyItems,
  loading,
  onOpenBooking,
  onReschedule,
  onCancelAppointment,
  cancellingAppointmentId,
}: ManageModeViewProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  const { filteredUpcoming, history } = useAppointmentWorkspaceView({
    upcoming,
    historyItems,
    query,
    statusFilter,
  });

  const filterTabs: { value: AppointmentStatus | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <AppointmentWorkspaceHeader
        mode="manage"
        title="Quản lý lịch hẹn"
        subtitle="Theo dõi lịch khám sắp tới, đổi lịch hoặc xem lịch sử các lần thăm khám nha khoa."
        onSelectManage={() => {}}
        onSelectBooking={onOpenBooking}
      />

      {/* Main Container - Upcoming & Active Appointments */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Danh Sách Lịch Khám Nha Khoa Của Tôi
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-[#0058bc] border border-blue-100">
              {filteredUpcoming.length} cuộc hẹn
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Quản lý các cuộc hẹn khám trực tiếp tại phòng khám nha khoa
          </p>
        </div>

        {/* Filters & Search Controls Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-50/80 p-4 rounded-xl border border-slate-100">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((item) => {
              const active = statusFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-[#0058bc] text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#0058bc]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <DashboardIcon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo bác sĩ, dịch vụ..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredUpcoming.length > 0 ? (
          <div className="space-y-4">
            {filteredUpcoming.map((item) => (
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
          <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <DashboardIcon name="calendar" className="mx-auto h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Bạn chưa có lịch hẹn sắp tới nào.</p>
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0058bc] text-white rounded-xl text-xs font-bold hover:bg-[#004899] transition shadow-xs"
            >
              <DashboardIcon name="calendar" className="h-3.5 w-3.5" />
              Đặt Lịch Khám Ngay
            </button>
          </div>
        )}
      </section>

      {/* History Section at Bottom */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <AppointmentHistoryList history={history} />
      </section>
    </main>
  );
}
