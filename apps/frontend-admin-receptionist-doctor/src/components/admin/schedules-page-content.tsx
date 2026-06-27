"use client";

import { useState } from "react";
import { doctors, weekDays, type ShiftType } from "@/src/components/admin/mock-data";
import { cn } from "@/src/lib/utils/cn";

const shiftLabels: Record<ShiftType, string> = {
  morning: "Sáng",
  afternoon: "Chiều",
  evening: "Tối",
  off: "Nghỉ",
};

const shiftColors: Record<ShiftType, string> = {
  morning: "bg-brand-light text-brand-dark",
  afternoon: "bg-brand/20 text-brand-dark",
  evening: "bg-brand-dark/10 text-brand-dark",
  off: "bg-red-50 text-red-600",
};

const initialSchedule: ShiftType[][] = [
  ["morning", "morning", "afternoon", "morning", "morning", "morning", "off"],
  ["afternoon", "off", "morning", "afternoon", "off", "off", "off"],
  ["morning", "morning", "morning", "morning", "afternoon", "morning", "off"],
];

export function SchedulesPageContent() {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [schedule, setSchedule] = useState<ShiftType[]>(initialSchedule[0] ?? []);

  const cycleShift = (index: number) => {
    const order: ShiftType[] = ["morning", "afternoon", "evening", "off"];
    setSchedule((prev) => {
      const next = [...prev];
      const current = next[index] ?? "off";
      const idx = order.indexOf(current);
      next[index] = order[(idx + 1) % order.length] ?? "off";
      return next;
    });
  };

  const onDoctorChange = (id: string) => {
    setDoctorId(id);
    const idx = doctors.findIndex((d) => d.id === id);
    setSchedule(initialSchedule[idx] ?? initialSchedule[0] ?? []);
  };

  return (
    <div className="space-y-4 p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={doctorId}
          onChange={(e) => onDoctorChange(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand sm:max-w-xs"
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-muted">Thêm ca</button>
          <button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Lưu lịch</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(shiftLabels) as ShiftType[]).map((key) => (
          <span key={key} className={cn("rounded-full px-2.5 py-1 font-medium", shiftColors[key])}>
            {shiftLabels[key]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {weekDays.map((day, i) => (
          <button
            key={day}
            type="button"
            onClick={() => cycleShift(i)}
            className="rounded-xl border border-border bg-white p-4 text-left transition-colors hover:border-brand"
          >
            <p className="text-xs font-semibold text-muted-foreground">{day}</p>
            <p className={cn("mt-2 rounded-lg px-2 py-1 text-center text-xs font-medium", shiftColors[schedule[i] ?? "off"])}>
              {shiftLabels[schedule[i] ?? "off"]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
