import { cn } from "@/src/lib/utils/cn";
import type { AvailabilityRecord } from "../types";

type ScheduleChipProps = {
  onRemove: (id: string) => void;
  record: AvailabilityRecord;
};

export function ScheduleChip({ onRemove, record }: ScheduleChipProps) {
  const isTimeOff = record.recordType === "TIME_OFF";

  return (
    <div
      className={cn(
        "group relative flex min-h-10 items-center rounded-lg px-3 py-2 text-sm",
        isTimeOff ? "bg-red-50 text-red-600" : "bg-brand-light text-brand-dark",
      )}
    >
      {isTimeOff ? (
        <span className="font-medium">
          Nghỉ phép: {record.reason || "Không ghi lý do"}
        </span>
      ) : (
        <span className="font-mono font-semibold">
          {record.startTime} - {record.endTime}
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(record.id)}
        className="ml-3 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-red-500 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
        title="Xóa"
      >
        ×
      </button>
    </div>
  );
}
