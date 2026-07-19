import { SkeletonRows } from "@/src/components/admin/common";
import { weekDays } from "../constants";
import { ScheduleChip } from "./schedule-chip";
import type { AvailabilityResponse } from "../types";
import type { BusinessHour } from "../../setting/types";

type ScheduleTableProps = {
  businessHours: BusinessHour[];
  loading: boolean;
  onAddDay: (dayOfWeek: number) => void;
  onRemove: (id: string) => void;
  schedule: AvailabilityResponse | null;
};

export function ScheduleTable({
  businessHours,
  loading,
  onAddDay,
  onRemove,
  schedule,
}: ScheduleTableProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-white">
      {loading ? (
        <SkeletonRows count={7} />
      ) : (
        weekDays.map((day) => {
          const daySchedule = schedule?.weekly.find(
            (item) => item.dayOfWeek === day.index,
          );
          const businessHour = businessHours.find(
            (hour) => hour.id === day.index,
          );
          const canAddShift = Boolean(businessHour?.isOpen);
          const shifts = daySchedule?.shifts ?? [];
          const timeOff = daySchedule?.timeOff ?? [];

          return (
            <div
              key={day.index}
              className="flex min-h-24 flex-col gap-4 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-start"
            >
              <div className="flex w-36 shrink-0 items-center justify-between sm:block">
                <h4 className="text-sm font-semibold text-brand-dark">
                  {day.label}
                </h4>
                <button
                  type="button"
                  onClick={() => onAddDay(day.index)}
                  disabled={!canAddShift}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="text-base leading-none">+</span>
                  Them ca
                </button>
                {businessHour ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {businessHour.isOpen
                      ? `${businessHour.start} - ${businessHour.end}`
                      : "Phong kham nghi"}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-wrap gap-2">
                {shifts.length === 0 && timeOff.length === 0 ? (
                  <span className="py-1 text-sm text-muted-foreground">
                    Khong co lich lam viec
                  </span>
                ) : null}

                {timeOff.map((record) => (
                  <ScheduleChip
                    key={record.id}
                    record={record}
                    onRemove={onRemove}
                  />
                ))}

                {shifts.map((record) => (
                  <ScheduleChip
                    key={record.id}
                    record={record}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
