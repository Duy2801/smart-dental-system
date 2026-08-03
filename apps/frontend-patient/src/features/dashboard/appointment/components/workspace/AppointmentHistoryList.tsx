"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppointmentItem, AppointmentStatus } from "../../api";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { AppointmentsEmptyState } from "./AppointmentsEmptyState";
import { T } from "../../../common/typography";

const ITEMS_PER_PAGE = 4;

const statusInfo: Record<
  AppointmentStatus,
  { label: string; className: string; tone: string }
> = {
  confirmed: {
    label: "Đã xác nhận",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    tone: "bg-emerald-500",
  },
  pending: {
    label: "Chờ xác nhận",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    tone: "bg-amber-500",
  },
  completed: {
    label: "Hoàn thành",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    tone: "bg-blue-500",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    tone: "bg-rose-500",
  },
  missed: {
    label: "Vắng mặt",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    tone: "bg-slate-400",
  },
  in_progress: {
    label: "Đang khám",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    tone: "bg-cyan-500",
  },
  rescheduled: {
    label: "Đã đổi lịch",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    tone: "bg-violet-500",
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

  useEffect(() => {
    if (!selectedAppointment) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [selectedAppointment]);

  const mappedHistory = useMemo(() => {
    return history.map((appointment) => {
      const dateMatch = appointment.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);

      return {
        appointment,
        day: dateMatch?.[1] ?? "--",
        month: dateMatch?.[2] ?? "--",
        year: dateMatch?.[3] ?? "----",
      };
    });
  }, [history]);

  const totalPages = Math.max(1, Math.ceil(mappedHistory.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedHistory = mappedHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (!history.length) {
    return <AppointmentsEmptyState text="Chưa có lịch sử cuộc hẹn phù hợp." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.05)]">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`${T.fieldLabel}`}>
                Nhật ký thăm khám
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Lịch sử cuộc hẹn
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{mappedHistory.length} cuộc hẹn</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Nhấn vào từng dòng để xem chi tiết</span>
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-[120px_minmax(0,1.4fr)_150px_170px_140px] gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span>Ngày hẹn</span>
          <span>Dịch vụ & bác sĩ</span>
          <span>Giờ khám</span>
          <span>Chuẩn bị</span>
          <span className="text-right">Chi tiết</span>
        </div>

        <div className="divide-y divide-slate-100">
          {pagedHistory.map(({ appointment, day, month, year }) => {
            const status = statusInfo[appointment.status];

            return (
              <button
                key={appointment.id}
                type="button"
                onClick={() => setSelectedAppointment(appointment)}
                className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[120px_minmax(0,1.4fr)_150px_170px_140px] lg:items-center lg:px-6"
              >
                <div className="flex items-center gap-3">
                  <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 text-center shadow-sm">
                    <p className="bg-[#0a5fbe] px-3 py-1 text-[10px] font-bold uppercase text-white">
                      Tháng {month}
                    </p>
                    <p className="px-3 pt-2 text-2xl font-bold leading-none text-[#0a5fbe]">
                      {day}
                    </p>
                    <p className="px-3 pb-2 pt-1 text-[11px] text-slate-500">
                      {year}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0a5fbe] to-cyan-400 text-sm font-bold text-white">
                          {appointment.initials}
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-base font-bold text-slate-900">
                            {appointment.service}
                          </h4>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {appointment.doctor}
                          </p>
                        </div>
                      </div>
                    </div>

                  <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-bold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0a5fbe]">
                    <DashboardIcon name="clock" className="h-4 w-4" />
                  </span>
                  {appointment.time}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
                    <DashboardIcon name="document" className="h-4 w-4" />
                  </span>
                  <span className="truncate">
                    {appointment.preparation?.length
                      ? `${appointment.preparation.length} ghi chú chuẩn bị`
                      : "Không có ghi chú"}
                  </span>
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0a5fbe]">
                    Xem chi tiết
                    <DashboardIcon name="chevron" className="h-4 w-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition ${
                      pageNumber === currentPage
                        ? "bg-[#0a5fbe] text-white shadow-lg shadow-blue-100"
                        : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedAppointment ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[4px]"
          role="presentation"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.25)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`${T.fieldLabel} text-[#0a5fbe]`}>
                  Chi tiết lịch hẹn
                </p>
                <h4 className="mt-2 text-2xl font-bold text-slate-900">
                  {selectedAppointment.service}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="text-sm font-bold text-slate-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
