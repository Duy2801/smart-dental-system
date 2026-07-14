import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/src/lib/utils/cn";
import { weekDays } from "../constants";
import type { ScheduleFormState } from "../types";

type AutoScheduleFieldsProps = {
  addAutoShift: () => void;
  form: ScheduleFormState;
  removeAutoShift: (index: number) => void;
  setAutoShift: (
    index: number,
    key: "startTime" | "endTime",
    value: string,
  ) => void;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  toggleSelectedDay: (dayOfWeek: number) => void;
};

export function AutoScheduleFields({
  addAutoShift,
  form,
  removeAutoShift,
  setAutoShift,
  setForm,
  toggleSelectedDay,
}: AutoScheduleFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-brand-dark">
          Áp dụng cho
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekDays.map((day) => {
            const selected = form.selectedDays.includes(day.index);

            return (
              <button
                key={day.index}
                type="button"
                onClick={() => toggleSelectedDay(day.index)}
                className={cn(
                  "h-10 rounded-lg border px-3 text-sm font-semibold transition-colors",
                  selected
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-brand-dark hover:bg-muted",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-brand-dark">
          Chế độ lưu
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "REPLACE", label: "Thay thế" },
            { value: "APPEND", label: "Thêm vào" },
          ].map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  autoMode: mode.value as "REPLACE" | "APPEND",
                }))
              }
              className={cn(
                "h-10 rounded-lg border px-3 text-sm font-semibold transition-colors",
                form.autoMode === mode.value
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-border bg-white text-muted-foreground hover:bg-muted",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-brand-dark">
            Ca làm việc
          </label>
          <button
            type="button"
            onClick={addAutoShift}
            className="text-sm font-semibold text-brand hover:text-brand-dark"
          >
            + Thêm ca
          </button>
        </div>

        {form.autoShifts.map((shift, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              type="time"
              value={shift.startTime}
              onChange={(event) =>
                setAutoShift(index, "startTime", event.target.value)
              }
              required
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <input
              type="time"
              value={shift.endTime}
              onChange={(event) =>
                setAutoShift(index, "endTime", event.target.value)
              }
              required
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => removeAutoShift(index)}
              disabled={form.autoShifts.length === 1}
              className="h-11 w-11 rounded-lg border border-border bg-white text-lg font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Xóa ca"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
