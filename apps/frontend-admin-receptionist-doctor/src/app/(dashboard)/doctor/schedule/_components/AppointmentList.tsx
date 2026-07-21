"use client";

import { cn } from "@/src/lib/utils/cn";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; ring: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-amber-50 text-amber-700",
    ring: "ring-1 ring-inset ring-amber-600/20",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-blue-50 text-blue-700",
    ring: "ring-1 ring-inset ring-blue-600/20",
  },
  CHECKED_IN: {
    label: "Đã check-in",
    color: "bg-violet-50 text-violet-700",
    ring: "ring-1 ring-inset ring-violet-600/20",
  },
  IN_PROGRESS: {
    label: "Đang khám",
    color: "bg-orange-50 text-orange-700",
    ring: "ring-1 ring-inset ring-orange-600/20",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    color: "bg-green-50 text-green-700",
    ring: "ring-1 ring-inset ring-green-600/20",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700",
    ring: "ring-1 ring-inset ring-red-600/10",
  },
  NO_SHOW: {
    label: "Không đến",
    color: "bg-slate-50 text-slate-700",
    ring: "ring-1 ring-inset ring-slate-600/20",
  },
};

const APPOINTMENTS = [
  {
    id: "1",
    startTime: "08:00",
    endTime: "09:00",
    patient: "Nguyễn Văn A",
    patientCode: "BN-2001",
    phone: "0901234567",
    service: "Khám tổng quát",
    status: "COMPLETED" as AppointmentStatus,
  },
  {
    id: "2",
    startTime: "09:30",
    endTime: "10:30",
    patient: "Trần Thị B",
    patientCode: "BN-2002",
    phone: "0911223344",
    service: "Nhổ răng khôn",
    status: "COMPLETED" as AppointmentStatus,
  },
  {
    id: "3",
    startTime: "11:00",
    endTime: "12:00",
    patient: "Phạm Dũng",
    patientCode: "BN-2003",
    phone: "0977001122",
    service: "Tái khám niềng răng",
    status: "CHECKED_IN" as AppointmentStatus,
  },
  {
    id: "4",
    startTime: "14:00",
    endTime: "15:30",
    patient: "Hoàng Oanh",
    patientCode: "BN-2004",
    phone: "0933445566",
    service: "Cấy ghép Implant",
    status: "CONFIRMED" as AppointmentStatus,
  },
  {
    id: "5",
    startTime: "15:30",
    endTime: "16:30",
    patient: "Lê Cường",
    patientCode: "BN-2005",
    phone: "0944556677",
    service: "Tẩy trắng răng",
    status: "PENDING" as AppointmentStatus,
  },
];

export function AppointmentList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = APPOINTMENTS.filter((apt) => {
    const matchSearch =
      apt.patient.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || apt.status === statusFilter;
    return matchSearch && matchStatus;
  });

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

      <div className="divide-y divide-border/40">
        {filtered.map((apt) => {
          const config = statusConfig[apt.status];
          return (
            <div
              key={apt.id}
              className="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex items-start gap-5 sm:w-2/5">
                <div className="w-20 shrink-0">
                  <p className="font-mono text-sm font-bold text-brand-dark">
                    {apt.startTime}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {apt.endTime}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {apt.patient}
                    </span>
                    <span className="rounded-md border border-border/40 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {apt.patientCode}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {apt.phone}
                  </p>
                </div>
              </div>

              <div className="sm:w-1/4">
                <p className="text-sm font-medium text-slate-900">
                  {apt.service}
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

                <div className="w-[120px] flex justify-end">
                  {apt.status === "CHECKED_IN" && (
                    <button className="rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-brand-dark hover:shadow-sm active:scale-[0.98]">
                      Bắt đầu khám
                    </button>
                  )}
                  {apt.status === "IN_PROGRESS" && (
                    <button className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-orange-600 active:scale-[0.98]">
                      Kết thúc
                    </button>
                  )}
                  {apt.status === "CONFIRMED" && (
                    <button className="rounded-lg border border-border bg-white px-4 py-1.5 text-xs font-medium text-brand-dark transition-all hover:bg-slate-50 active:scale-[0.98]">
                      Xem
                    </button>
                  )}
                  {apt.status === "COMPLETED" && (
                    <button className="rounded-lg border border-border bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-slate-50 opacity-60 group-hover:opacity-100 active:scale-[0.98]">
                      Xem hồ sơ
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-b-2xl border-t border-border bg-slate-50/30 p-4 text-center text-xs text-muted-foreground sm:px-6">
        Hiển thị {filtered.length}/{APPOINTMENTS.length} lịch hẹn
      </div>
    </div>
  );
}
