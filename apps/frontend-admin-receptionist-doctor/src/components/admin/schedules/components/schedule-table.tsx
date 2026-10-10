import { SkeletonRows } from "@/src/components/admin/common";
import { weekDays } from "../constants";
import { ScheduleChip } from "./schedule-chip";
import type { AvailabilityApprovalStatus, AvailabilityResponse } from "../types";
import type { BusinessHour } from "../../setting/types";

type ScheduleTableProps = {
  businessHours: BusinessHour[];
  loading: boolean;
  onAddDay: (dayOfWeek: number) => void;
  onRemove: (id: string) => void;
  onApprove?: (id: string, status: AvailabilityApprovalStatus) => void;
  schedule: AvailabilityResponse | null;
};

export function ScheduleTable({
  businessHours,
  loading,
  onAddDay,
  onRemove,
  onApprove,
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
          const dateOverrides = daySchedule?.dateOverrides ?? [];
          const timeOff = daySchedule?.timeOff ?? [];

          return (
            <div
              key={day.index}
              className="flex min-h-24 flex-col gap-4 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center justify-between"
            >
              <div className="w-36 shrink-0">
                <h4 className="text-sm font-semibold text-brand-dark">
                  {day.label}
                </h4>
                {businessHour ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {businessHour.isOpen
                      ? `${businessHour.start} - ${businessHour.end}`
                      : "Phòng khám nghỉ"}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-2">
                {shifts.length === 0 && dateOverrides.length === 0 && timeOff.length === 0 ? (
                  <span className="py-1 text-sm text-muted-foreground">
                    Không có lịch làm việc
                  </span>
                ) : null}

                {timeOff.map((record) => (
                  <ScheduleChip
                    key={record.id}
                    record={record}
                    onRemove={onRemove}
                    onApprove={onApprove}
                  />
                ))}

                {dateOverrides.map((record) => (
                  <ScheduleChip
                    key={record.id}
                    record={record}
                    onRemove={onRemove}
                    onApprove={onApprove}
                  />
                ))}

                {shifts.map((record) => (
                  <ScheduleChip
                    key={record.id}
                    record={record}
                    onRemove={onRemove}
                    onApprove={onApprove}
                  />
                ))}
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onAddDay(day.index)}
                  disabled={!canAddShift}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark shadow-2xs transition-all hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {shifts.length > 0 ? (
                    <svg
                      className="h-3.5 w-3.5 text-brand"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  ) : (
                    <span className="text-base leading-none text-brand">+</span>
                  )}
                  Cập nhật
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

