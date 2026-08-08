"use client";

import { useEffect, useState } from "react";
import { getAvailableConsultationSlots } from "../api";
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    if (!doctorId || !selectedDate) return;

    setIsLoadingSlots(true);
    onSelectSlot("");
    getAvailableConsultationSlots(doctorId, selectedDate, selectedDuration)
      .then((slots) => {
        setAvailableSlots(slots);
        if (slots.length > 0) {
          onSelectSlot(slots[0]);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải khung giờ khả dụng:", err);
        setAvailableSlots([]);
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [doctorId, selectedDate, selectedDuration]);

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
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChangeDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoadingSlots ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Đang tính toán các khung giờ rảnh theo lịch phòng khám...
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="bg-slate-50 border border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
          Phòng khám hoặc Bác sĩ không có slot rảnh vào ngày này. Vui lòng chọn ngày làm việc khác.
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
