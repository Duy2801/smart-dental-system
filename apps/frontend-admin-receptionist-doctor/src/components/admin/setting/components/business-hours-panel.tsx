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
        <h3 className="text-lg font-bold text-brand-dark">Giờ làm việc</h3>
        <p className="text-sm text-muted-foreground">
          Cấu hình thời gian hoạt động để hiển thị khung giờ đặt hẹn cho bệnh nhân.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-brand-dark">
              Bước nhảy khung giờ
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Bệnh nhân sẽ nhìn thấy các suất đặt khám chia theo bước nhảy này.
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
                      ? "border-brand bg-brand text-white shadow-xs"
                      : "border-border bg-white text-brand-dark hover:border-brand/40",
                  )}
                >
                  {value} phút
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-xs">
          <p className="font-bold text-amber-950">Chưa cấu hình giờ làm việc trong cơ sở dữ liệu.</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Hãy khởi tạo lịch tuần chuẩn và bấm nút "Lưu thay đổi" để hệ thống cập nhật giờ hoạt động thực tế.
          </p>
          <button
            type="button"
            onClick={onInitialize}
            className="mt-3 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark shadow-xs"
          >
            Khởi tạo lịch tuần chuẩn
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs divide-y divide-border">
        {businessHours.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">
            Chưa có dữ liệu giờ làm việc để hiển thị.
          </div>
        ) : null}

        {businessHours.map((day, index) => (
          <div
            key={day.id}
            className={cn(
              "flex items-center justify-between p-5 transition-colors",
              !day.isOpen && "bg-slate-50/60",
            )}
          >
            <div className="flex w-1/3 items-center gap-4">
              <button
                type="button"
                onClick={() => onToggleDay(index)}
                className={cn(
                  "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                  day.isOpen ? "bg-brand" : "bg-slate-300",
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
                  "text-sm font-semibold",
                  day.isOpen ? "text-brand-dark" : "text-slate-400 line-through",
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
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="time"
                    value={day.end}
                    onChange={(event) =>
                      onChangeTime(index, "end", event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </>
              ) : (
                <span className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Đóng cửa
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-sm font-bold text-brand-dark">
              Ngày đặc biệt (Lễ / Nghỉ đột xuất)
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Dùng để thiết lập ngày nghỉ lễ, ngày kỷ niệm hoặc ngày phòng khám đóng cửa đột xuất.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddSpecialDate}
            className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-dark shadow-xs"
          >
            + Thêm ngày đặc biệt
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {specialDates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-500 text-center">
              Chưa có ngày đặc biệt nào được thiết lập. Hệ thống sẽ tự động áp dụng lịch làm việc theo các ngày trong tuần.
            </div>
          ) : null}

          {specialDates.map((item, index) => (
            <div
              key={`${item.date}-${index}`}
              className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[160px_minmax(0,1fr)_120px_120px_120px_auto] items-center"
            >
              <input
                type="date"
                value={item.date}
                onChange={(event) =>
                  onChangeSpecialDate(index, "date", event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <input
                type="text"
                value={item.label}
                onChange={(event) =>
                  onChangeSpecialDate(index, "label", event.target.value)
                }
                placeholder="Tên ngày lễ, kỷ niệm..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-brand-dark cursor-pointer select-none bg-slate-50">
                <input
                  type="checkbox"
                  checked={item.isClosed}
                  onChange={(event) =>
                    onChangeSpecialDate(index, "isClosed", event.target.checked)
                  }
                  className="h-4 w-4 rounded-sm border-slate-300 text-brand focus:ring-brand"
                />
                Đang nghỉ
              </label>
              <input
                type="time"
                value={item.start ?? "08:00"}
                disabled={item.isClosed}
                onChange={(event) =>
                  onChangeSpecialDate(index, "start", event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-100 disabled:text-slate-400"
              />
              <input
                type="time"
                value={item.end ?? "17:00"}
                disabled={item.isClosed}
                onChange={(event) =>
                  onChangeSpecialDate(index, "end", event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-100 disabled:text-slate-400"
              />
              <button
                type="button"
                onClick={() => onRemoveSpecialDate(index)}
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
