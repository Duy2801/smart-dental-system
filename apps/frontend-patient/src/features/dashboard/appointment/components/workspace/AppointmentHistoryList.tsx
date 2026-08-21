"use client";

import { useState } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { AppointmentDetailModal } from "./AppointmentDetailModal";

const ITEMS_PER_PAGE = 4;

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

type AppointmentHistoryListProps = {
  history: AppointmentItem[];
};

export function AppointmentHistoryList({
  history,
}: AppointmentHistoryListProps) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedHistory = history.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (!history.length) {
    return (
      <div className="py-6 text-center text-slate-400 text-xs font-semibold">
        Bạn chưa có lịch sử cuộc hẹn nào.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Lịch Sử Khám Nha Khoa
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Nhật ký các lần thăm khám đã hoàn thành hoặc đã hủy
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {history.length} cuộc hẹn
          </span>
        </div>

        {/* History Item Cards */}
        <div className="space-y-3">
          {pagedHistory.map((appointment) => {
            const status = statusInfo[appointment.status] ?? statusInfo.completed;
            const notes = appointment.preparation ?? [];

            return (
              <article
                key={appointment.id}
                onClick={() => setSelectedAppointment(appointment)}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-2 min-w-0">
                  {/* Doctor + Service + Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-base group-hover:text-[#0058bc] transition-colors">
                      {appointment.doctor}
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {appointment.service}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${status.className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Time & Date */}
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <DashboardIcon name="clock" className="h-3.5 w-3.5 text-slate-400" />
                    <span>Thời gian khám:</span>
                    <strong className="text-slate-800 font-bold">
                      {appointment.time} - {appointment.date}
                    </strong>
                  </p>

                  {notes.length ? (
                    <p className="text-[11px] text-slate-500">
                      {notes.length} ghi chú chuẩn bị
                    </p>
                  ) : null}
                </div>

                {/* Detail CTA Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppointment(appointment);
                    }}
                    className="px-4 py-2 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-2xs group-hover:border-blue-200 group-hover:text-[#0058bc]"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 ? (
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-7 w-7 text-xs font-bold rounded-lg transition ${
                      pageNumber === currentPage
                        ? "bg-[#0058bc] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </>
  );
}
