import type { BookingDate } from "../../types";

type SchedulePickerProps = {
  dates: BookingDate[];
  times: string[];
  blockedTimes?: string[];
  blockedRanges?: string[];
  slotIntervalMinutes?: number;
  selectedDateId: string;
  selectedTime: string;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
};

export function SchedulePicker({
  dates,
  times,
  blockedTimes = [],
  blockedRanges = [],
  slotIntervalMinutes = 30,
  selectedDateId,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: SchedulePickerProps) {
  const visibleTimes = Array.from(new Set([...times, ...blockedTimes])).sort(
    (left, right) => toMinutes(left) - toMinutes(right),
  );

  return (
    <fieldset>
      <legend className="sr-only">Chon lich trinh va gio kham</legend>
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              15 ngay gan nhat
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">
              Chon ngay kham
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {dates.map((date) => {
              const selected = date.id === selectedDateId;
              return (
                <button
                  key={date.id}
                  type="button"
                  disabled={!date.isOpen}
                  onClick={() => onSelectDate(date.id)}
                  aria-pressed={selected}
                  title={date.isOpen ? "Co lich lam viec" : "Phong kham nghi"}
                  className={`mx-auto grid h-14 w-11 place-items-center rounded-lg text-xs font-semibold transition ${
                    selected
                      ? "bg-[#0863c5] text-white shadow-md shadow-blue-200"
                      : date.isOpen
                        ? "text-slate-600 hover:bg-blue-50 hover:text-[#0863c5]"
                        : "cursor-not-allowed bg-slate-50 text-slate-300 line-through"
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase">
                    {date.weekday}
                  </span>
                  <span>{Number(date.day)}</span>
                  <span className="text-[8px] font-medium">{date.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
            Khung gio con trong
          </h3>
          <p className="mt-1 text-[10px] text-slate-400">
            Gio dia phuong - {slotIntervalMinutes} phut/luot
          </p>
          {blockedRanges.length ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Ban da co lich trong cac khoang:
              </p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {blockedRanges.join(", ")}
              </p>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {visibleTimes.length === 0 ? (
              <p className="col-span-2 rounded-lg bg-amber-50 px-3 py-3 text-center text-xs font-semibold text-amber-700">
                Ngay nay khong con khung gio hop le.
              </p>
            ) : null}
            {visibleTimes.map((time) => {
              const selected = time === selectedTime;
              const blocked = blockedTimes.includes(time);
              return (
                <button
                  key={time}
                  type="button"
                  disabled={blocked}
                  onClick={() => onSelectTime(time)}
                  aria-pressed={selected}
                  title={blocked ? "Ban da co lich o khung gio nay" : undefined}
                  className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                    blocked
                      ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500"
                      : selected
                      ? "border-[#0863c5] bg-blue-50 text-[#0863c5] ring-1 ring-blue-100"
                      : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
                  }`}
                >
                  <span className="block">{time}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
