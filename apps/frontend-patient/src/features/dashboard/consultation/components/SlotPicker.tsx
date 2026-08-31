"use client";

import { useEffect } from "react";
import { useConsultationSlotsQuery } from "../hooks/useConsultationQueries";
import type { ConsultationDurationMinutes } from "../types";

interface SlotPickerProps {
  doctorId: string;
  selectedDate: string;
  selectedDuration: ConsultationDurationMinutes;
  selectedSlot: string;
  onChangeDate: (date: string) => void;
  onSelectSlot: (slot: string) => void;
}

export function SlotPicker({
  doctorId,
  selectedDate,
  selectedDuration,
  selectedSlot,
  onChangeDate,
  onSelectSlot,
}: SlotPickerProps) {
  const { data: availableSlots = [], isLoading: isLoadingSlots } =
    useConsultationSlotsQuery(doctorId, selectedDate, selectedDuration);

  useEffect(() => {
    if (selectedSlot && !availableSlots.includes(selectedSlot)) {
      onSelectSlot("");
    }
  }, [availableSlots, selectedSlot, onSelectSlot]);

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
            3
          </span>
          <h2 className="text-lg font-bold text-slate-800">
            Chọn Ngày & Khung Giờ Tư Vấn
          </h2>
        </div>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toLocaleDateString("sv-SE")}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {}
          }}
          onChange={(e) => onChangeDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {isLoadingSlots ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full rounded-lg bg-slate-200/80 animate-pulse"
            />
          ))}
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="bg-slate-50 border border-dashed rounded-xl p-6 text-center text-slate-500 text-sm space-y-3">
          <p>
            {selectedDate === new Date().toLocaleDateString("sv-SE")
              ? "Hôm nay đã hết khung giờ tư vấn rảnh (Giờ làm việc: 08:00 - 17:00). Vui lòng chọn ngày tiếp theo."
              : "Phòng khám hoặc Bác sĩ không có slot rảnh vào ngày này. Vui lòng chọn ngày làm việc khác."}
          </p>
          <button
            type="button"
            onClick={() => {
              const current = selectedDate ? new Date(selectedDate) : new Date();
              current.setDate(current.getDate() + 1);
              onChangeDate(current.toLocaleDateString("sv-SE"));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <span>📅 Chọn ngày tiếp theo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {availableSlots.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
