"use client";

import { useState } from "react";
import { X, Clock, User, Stethoscope, Hash, Phone, SpinnerGap } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import type { ScheduleAppointment, AppointmentStatus } from "./types";
import { statusConfig } from "./types";

type Props = {
  appointment: ScheduleAppointment;
  onClose: () => void;
  onStatusChange: (id: string, action: "start" | "complete") => Promise<void>;
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AppointmentDetailPanel({ appointment: apt, onClose, onStatusChange }: Props) {
  const [loading, setLoading] = useState<"start" | "complete" | null>(null);
  const config = statusConfig[apt.status as AppointmentStatus] ?? statusConfig.PENDING;

  const scheduledDate = new Date(apt.scheduledAt);
  const endDate = new Date(scheduledDate.getTime() + apt.durationMinutes * 60000);

  async function handleAction(action: "start" | "complete") {
    setLoading(action);
    try {
      await onStatusChange(apt.id, action);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="w-72 shrink-0 rounded-2xl border border-border bg-white shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-dark">Chi tiết lịch hẹn</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Status badge */}
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            config.color,
            config.ring,
          )}
        >
          {config.label}
        </span>

        {/* Info rows */}
        <div className="flex flex-col gap-3.5">
          <InfoRow
            icon={<Hash size={15} />}
            label="Mã lịch hẹn"
            value={apt.appointmentCode}
          />
          <InfoRow
            icon={<Clock size={15} />}
            label="Thời gian"
            value={`${scheduledDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} (${apt.durationMinutes} phút)`}
          />
          <InfoRow
            icon={<User size={15} />}
            label="Bệnh nhân"
            value={`${apt.patientName} (${apt.patientCode})`}
          />
          <InfoRow
            icon={<Phone size={15} />}
            label="Số điện thoại"
            value={apt.patientPhone || "—"}
          />
          <InfoRow
            icon={<Stethoscope size={15} />}
            label="Dịch vụ"
            value={apt.serviceName}
          />
        </div>

        {apt.notes && (
          <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <span className="font-medium">Ghi chú: </span>{apt.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {apt.status === "CHECKED_IN" && (
            <button
              onClick={() => handleAction("start")}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-60"
            >
              {loading === "start" && <SpinnerGap size={14} className="animate-spin" />}
              {loading === "start" ? "Đang xử lý..." : "Bắt đầu khám"}
            </button>
          )}
          {apt.status === "IN_PROGRESS" && (
            <button
              onClick={() => handleAction("complete")}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:opacity-60"
            >
              {loading === "complete" && <SpinnerGap size={14} className="animate-spin" />}
              {loading === "complete" ? "Đang xử lý..." : "Kết thúc khám"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
