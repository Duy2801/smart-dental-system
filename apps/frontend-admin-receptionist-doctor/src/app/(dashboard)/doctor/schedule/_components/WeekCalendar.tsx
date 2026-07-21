"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { SpinnerGap } from "@phosphor-icons/react";
import type { ScheduleAppointment, AppointmentStatus } from "./types";
import { statusConfig } from "./types";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";

type Props = {
  weekDays: { date: string; day: string; isToday: boolean; iso: string }[];
  appointments: ScheduleAppointment[];
  loading: boolean;
  onStatusChange: (id: string, action: "start" | "complete") => Promise<void>;
};

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

function formatHour(h: number) {
  const hh = Math.floor(h).toString().padStart(2, "0");
  const mm = h % 1 === 0.5 ? "30" : "00";
  return `${hh}:${mm}`;
}

function getGridRow(isoDate: string) {
  const d = new Date(isoDate);
  const h = d.getHours() + d.getMinutes() / 60;
  return (h - 7) * 2 + 1;
}

function getDuration(isoStart: string, durationMin: number) {
  return (durationMin / 60) * 2;
}

export function WeekCalendar({ weekDays, appointments, loading, onStatusChange }: Props) {
  const [selected, setSelected] = useState<ScheduleAppointment | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-border bg-slate-50/50">
          <div className="flex items-center justify-center border-r border-border p-4">
            <span className="text-xs font-semibold text-muted-foreground">
              GMT+7
            </span>
          </div>
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="border-r border-border/40 p-4 text-center last:border-r-0"
            >
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wider",
                  day.isToday ? "text-brand" : "text-muted-foreground",
                )}
              >
                {day.day}
              </span>
              <div
                className={cn(
                  "mt-1 text-sm font-bold",
                  day.isToday ? "text-brand" : "text-slate-900",
                )}
              >
                {day.date}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative h-[620px] overflow-y-auto bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <SpinnerGap size={28} className="animate-spin text-brand" />
            </div>
          )}
          <div
            className="grid grid-cols-8"
            style={{ gridTemplateRows: `repeat(${hours.length * 2}, 30px)` }}
          >
            {/* Time labels */}
            {hours.map((hour, idx) => (
              <div
                key={hour}
                className="col-start-1 border-r border-b border-border/30 bg-white pr-3 pt-1 text-right font-mono text-[11px] text-muted-foreground/60"
                style={{ gridRow: `${idx * 2 + 1} / span 2` }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}

            {/* Day column backgrounds */}
            {weekDays.map((day, dayIdx) => (
              <div
                key={`col-${dayIdx}`}
                className={cn(
                  "relative border-r border-border/30 last:border-r-0",
                  day.isToday && "bg-brand/[0.02]",
                )}
                style={{
                  gridColumn: dayIdx + 2,
                  gridRow: `1 / span ${hours.length * 2}`,
                }}
              >
                {hours.map((_, hIdx) => (
                  <div
                    key={hIdx}
                    className="h-[60px] w-full border-b border-border/20"
                  />
                ))}
              </div>
            ))}

            {/* Appointments */}
            {appointments.map((apt) => {
              const dayIdx = weekDays.findIndex((d) => d.iso === apt.dayIso);
              if (dayIdx < 0) return null;
              const config = statusConfig[apt.status as AppointmentStatus] ?? statusConfig.PENDING;
              const gridRow = getGridRow(apt.scheduledAt);
              const span = getDuration(apt.scheduledAt, apt.durationMinutes);
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelected(apt)}
                  className={cn(
                    "m-0.5 cursor-pointer overflow-hidden rounded-xl p-2 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:z-10 relative",
                    config.color,
                    config.ring,
                    selected?.id === apt.id && "ring-2 ring-brand",
                  )}
                  style={{
                    gridColumn: dayIdx + 2,
                    gridRow: `${gridRow} / span ${Math.max(1, Math.round(span))}`,
                  }}
                  title={`${apt.patientName} — ${apt.serviceName}`}
                >
                  <span className="mb-0.5 block font-mono text-[10px] opacity-70 leading-none">
                    {new Date(apt.scheduledAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="block truncate font-semibold text-[13px] leading-tight text-slate-900">
                    {apt.patientName}
                  </span>
                  <span className="block truncate text-[11px] leading-tight opacity-80">
                    {apt.serviceName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <AppointmentDetailPanel
          appointment={selected}
          onClose={() => setSelected(null)}
          onStatusChange={async (id, action) => {
            await onStatusChange(id, action);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
