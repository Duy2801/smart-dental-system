"use client";

import React from "react";
import { cn } from "@/src/lib/utils/cn";
import { ArrowsCounterClockwise, CheckCircle, WarningCircle } from "@phosphor-icons/react";

export type ToothStatus =
  | "healthy"
  | "caries"
  | "filled"
  | "missing"
  | "crown"
  | "root_canal"
  | "implant"
  | "treated";

export type DentalChartData = {
  teeth: { number: number; status: ToothStatus }[];
};

const STATUS_CYCLE: ToothStatus[] = [
  "healthy",
  "caries",
  "filled",
  "root_canal",
  "crown",
  "implant",
  "missing",
  "treated",
];

const STATUS_LABEL: Record<ToothStatus, string> = {
  healthy: "Khỏe",
  caries: "Sâu",
  filled: "Trám",
  missing: "Mất",
  crown: "Mão",
  root_canal: "Nội nha",
  implant: "Implant",
  treated: "Đã ĐT",
};

const STATUS_COLOR: Record<ToothStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
  caries: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200 font-bold",
  filled: "bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200 font-bold",
  missing: "bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300 line-through font-bold",
  crown: "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 font-bold",
  root_canal: "bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200 font-bold",
  implant: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 font-bold",
  treated: "bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200 font-bold",
};

/** FDI: hàm trên phải→trái 18–11 | 21–28 ; hàm dưới trái→phải 48–41 | 31–38 */
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function nextStatus(current: ToothStatus): ToothStatus {
  const i = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

type Props = {
  value: DentalChartData;
  onChange: (next: DentalChartData) => void;
};

function ToothRow({
  nums,
  getStatus,
  onCycle,
}: {
  nums: number[];
  getStatus: (number: number) => ToothStatus;
  onCycle: (number: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {nums.map((number, index) => {
        const status = getStatus(number);
        const isNotHealthy = status !== "healthy";
        return (
          <button
            key={number}
            type="button"
            title={`Răng ${number}: ${STATUS_LABEL[status]} - Bấm để chuyển đổi trạng thái`}
            onClick={() => onCycle(number)}
            className={cn(
              "flex h-9 w-9 flex-col items-center justify-center rounded-lg border text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-2xs",
              STATUS_COLOR[status],
              isNotHealthy && "ring-1 ring-offset-1 ring-slate-400",
              index === 7 ? "mr-3" : "",
            )}
          >
            {number}
          </button>
        );
      })}
    </div>
  );
}

export function DentalChartEditor({ value, onChange }: Props) {
  const map = new Map((value?.teeth || []).map((t) => [t.number, t.status]));

  const get = (n: number): ToothStatus => map.get(n) ?? "healthy";

  const cycle = (n: number) => {
    const status = nextStatus(get(n));
    const standardTeeth = UPPER.concat(LOWER).map((number) => ({
      number,
      status: number === n ? status : get(number),
    }));
    // Giữ lại các răng ngoài dải 11-48 nếu đã có sẵn
    const otherTeeth = (value?.teeth || []).filter(
      (t) => !UPPER.includes(t.number) && !LOWER.includes(t.number) && t.status !== "healthy",
    );
    const compact = [
      ...standardTeeth.filter((t) => t.status !== "healthy"),
      ...otherTeeth,
    ];
    onChange({ teeth: compact });
  };

  const handleResetAll = () => {
    onChange({ teeth: [] });
  };

  const unhealthyTeeth = (value?.teeth || []).filter((t) => t.status !== "healthy");

  return (
    <div className="space-y-4">
      {/* Header Summary & Reset Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          {unhealthyTeeth.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle size={16} weight="fill" className="text-emerald-500" />
              <span>Tất cả răng đang ở trạng thái khỏe bình thường</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-amber-900">
                <WarningCircle size={16} weight="fill" className="text-amber-500" />
                {unhealthyTeeth.length} răng có tình trạng cần lưu ý:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unhealthyTeeth.map((t) => (
                  <span
                    key={t.number}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold",
                      STATUS_COLOR[t.status],
                    )}
                  >
                    <span>R{t.number}</span>
                    <span className="font-sans text-[10px] font-medium opacity-80">
                      ({STATUS_LABEL[t.status]})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {unhealthyTeeth.length > 0 && (
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition cursor-pointer"
            title="Đặt lại toàn bộ 32 răng về trạng thái khỏe"
          >
            <ArrowsCounterClockwise size={13} weight="bold" />
            Đặt lại tất cả về khỏe
          </button>
        )}
      </div>

      {/* Chart Grid */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          <span>Phải (R)</span>
          <span className="text-slate-800 font-bold">Hàm trên (Maxilla)</span>
          <span>Trái (L)</span>
        </div>
        <ToothRow nums={UPPER} getStatus={get} onCycle={cycle} />

        <div className="relative my-3 flex items-center justify-center">
          <div className="w-full border-t border-dashed border-slate-200" />
          <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Đường giữa cung hàm
          </span>
        </div>

        <ToothRow nums={LOWER} getStatus={get} onCycle={cycle} />
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          <span>Phải (R)</span>
          <span className="text-slate-800 font-bold">Hàm dưới (Mandible)</span>
          <span>Trái (L)</span>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Bảng chú giải trạng thái răng:
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_CYCLE.map((s) => (
            <span
              key={s}
              className={cn(
                "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs",
                STATUS_COLOR[s],
              )}
            >
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          💡 <strong>Hướng dẫn:</strong> Bấm vào răng bất kỳ để chuyển đổi trạng thái lần lượt theo chu kỳ (Khỏe → Sâu → Trám → Nội nha → Mão → Implant → Mất → Đã ĐT).
        </p>
      </div>
    </div>
  );
}
