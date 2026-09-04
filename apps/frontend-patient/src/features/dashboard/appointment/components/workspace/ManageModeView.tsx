"use client";

import { useState } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { AppointmentRecordCard } from "./AppointmentRecordCard";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
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
  const [activeMainTab, setActiveMainTab] = useState<"upcoming" | "history">("upcoming");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [selectedDetail, setSelectedDetail] = useState<AppointmentItem | null>(null);

  const { filteredUpcoming, history } = useAppointmentWorkspaceView({
    upcoming,
    historyItems,
    query,
    statusFilter,
  });

  const filterTabsUpcoming: { value: AppointmentStatus | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
  ];

  const filterTabsHistory: { value: AppointmentStatus | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "completed", label: "Đã hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  const currentFilterTabs = activeMainTab === "upcoming" ? filterTabsUpcoming : filterTabsHistory;
  const currentList = activeMainTab === "upcoming" ? filteredUpcoming : history;
  const totalCount = activeMainTab === "upcoming" ? upcoming.length : historyItems.length;

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <AppointmentWorkspaceHeader
        mode="manage"
        title="Quản lý lịch hẹn"
        subtitle="Theo dõi lịch khám sắp tới, đổi lịch hoặc xem lịch sử các lần thăm khám nha khoa."
        onSelectManage={() => {}}
        onSelectBooking={onOpenBooking}
      />

      {/* Main Container Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-sm space-y-6">
        {/* Premium Header: Search Box on LEFT, 2 Main Tabs on RIGHT */}
        <div className="border-b border-slate-200 pb-3 flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Side: Search Box */}
          <div className="relative w-full md:w-80">
            <DashboardIcon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo bác sĩ, dịch vụ..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium outline-none transition placeholder:text-slate-400 focus:border-[#0058bc] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Side: 2 Main Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 border-b md:border-b-0 border-slate-100 pb-2 md:pb-0 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab("upcoming");
                setStatusFilter("all");
              }}
              className={`relative pb-3 text-sm sm:text-base font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === "upcoming"
                  ? "text-[#0058bc]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <DashboardIcon name="calendar" className="h-4 w-4" />
              <span>Lịch Hẹn Sắp Tới</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                  activeMainTab === "upcoming"
                    ? "bg-blue-100 text-[#0058bc]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {upcoming.length}
              </span>
              {activeMainTab === "upcoming" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0058bc] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab("history");
                setStatusFilter("all");
              }}
              className={`relative pb-3 text-sm sm:text-base font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === "history"
                  ? "text-[#0058bc]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <DashboardIcon name="document" className="h-4 w-4" />
              <span>Lịch Sử Đặt</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                  activeMainTab === "history"
                    ? "bg-blue-100 text-[#0058bc]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {historyItems.length}
              </span>
              {activeMainTab === "history" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0058bc] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Section - Completely Identical Layout for Both Tabs */}
        <div className="space-y-4">
          {/* Status Sub-Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full">
              {currentFilterTabs.map((item) => {
                const active = statusFilter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatusFilter(item.value)}
                    className={`rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-white text-[#0058bc] shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-semibold text-slate-400 self-end sm:self-auto">
              Hiển thị {currentList.length} / {totalCount} cuộc hẹn
            </span>
          </div>

          {/* Appointment Record List */}
          {loading ? (
            <div className="space-y-4 py-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : currentList.length > 0 ? (
            <div className="space-y-3">
              {currentList.map((item) => {
                const now = Date.now();
                const scheduledTime = new Date(item.scheduledAt).getTime();
                const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);
                const isUpcoming = activeMainTab === "upcoming";
                const isPendingOrConfirmed =
                  item.status === "pending" || item.status === "confirmed";

                const canCancel = isUpcoming && isPendingOrConfirmed && hoursUntil >= 12;
                const canReschedule =
                  isUpcoming &&
                  isPendingOrConfirmed &&
                  hoursUntil >= 6 &&
                  (item.rescheduleCount ?? 0) < 1;

                return (
                  <AppointmentRecordCard
                    key={item.id}
                    appointment={item}
                    onViewDetail={() => setSelectedDetail(item)}
                    onReschedule={canReschedule ? () => onReschedule(item) : undefined}
                    onCancel={
                      isUpcoming && isPendingOrConfirmed
                        ? () => onCancelAppointment(item.id)
                        : undefined
                    }
                    canCancel={canCancel}
                    isCancelling={cancellingAppointmentId === item.id}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <DashboardIcon name="calendar" className="mx-auto h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {activeMainTab === "upcoming"
                  ? "Không tìm thấy cuộc hẹn sắp tới nào."
                  : "Không tìm thấy lịch sử cuộc hẹn nào."}
              </p>
              {activeMainTab === "upcoming" && (
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0058bc] text-white rounded-xl text-xs font-bold hover:bg-[#004899] transition shadow-xs cursor-pointer"
                >
                  <DashboardIcon name="calendar" className="h-3.5 w-3.5" />
                  Đặt Lịch Khám Ngay
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </main>
  );
}
