"use client";

import { Moon, PencilSimple, Plus } from "@phosphor-icons/react";
import { SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="hidden items-center border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:flex">
        <div className="w-40 shrink-0">Ngày</div>
        <div className="flex-1">Ca làm việc</div>
        <div className="shrink-0">Thao tác</div>
      </div>
      {loading ? (
        <SkeletonRows count={7} />
      ) : (
        <div className="divide-y divide-slate-100">
          {weekDays.map((day) => {
            const daySchedule = schedule?.weekly.find((item) => item.dayOfWeek === day.index);
            const businessHour = businessHours.find((hour) => hour.id === day.index);
            const isOpen = Boolean(businessHour?.isOpen);
            const shifts = daySchedule?.shifts ?? [];
            const dateOverrides = daySchedule?.dateOverrides ?? [];
            const timeOff = daySchedule?.timeOff ?? [];
            const isEmpty = shifts.length === 0 && dateOverrides.length === 0 && timeOff.length === 0;

            return (
              <div
                key={day.index}
                className={cn(
                  "flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-center",
                  isOpen ? "hover:bg-slate-50/60" : "bg-slate-50/50",
                )}
              >
                <div className="flex w-40 shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold",
                      isOpen ? "bg-brand-light text-brand" : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {day.index === 0 ? "CN" : `T${day.index + 1}`}
                  </span>
                  <div>
                    <h4 className={cn("text-sm font-bold", isOpen ? "text-slate-900" : "text-slate-400")}>
                      {day.label}
                    </h4>
                    {businessHour ? (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        {isOpen ? (
                          `${businessHour.start} - ${businessHour.end}`
                        ) : (
                          <>
                            <Moon size={11} weight="fill" />
                            Phòng khám nghỉ
                          </>
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {isEmpty ? (
                    <span className="rounded-lg border border-dashed border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400">
                      {isOpen ? "Chưa có ca làm việc" : "Không làm việc"}
                    </span>
                  ) : null}

                  {[...timeOff, ...dateOverrides, ...shifts].map((record) => (
                    <ScheduleChip key={record.id} record={record} onRemove={onRemove} onApprove={onApprove} />
                  ))}
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onAddDay(day.index)}
                    disabled={!isOpen}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-brand/30 hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {shifts.length > 0 ? <PencilSimple size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
                    {shifts.length > 0 ? "Sửa ca" : "Thêm ca"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
