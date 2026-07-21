"use client";

import { useState } from "react";
import { MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import type { ScheduleAppointment, AppointmentStatus } from "./types";
import { statusConfig } from "./types";

type Props = {
  appointments: ScheduleAppointment[];
  loading: boolean;
  onStatusChange: (id: string, action: "start" | "complete") => Promise<void>;
};

export function AppointmentList({ appointments, loading, onStatusChange }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = appointments.filter((apt) => {
    const matchSearch =
      apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || apt.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleAction(id: string, action: "start" | "complete") {
    setActionLoading(`${id}-${action}`);
    try {
      await onStatusChange(id, action);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-3 rounded-t-2xl border-b border-border bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="relative w-full max-w-xs">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm tên hoặc mã BN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border py-1.5 px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CHECKED_IN">Đã check-in</option>
          <option value="IN_PROGRESS">Đang khám</option>
          <option value="COMPLETED">Đã hoàn thành</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <SpinnerGap size={28} className="animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <p className="text-sm font-medium">Không có lịch hẹn nào</p>
          <p className="text-xs">Thử thay đổi bộ lọc hoặc tuần khác.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((apt) => {
            const config = statusConfig[apt.status as AppointmentStatus] ?? statusConfig.PENDING;
            const scheduled = new Date(apt.scheduledAt);
            const end = new Date(scheduled.getTime() + apt.durationMinutes * 60000);
            const startStr = scheduled.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            const endStr = end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            const dateStr = scheduled.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

            return (
              <div
                key={apt.id}
                className="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-start gap-5 sm:w-2/5">
                  <div className="w-24 shrink-0">
                    <p className="font-mono text-sm font-bold text-brand-dark">
                      {startStr}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {endStr} · {dateStr}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {apt.patientName}
                      </span>
                      <span className="rounded-md border border-border/40 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {apt.patientCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {apt.patientPhone}
                    </p>
                  </div>
                </div>

                <div className="sm:w-1/4">
                  <p className="text-sm font-medium text-slate-900">
                    {apt.serviceName}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:w-1/3 sm:justify-end">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider",
                      config.color,
                      config.ring,
                    )}
                  >
                    {config.label}
                  </span>

                  <div className="w-[130px] flex justify-end">
                    {apt.status === "CHECKED_IN" && (
                      <button
                        disabled={actionLoading === `${apt.id}-start`}
                        onClick={() => handleAction(apt.id, "start")}
                        className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-brand-dark hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
                      >
                        {actionLoading === `${apt.id}-start` && (
                          <SpinnerGap size={12} className="animate-spin" />
                        )}
                        Bắt đầu khám
                      </button>
                    )}
                    {apt.status === "IN_PROGRESS" && (
                      <button
                        disabled={actionLoading === `${apt.id}-complete`}
                        onClick={() => handleAction(apt.id, "complete")}
                        className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
                      >
                        {actionLoading === `${apt.id}-complete` && (
                          <SpinnerGap size={12} className="animate-spin" />
                        )}
                        Kết thúc
                      </button>
                    )}
                    {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                      <span className="rounded-lg border border-border bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground opacity-60">
                        Chờ check-in
                      </span>
                    )}
                    {apt.status === "COMPLETED" && (
                      <span className="rounded-lg border border-border bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground opacity-60 group-hover:opacity-100">
                        Hoàn thành
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-b-2xl border-t border-border bg-slate-50/30 p-4 text-center text-xs text-muted-foreground sm:px-6">
        Hiển thị {filtered.length}/{appointments.length} lịch hẹn trong tuần
      </div>
    </div>
  );
}
