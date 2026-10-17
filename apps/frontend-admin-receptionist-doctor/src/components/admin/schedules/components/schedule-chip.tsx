"use client";

import { AirplaneTilt, ArrowsClockwise, Check, Clock, X } from "@phosphor-icons/react";
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

  const tone = isTimeOff
    ? isPending
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : isRejected
        ? "border-slate-200 bg-slate-50 text-slate-400"
        : "border-red-200 bg-red-50 text-red-700"
    : isOverride
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : "border-brand/20 bg-brand-light text-brand-dark";

  const ChipIcon = isTimeOff ? AirplaneTilt : isOverride ? ArrowsClockwise : Clock;

  return (
    <div className={cn("flex min-h-9 items-center gap-2 rounded-xl border py-1.5 pl-2.5 pr-1.5 text-sm", tone)}>
      <ChipIcon size={14} weight="bold" className="shrink-0 opacity-70" />

      <div className="flex min-w-0 flex-col">
        {isTimeOff ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("font-semibold", isRejected && "line-through")}>
              Nghỉ phép: {record.reason || "Không lý do"}
            </span>
            {isPending ? (
              <span className="rounded-md bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                Chờ duyệt
              </span>
            ) : null}
            {isRejected ? (
              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                Từ chối
              </span>
            ) : null}
          </div>
        ) : isOverride ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide text-sky-600">
              Làm bù {record.specificDate ? `· ${String(record.specificDate).slice(0, 10)}` : ""}
            </span>
            <span className="font-mono text-[13px] font-bold">
              {record.startTime} - {record.endTime}
            </span>
          </>
        ) : (
          <span className="font-mono text-[13px] font-bold">
            {record.startTime} - {record.endTime}
          </span>
        )}
      </div>

      <div className="ml-1 flex items-center gap-1">
        {isPending && onApprove ? (
          <>
            <button
              type="button"
              onClick={() => onApprove(record.id, "APPROVED")}
              title="Phê duyệt"
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <Check size={12} weight="bold" />
              Duyệt
            </button>
            <button
              type="button"
              onClick={() => onApprove(record.id, "REJECTED")}
              title="Từ chối"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              Từ chối
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => onRemove(record.id)}
          title="Xóa"
          aria-label="Xóa ca"
          className="grid h-6 w-6 place-items-center rounded-md text-current opacity-50 transition-all hover:bg-white hover:text-red-600 hover:opacity-100"
        >
          <X size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}
