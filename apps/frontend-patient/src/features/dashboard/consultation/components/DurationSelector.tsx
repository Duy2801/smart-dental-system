"use client";

import { useEffect } from "react";
import { useConsultationPackagesQuery } from "../hooks/useConsultationQueries";
import type {
  ConsultationDurationMinutes,
  ConsultationDurationOption,
} from "../types";

interface DurationSelectorProps {
  selectedDuration: ConsultationDurationMinutes;
  onSelectDuration: (
    duration: ConsultationDurationMinutes,
    option?: ConsultationDurationOption,
  ) => void;
}

export function DurationSelector({
  selectedDuration,
  onSelectDuration,
}: DurationSelectorProps) {
  const { data: options = [], isLoading: loading } = useConsultationPackagesQuery();

  useEffect(() => {
    if (options.length > 0) {
      const matched = options.find((opt) => opt.minutes === selectedDuration);
      onSelectDuration(
        matched ? matched.minutes : options[0].minutes,
        matched || options[0],
      );
    }
  }, [options, selectedDuration, onSelectDuration]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
          1
        </span>
        <h2 className="text-lg font-bold text-slate-800">
          Chọn Gói Thời Lượng Tư Vấn
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-slate-100 rounded-2xl p-5 border border-slate-200 h-36"
            />
          ))
        ) : options.length === 0 ? (
          <div className="col-span-full p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border">
            Hiện chưa có gói tư vấn nào trong hệ thống.
          </div>
        ) : (
          options.map((option) => {
            const isSelected = selectedDuration === option.minutes;
            return (
              <div
                key={option.minutes}
                onClick={() => onSelectDuration(option.minutes, option)}
                className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all space-y-3 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                {option.tag && (
                  <span
                    className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {option.tag}
                  </span>
                )}
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-800 text-base">
                    {option.label}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {option.description}
                </p>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Thanh toán 100%
                  </span>
                  <span className="font-bold text-blue-600 text-lg">
                    {option.formattedPrice}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
