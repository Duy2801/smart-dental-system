import type { BookingDate } from "../../types";

type SchedulePickerProps = {
  dates: BookingDate[];
  times: string[];
  selectedDateId: string;
  selectedTime: string;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
};

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function SchedulePicker({
  dates,
  times,
  selectedDateId,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: SchedulePickerProps) {
  return (
    <fieldset>
      <legend className="sr-only">Chọn lịch trình và giờ khám</legend>
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Tháng trước" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50">
              ‹
            </button>
            <h3 className="text-sm font-bold text-slate-800">Tháng 07, 2026</h3>
            <button type="button" aria-label="Tháng sau" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50">
              ›
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday) => (
              <span key={weekday} className="py-1 text-[9px] font-bold uppercase text-slate-400">
                {weekday}
              </span>
            ))}
            <span />
            <span />
            {dates.map((date) => {
              const selected = date.id === selectedDateId;
              return (
                <button
                  key={date.id}
                  type="button"
                  onClick={() => onSelectDate(date.id)}
                  aria-pressed={selected}
                  className={`mx-auto grid h-9 w-9 place-items-center rounded-lg text-xs font-semibold transition ${
                    selected
                      ? "bg-[#0863c5] text-white shadow-md shadow-blue-200"
                      : "text-slate-600 hover:bg-blue-50 hover:text-[#0863c5]"
                  }`}
                >
                  {Number(date.day)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
            Khung giờ còn trống
          </h3>
          <p className="mt-1 text-[10px] text-slate-400">Giờ địa phương · 30 phút/lượt</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {times.map((time) => {
              const selected = time === selectedTime;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onSelectTime(time)}
                  aria-pressed={selected}
                  className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                    selected
                      ? "border-[#0863c5] bg-blue-50 text-[#0863c5] ring-1 ring-blue-100"
                      : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
