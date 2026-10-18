"use client";

import type { Dispatch, SetStateAction } from "react";
import { Check, Clock } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { weekDays } from "../constants";
import type { ScheduleFormState } from "../types";
import type { BusinessHour } from "../../setting/types";

type AutoScheduleFieldsProps = {
  businessHours: BusinessHour[];
  form: ScheduleFormState;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  toggleSelectedDay: (dayOfWeek: number) => void;
};

export function AutoScheduleFields({
  businessHours,
  form,
  toggleSelectedDay,
}: AutoScheduleFieldsProps) {
  const selectedOpenDays = form.selectedDays
    .map((dayId) => businessHours.find((day) => day.id === dayId))
    .filter((day): day is BusinessHour => Boolean(day?.isOpen));

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate-700">Áp dụng cho các ngày</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekDays.map((day) => {
            const selected = form.selectedDays.includes(day.index);
            const businessHour = businessHours.find((hour) => hour.id === day.index);
            const disabled = !businessHour?.isOpen;

            return (
              <button
                key={day.index}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => toggleSelectedDay(day.index)}
                title={businessHour?.isOpen ? `${businessHour.start} - ${businessHour.end}` : "Phòng khám nghỉ"}
                className={cn(
                  "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                  selected
                    ? "border-brand bg-brand text-white shadow-sm shadow-brand/25"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {selected ? <Check size={14} weight="bold" /> : null}
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Clock size={16} className="text-brand" />
          Ca sẽ tạo theo giờ phòng khám
        </p>
        <div className="mt-3 space-y-1.5">
          {selectedOpenDays.length === 0 ? (
            <p className="text-sm text-slate-500">Chọn ít nhất một ngày phòng khám mở cửa.</p>
          ) : null}
          {selectedOpenDays.map((day) => (
            <div
              key={day.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 text-sm"
            >
              <span className="font-semibold text-slate-800">{day.label}</span>
              <span className="font-mono text-xs font-semibold text-brand">
                {day.start} - {day.end}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
