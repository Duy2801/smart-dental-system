"use client";

import { cn } from "@/src/lib/utils/cn";

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
  healthy: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  caries: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  filled: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200",
  missing: "bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300 line-through",
  crown: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200",
  root_canal: "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200",
  implant: "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200",
  treated: "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200",
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
    <div className="flex flex-wrap justify-center gap-1">
      {nums.map((number, index) => {
        const status = getStatus(number);
        return (
          <button
            key={number}
            type="button"
            title={`${number}: ${STATUS_LABEL[status]} - bấm để đổi`}
            onClick={() => onCycle(number)}
            className={cn(
              "flex h-9 w-9 flex-col items-center justify-center rounded-md border text-[10px] font-bold transition-colors cursor-pointer",
              STATUS_COLOR[status],
              index === 7 ? "mr-2" : "",
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
    // Giữ lại các răng ngoài dải 11-48 (răng sữa 51-85 hoặc răng đặc biệt) nếu đã có sẵn
    const otherTeeth = (value?.teeth || []).filter(
      (t) => !UPPER.includes(t.number) && !LOWER.includes(t.number) && t.status !== "healthy"
    );
    const compact = [
      ...standardTeeth.filter((t) => t.status !== "healthy"),
      ...otherTeeth,
    ];
    onChange({ teeth: compact });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-xl border border-border bg-slate-50 p-4">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Hàm trên
        </p>
        <ToothRow nums={UPPER} getStatus={get} onCycle={cycle} />
        <div className="my-2 border-t border-dashed border-border" />
        <ToothRow nums={LOWER} getStatus={get} onCycle={cycle} />
        <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Hàm dưới
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_CYCLE.map((s) => (
          <span
            key={s}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
              STATUS_COLOR[s],
            )}
          >
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Bấm từng răng để đổi trạng thái (FDI). Chỉ răng không khỏe được lưu.
      </p>
    </div>
  );
}
