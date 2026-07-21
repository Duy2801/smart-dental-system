"use client";

import { cn } from "@/src/lib/utils/cn";

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

const weekDays = [
  { date: "21/07", day: "Thứ 2" },
  { date: "22/07", day: "Thứ 3" },
  { date: "23/07", day: "Thứ 4", isToday: true },
  { date: "24/07", day: "Thứ 5" },
  { date: "25/07", day: "Thứ 6" },
  { date: "26/07", day: "Thứ 7" },
  { date: "27/07", day: "Chủ Nhật" },
];

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

const mockAppointments = [
  {
    id: "1",
    dayIdx: 0,
    startHour: 8,
    duration: 1,
    patient: "Nguyễn Văn A",
    service: "Khám tổng quát",
    status: "COMPLETED" as AppointmentStatus,
  },
  {
    id: "2",
    dayIdx: 0,
    startHour: 9.5,
    duration: 1.5,
    patient: "Trần Thị B",
    service: "Nhổ răng khôn",
    status: "COMPLETED" as AppointmentStatus,
  },
  {
    id: "3",
    dayIdx: 2,
    startHour: 10,
    duration: 1,
    patient: "Phạm Dũng",
    service: "Tái khám niềng răng",
    status: "CHECKED_IN" as AppointmentStatus,
  },
  {
    id: "4",
    dayIdx: 3,
    startHour: 14,
    duration: 1.5,
    patient: "Hoàng Oanh",
    service: "Cấy ghép Implant",
    status: "CONFIRMED" as AppointmentStatus,
  },
  {
    id: "5",
    dayIdx: 4,
    startHour: 8.5,
    duration: 1,
    patient: "Lê Cường",
    service: "Tẩy trắng răng",
    status: "PENDING" as AppointmentStatus,
  },
];

function formatHour(h: number) {
  const hh = Math.floor(h).toString().padStart(2, "0");
  const mm = h % 1 === 0.5 ? "30" : "00";
  return `${hh}:${mm}`;
}

export function WeekCalendar() {
  return (
    <div className="flex h-[700px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
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
      <div className="relative flex-1 overflow-y-auto bg-white">
        <div
          className="grid grid-cols-8"
          style={{
            gridTemplateRows: `repeat(${hours.length * 2}, 30px)`,
          }}
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
          {mockAppointments.map((apt) => {
            const config = statusConfig[apt.status];
            return (
              <div
                key={apt.id}
                className={cn(
                  "m-0.5 cursor-pointer overflow-hidden rounded-xl p-2 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:z-10 relative",
                  config.color,
                  config.ring,
                )}
                style={{
                  gridColumn: apt.dayIdx + 2,
                  gridRow: (apt.startHour - 7) * 2 + 1,
                  gridRowEnd: `span ${apt.duration * 2}`,
                }}
                title={`${apt.patient} — ${apt.service}`}
              >
                <span className="mb-0.5 block font-mono text-[10px] opacity-70 leading-none">
                  {formatHour(apt.startHour)} – {formatHour(apt.startHour + apt.duration)}
                </span>
                <span className="block truncate font-semibold text-[13px] leading-tight text-slate-900">
                  {apt.patient}
                </span>
                <span className="block truncate text-[11px] leading-tight opacity-80">
                  {apt.service}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
