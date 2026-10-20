"use client";

import { CalendarStar, Clock, Plus, Timer, Trash, WarningCircle } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminIconButton,
  AdminSwitch,
  adminControlClass,
  adminControlTone,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { BusinessHour, ClinicSpecialDate, LunchBreak } from "../types";
import { LunchBreakPanel } from "./lunch-break-panel";

type BusinessHoursPanelProps = {
  businessHours: BusinessHour[];
  lunchBreak: LunchBreak;
  slotIntervalMinutes: number;
  specialDates: ClinicSpecialDate[];
  isConfigured: boolean;
  onChangeTime: (
    index: number,
    field: "start" | "end",
    value: string,
  ) => void;
  onChangeSlotInterval: (value: number) => void;
  onChangeLunchBreak: (
    field: keyof LunchBreak,
    value: string | boolean,
  ) => void;
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

const compactControl = cn(adminControlClass, adminControlTone(), "h-10");

export function BusinessHoursPanel({
  businessHours,
  lunchBreak,
  slotIntervalMinutes,
  specialDates,
  isConfigured,
  onChangeTime,
  onChangeSlotInterval,
  onChangeLunchBreak,
  onChangeSpecialDate,
  onAddSpecialDate,
  onInitialize,
  onRemoveSpecialDate,
  onToggleDay,
}: BusinessHoursPanelProps) {
  const presetIntervals = [15, 30, 60, 90, 120];

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Giờ làm việc</h3>
        <p className="text-sm text-slate-500">
          Cấu hình thời gian hoạt động để hiển thị khung giờ đặt hẹn cho bệnh nhân.
        </p>
      </div>

      {!isConfigured ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-950">Chưa cấu hình giờ làm việc</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                Hãy khởi tạo lịch tuần chuẩn rồi bấm &quot;Lưu thay đổi&quot; để hệ thống áp dụng giờ hoạt động thực tế.
              </p>
            </div>
          </div>
          <AdminButton size="sm" onClick={onInitialize} className="shrink-0">
            Khởi tạo lịch tuần chuẩn
          </AdminButton>
        </div>
      ) : null}

      <AdminCard
        title="Bước nhảy khung giờ"
        description="Bệnh nhân sẽ thấy các suất đặt khám chia theo bước nhảy này."
        icon={<Timer size={18} weight="duotone" />}
      >
        <div className="flex flex-wrap items-center gap-2">
          {presetIntervals.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={slotIntervalMinutes === value}
              onClick={() => onChangeSlotInterval(value)}
              className={cn(
                "h-10 rounded-xl border px-4 text-sm font-semibold transition",
                slotIntervalMinutes === value
                  ? "border-brand bg-brand text-white shadow-sm shadow-brand/25"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {value} phút
            </button>
          ))}
          <div className="relative">
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              aria-label="Bước nhảy tùy chỉnh (phút)"
              value={slotIntervalMinutes}
              onChange={(event) => onChangeSlotInterval(Number(event.target.value) || 30)}
              className={cn(compactControl, "w-32 pr-12")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
              phút
            </span>
          </div>
        </div>
      </AdminCard>

      <LunchBreakPanel lunchBreak={lunchBreak} onChange={onChangeLunchBreak} />

      <AdminCard
        title="Lịch hoạt động trong tuần"
        description="Bật / tắt từng ngày và chỉnh giờ mở cửa."
        icon={<Clock size={18} weight="duotone" />}
        bodyClassName="p-0"
      >
        {businessHours.length === 0 ? (
          <AdminEmptyState icon={<Clock size={24} weight="duotone" />} title="Chưa có dữ liệu giờ làm việc" />
        ) : (
          <div className="divide-y divide-slate-100">
            {businessHours.map((day, index) => (
              <div
                key={day.id}
                className={cn(
                  "flex flex-col gap-3 px-5 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  !day.isOpen && "bg-slate-50/60",
                )}
              >
                <div className="flex items-center gap-3.5">
                  <AdminSwitch
                    checked={day.isOpen}
                    onChange={() => onToggleDay(index)}
                    label={`${day.isOpen ? "Đóng cửa" : "Mở cửa"} ${day.label}`}
                  />
                  <span className={cn("text-sm font-semibold", day.isOpen ? "text-slate-900" : "text-slate-400")}>
                    {day.label}
                  </span>
                </div>

                {day.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      aria-label={`Giờ mở cửa ${day.label}`}
                      value={day.start}
                      onChange={(event) => onChangeTime(index, "start", event.target.value)}
                      className={cn(compactControl, "w-32")}
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      aria-label={`Giờ đóng cửa ${day.label}`}
                      value={day.end}
                      onChange={(event) => onChangeTime(index, "end", event.target.value)}
                      className={cn(compactControl, "w-32")}
                    />
                  </div>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Đóng cửa
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Ngày đặc biệt"
        description="Ngày nghỉ lễ, kỷ niệm hoặc ngày phòng khám đóng cửa đột xuất."
        icon={<CalendarStar size={18} weight="duotone" />}
        action={
          <AdminButton size="sm" onClick={onAddSpecialDate}>
            <Plus size={14} weight="bold" />
            Thêm ngày
          </AdminButton>
        }
      >
        {specialDates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs font-medium text-slate-500">
            Chưa có ngày đặc biệt nào. Hệ thống sẽ áp dụng lịch làm việc theo các ngày trong tuần.
          </div>
        ) : (
          <div className="space-y-2.5">
            {specialDates.map((item, index) => (
              <div
                key={`${item.date}-${index}`}
                className="grid items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/40 p-3 lg:grid-cols-[150px_minmax(0,1fr)_auto_110px_110px_auto]"
              >
                <input
                  type="date"
                  aria-label="Ngày"
                  value={item.date}
                  onChange={(event) => onChangeSpecialDate(index, "date", event.target.value)}
                  className={cn(compactControl, "w-full")}
                />
                <input
                  type="text"
                  aria-label="Tên ngày đặc biệt"
                  maxLength={120}
                  value={item.label}
                  onChange={(event) => onChangeSpecialDate(index, "label", event.target.value)}
                  placeholder="Tên ngày lễ, kỷ niệm..."
                  className={cn(compactControl, "w-full")}
                />
                <label className="flex h-10 cursor-pointer select-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.isClosed}
                    onChange={(event) => onChangeSpecialDate(index, "isClosed", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-brand"
                  />
                  Nghỉ cả ngày
                </label>
                <input
                  type="time"
                  aria-label="Giờ mở cửa"
                  value={item.start ?? "08:00"}
                  disabled={item.isClosed}
                  onChange={(event) => onChangeSpecialDate(index, "start", event.target.value)}
                  className={cn(compactControl, "w-full")}
                />
                <input
                  type="time"
                  aria-label="Giờ đóng cửa"
                  value={item.end ?? "17:00"}
                  disabled={item.isClosed}
                  onChange={(event) => onChangeSpecialDate(index, "end", event.target.value)}
                  className={cn(compactControl, "w-full")}
                />
                <div className="justify-self-end">
                  <AdminIconButton label="Xóa ngày đặc biệt" tone="red" onClick={() => onRemoveSpecialDate(index)}>
                    <Trash size={16} />
                  </AdminIconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
