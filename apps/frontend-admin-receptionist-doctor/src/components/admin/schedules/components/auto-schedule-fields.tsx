import type { Dispatch, SetStateAction } from "react";
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
  setForm,
  toggleSelectedDay,
}: AutoScheduleFieldsProps) {
  const selectedOpenDays = form.selectedDays
    .map((dayId) => businessHours.find((day) => day.id === dayId))
    .filter((day): day is BusinessHour => Boolean(day?.isOpen));

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-brand-dark">
          Ap dung cho
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekDays.map((day) => {
            const selected = form.selectedDays.includes(day.index);
            const businessHour = businessHours.find(
              (hour) => hour.id === day.index,
            );
            const disabled = !businessHour?.isOpen;

            return (
              <button
                key={day.index}
                type="button"
                disabled={disabled}
                onClick={() => toggleSelectedDay(day.index)}
                title={
                  businessHour?.isOpen
                    ? `${businessHour.start} - ${businessHour.end}`
                    : "Phong kham nghi"
                }
                className={cn(
                  "h-10 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
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
          Che do luu
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "REPLACE", label: "Thay the" },
            { value: "APPEND", label: "Them vao" },
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

      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <p className="text-sm font-semibold text-brand-dark">
          Ca se tao theo gio phong kham
        </p>
        <div className="mt-3 space-y-2">
          {selectedOpenDays.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chon it nhat mot ngay phong kham mo cua.
            </p>
          ) : null}
          {selectedOpenDays.map((day) => (
            <div
              key={day.id}
              className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium text-brand-dark">{day.label}</span>
              <span className="text-muted-foreground">
                {day.start} - {day.end}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
