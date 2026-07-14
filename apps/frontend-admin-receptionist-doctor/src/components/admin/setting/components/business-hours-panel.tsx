import { cn } from "@/src/lib/utils/cn";
import type { BusinessHour } from "../types";

type BusinessHoursPanelProps = {
  businessHours: BusinessHour[];
  onChangeTime: (
    index: number,
    field: "start" | "end",
    value: string,
  ) => void;
  onToggleDay: (index: number) => void;
};

export function BusinessHoursPanel({
  businessHours,
  onChangeTime,
  onToggleDay,
}: BusinessHoursPanelProps) {
  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-semibold text-brand-dark">Gio lam viec</h3>
        <p className="text-sm text-muted-foreground">
          Cau hinh thoi gian hoat dong de hien thi lich cho benh nhan dat hen.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm divide-y divide-border">
        {businessHours.map((day, index) => (
          <div
            key={day.id}
            className={cn(
              "flex items-center justify-between p-5 transition-colors",
              !day.isOpen && "bg-muted/30",
            )}
          >
            <div className="flex w-1/3 items-center gap-4">
              <button
                type="button"
                onClick={() => onToggleDay(index)}
                className={cn(
                  "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                  day.isOpen ? "bg-brand" : "bg-zinc-300",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    day.isOpen ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium",
                  day.isOpen ? "text-brand-dark" : "text-muted-foreground",
                )}
              >
                {day.label}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              {day.isOpen ? (
                <>
                  <input
                    type="time"
                    value={day.start}
                    onChange={(event) =>
                      onChangeTime(index, "start", event.target.value)
                    }
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="time"
                    value={day.end}
                    onChange={(event) =>
                      onChangeTime(index, "end", event.target.value)
                    }
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </>
              ) : (
                <span className="px-4 text-sm font-medium text-muted-foreground">
                  Dong cua
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
