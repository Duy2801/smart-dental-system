"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { SpinnerGap, X } from "@phosphor-icons/react";
import type { ScheduleAppointment, AppointmentStatus, TimeOffRecord } from "./types";
import { statusConfig } from "./types";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";

type Props = {
  weekDays: { date: string; day: string; isToday: boolean; iso: string }[];
  appointments: ScheduleAppointment[];
  timeOffs: TimeOffRecord[];
  loading: boolean;
  onStatusChange: (id: string, action: "start" | "complete") => Promise<void>;
  onDeleteTimeOff: (id: string) => Promise<void>;
};

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

function parseHm(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h + m / 60;
}

function getGridRowFromIso(isoDate: string) {
  const d = new Date(isoDate);
  const h = d.getHours() + d.getMinutes() / 60;
  return (h - 7) * 2 + 1;
}

function getGridRowFromHm(hm: string) {
  return (parseHm(hm) - 7) * 2 + 1;
}

function getDuration(durationMin: number) {
  return (durationMin / 60) * 2;
}

export function WeekCalendar({
  weekDays,
  appointments,
  timeOffs,
  loading,
  onStatusChange,
  onDeleteTimeOff,
}: Props) {
  const [selected, setSelected] = useState<ScheduleAppointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteTimeOff(id: string) {
    if (!confirm("Xóa đăng ký nghỉ này?")) return;
    setDeletingId(id);
    try {
      await onDeleteTimeOff(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
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

        <div className="relative h-[620px] overflow-y-auto bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <SpinnerGap size={28} className="animate-spin text-brand" />
            </div>
          )}
          <div
            className="grid grid-cols-8"
            style={{ gridTemplateRows: `repeat(${hours.length * 2}, 72px)` }}
          >
            {hours.map((hour, idx) => (
              <div
                key={hour}
                className="col-start-1 border-r border-b border-border/30 bg-white pr-3 pt-1 text-right font-mono text-[11px] text-muted-foreground/60"
                style={{ gridRow: `${idx * 2 + 1} / span 2` }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}

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
                    className="h-[144px] w-full border-b border-border/20"
                  />
                ))}
              </div>
            ))}

            {timeOffs.map((off) => {
              const dayIdx = weekDays.findIndex((d) => d.iso === off.dayIso);
              if (dayIdx < 0) return null;
              const start = Math.max(7, parseHm(off.startTime));
              const end = Math.min(19, parseHm(off.endTime));
              if (end <= start) return null;
              const gridRow = getGridRowFromHm(off.startTime);
              const span = (end - start) * 2;
              return (
                <div
                  key={off.id}
                  className="relative m-0.5 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-100/90 p-2 text-xs text-slate-600"
                  style={{
                    gridColumn: dayIdx + 2,
                    gridRow: `${Math.max(1, Math.round(gridRow))} / span ${Math.max(1, Math.round(span))}`,
                  }}
                  title={off.reason ?? "Nghỉ"}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="block font-semibold leading-tight">Nghỉ</span>
                      <span className="block font-mono text-[10px] opacity-70">
                        {off.startTime}-{off.endTime}
                      </span>
                      {off.reason && (
                        <span className="mt-0.5 block truncate text-[10px] opacity-80">
                          {off.reason}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === off.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteTimeOff(off.id);
                      }}
                      className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                      title="Xóa nghỉ"
                    >
                      {deletingId === off.id ? (
                        <SpinnerGap size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {(() => {
              const placed: { dayIdx: number; start: number; end: number }[] = [];
              const sorted = [...appointments].sort(
                (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
              );

              return sorted.map((apt) => {
                const dayIdx = weekDays.findIndex((d) => d.iso === apt.dayIso);
                if (dayIdx < 0) return null;
                const config = statusConfig[apt.status as AppointmentStatus] ?? statusConfig.PENDING;
                const gridRow = getGridRowFromIso(apt.scheduledAt);
                const span = getDuration(apt.durationMinutes);

                // Tính toán overlap
                const overlaps = placed.filter(
                  (p) => p.dayIdx === dayIdx && p.start < gridRow + span && p.end > gridRow
                );
                const colIndex = overlaps.length;
                placed.push({ dayIdx, start: gridRow, end: gridRow + span });

                return (
                  <div
                    key={apt.id}
                    onClick={() => setSelected(apt)}
                    className={cn(
                      "cursor-pointer overflow-hidden rounded-xl p-1.5 px-2 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md border-[1.5px] border-white",
                      config.color,
                      config.ring,
                      selected?.id === apt.id ? "ring-2 ring-brand z-30" : "z-10",
                    )}
                    style={{
                      gridColumn: dayIdx + 2,
                      gridRow: `${Math.max(1, Math.round(gridRow))} / span ${Math.max(1, Math.round(span))}`,
                      width: `calc(100% - ${colIndex * 12 + 2}px)`,
                      marginLeft: "2px",
                      position: "relative",
                      zIndex: selected?.id === apt.id ? 30 : 10 + colIndex,
                    }}
                    title={`${apt.patientName} - ${apt.serviceName}`}
                  >
                    <span className="mb-1 block font-mono text-[10px] opacity-70 leading-none">
                      {new Date(apt.scheduledAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="block truncate font-semibold text-[13px] leading-tight text-slate-900">
                      {apt.patientName}
                    </span>
                    <span className="block truncate text-[11px] leading-tight opacity-80 mt-0.5">
                      {apt.serviceName}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

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
