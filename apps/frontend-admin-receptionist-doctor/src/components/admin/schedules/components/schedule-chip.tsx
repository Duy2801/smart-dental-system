import { cn } from "@/src/lib/utils/cn";
import type { AvailabilityApprovalStatus, AvailabilityRecord } from "../types";

type ScheduleChipProps = {
  onRemove: (id: string) => void;
  onApprove?: (id: string, status: AvailabilityApprovalStatus) => void;
  record: AvailabilityRecord;
};

export function ScheduleChip({ onRemove, onApprove, record }: ScheduleChipProps) {
  const isTimeOff = record.recordType === "TIME_OFF";
  const isOverride = record.recordType === "DATE_OVERRIDE";
  const isPending = record.approvalStatus === "PENDING";
  const isRejected = record.approvalStatus === "REJECTED";

  return (
    <div
      className={cn(
        "group relative flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border",
        isTimeOff
          ? isPending
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : isRejected
              ? "border-red-200 bg-red-50 text-red-400 line-through"
              : "border-red-200 bg-red-50 text-red-700"
          : isOverride
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : "border-brand-light bg-brand-light/60 text-brand-dark"
      )}
    >
      <div className="flex flex-col">
        {isTimeOff ? (
          <div className="flex items-center gap-1.5 font-medium">
            <span>Nghỉ phép: {record.reason || "Không lý do"}</span>
            {isPending && (
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                Chờ duyệt
              </span>
            )}
            {isRejected && (
              <span className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-800 uppercase">
                Từ chối
              </span>
            )}
          </div>
        ) : isOverride ? (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-blue-600">Làm bù / Đột xuất ({record.specificDate ? String(record.specificDate).slice(0, 10) : ""})</span>
            <span className="font-mono font-semibold">
              {record.startTime} - {record.endTime}
            </span>
          </div>
        ) : (
          <span className="font-mono font-semibold">
            {record.startTime} - {record.endTime}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {isPending && onApprove && (
          <>
            <button
              type="button"
              onClick={() => onApprove(record.id, "APPROVED")}
              className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              title="Phê duyệt"
            >
              Duyệt
            </button>
            <button
              type="button"
              onClick={() => onApprove(record.id, "REJECTED")}
              className="rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
              title="Từ chối"
            >
              Từ chối
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onRemove(record.id)}
          className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-red-500 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
          title="Xóa"
        >
          ×
        </button>
      </div>
    </div>
  );
}

