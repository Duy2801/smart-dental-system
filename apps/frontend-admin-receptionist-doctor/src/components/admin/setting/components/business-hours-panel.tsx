import { cn } from "@/src/lib/utils/cn";
import type { BusinessHour, ClinicSpecialDate } from "../types";

type BusinessHoursPanelProps = {
  businessHours: BusinessHour[];
  slotIntervalMinutes: number;
  specialDates: ClinicSpecialDate[];
  isConfigured: boolean;
  onChangeTime: (
    index: number,
    field: "start" | "end",
    value: string,
  ) => void;
  onChangeSlotInterval: (value: number) => void;
  onChangeSpecialDate: (
    index: number,
    field: keyof ClinicSpecialDate,
    value: string | boolean,
  ) => void;
  onAddSpecialDate: () => void;
  onInitialize: () => void;
  onRemoveSpecialDate: (index: number) => void;
  onToggleDay: (index: number) => void;
};

export function BusinessHoursPanel({
  businessHours,
  slotIntervalMinutes,
  specialDates,
  isConfigured,
  onChangeTime,
  onChangeSlotInterval,
  onChangeSpecialDate,
  onAddSpecialDate,
  onInitialize,
  onRemoveSpecialDate,
  onToggleDay,
}: BusinessHoursPanelProps) {
  const presetIntervals = [15, 30, 60, 90, 120];

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-semibold text-brand-dark">Gio lam viec</h3>
        <p className="text-sm text-muted-foreground">
          Cau hinh thoi gian hoat dong de hien thi lich cho benh nhan dat hen.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-brand-dark">
              Buoc nhay khung gio
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Benh nhan se nhin thay lich hen theo buoc nhay nay.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <div className="flex flex-wrap gap-2">
              {presetIntervals.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChangeSlotInterval(value)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    slotIntervalMinutes === value
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-white text-brand-dark hover:border-brand/40",
                  )}
                >
                  {value} phut
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              value={slotIntervalMinutes}
              onChange={(event) =>
                onChangeSlotInterval(Number(event.target.value) || 30)
              }
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </section>

      {!isConfigured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Chua co gio lam viec trong DB.</p>
          <p className="mt-1">
            Hay khoi tao lich tuan va bam nut Luu thay doi de phong kham co
            cau hinh hoat dong that.
          </p>
          <button
            type="button"
            onClick={onInitialize}
            className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Khoi tao lich tuan
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm divide-y divide-border">
        {businessHours.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">
            Chua co du lieu gio lam viec de hien thi.
          </div>
        ) : null}

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

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-brand-dark">
              Ngay dac biet
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Dung cho ngay le, ky niem hoac ngay phong kham nghi dot xuat.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddSpecialDate}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Them ngay
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {specialDates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Chua co ngay dac biet nao. Neu den ngay nay, lich benh nhan van theo lich tuan.
            </div>
          ) : null}

          {specialDates.map((item, index) => (
            <div
              key={`${item.date}-${index}`}
              className="grid gap-3 rounded-2xl border border-border p-4 lg:grid-cols-[150px_minmax(0,1fr)_120px_120px_120px_auto]"
            >
              <input
                type="date"
                value={item.date}
                onChange={(event) =>
                  onChangeSpecialDate(index, "date", event.target.value)
                }
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <input
                type="text"
                value={item.label}
                onChange={(event) =>
                  onChangeSpecialDate(index, "label", event.target.value)
                }
                placeholder="Ngay le, ky niem..."
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-brand-dark">
                <input
                  type="checkbox"
                  checked={item.isClosed}
                  onChange={(event) =>
                    onChangeSpecialDate(index, "isClosed", event.target.checked)
                  }
                  className="h-4 w-4 accent-brand"
                />
                Dang nghi
              </label>
              <input
                type="time"
                value={item.start ?? "08:00"}
                disabled={item.isClosed}
                onChange={(event) =>
                  onChangeSpecialDate(index, "start", event.target.value)
                }
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-muted/40"
              />
              <input
                type="time"
                value={item.end ?? "17:00"}
                disabled={item.isClosed}
                onChange={(event) =>
                  onChangeSpecialDate(index, "end", event.target.value)
                }
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-muted/40"
              />
              <button
                type="button"
                onClick={() => onRemoveSpecialDate(index)}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Xoa
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
