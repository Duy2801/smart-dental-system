"use client";

import { useState } from "react";
import type { AppointmentItem } from "../../api";
import { AppointmentRecordCard } from "./AppointmentRecordCard";
import { AppointmentDetailModal } from "./AppointmentDetailModal";

const ITEMS_PER_PAGE = 4;

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

        {/* History Item Cards (Render using AppointmentRecordCard component) */}
        <div className="space-y-3">
          {pagedHistory.map((appointment) => (
            <AppointmentRecordCard
              key={appointment.id}
              appointment={appointment}
              onViewDetail={() => setSelectedAppointment(appointment)}
            />
          ))}
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
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
                    className={`h-7 w-7 text-xs font-bold rounded-lg transition cursor-pointer ${
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
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
