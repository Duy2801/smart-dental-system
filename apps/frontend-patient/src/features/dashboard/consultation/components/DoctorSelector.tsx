"use client";

import { useEffect } from "react";
import { useConsultationDoctorsQuery } from "../hooks/useConsultationQueries";

interface DoctorSelectorProps {
  selectedDoctorId: string;
  onSelectDoctor: (doctorId: string) => void;
}

export function DoctorSelector({
  selectedDoctorId,
  onSelectDoctor,
}: DoctorSelectorProps) {
  const { data: doctors = [], isLoading, isError } = useConsultationDoctorsQuery();

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      onSelectDoctor(doctors[0].id);
    }
  }, [doctors, selectedDoctorId, onSelectDoctor]);

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
          2
        </span>
        <h2 className="text-lg font-bold text-slate-800">
          Chọn Bác Sĩ Tư Vấn Trực Tuyến
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 border border-slate-200 bg-white flex items-center gap-4 animate-pulse"
            >
              <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-3 w-20 bg-slate-200 rounded-md" />
                <div className="h-3 w-16 bg-slate-200 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          Không thể tải danh sách bác sĩ tư vấn.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => {
            const isSelected = selectedDoctorId === doctor.id;
            return (
              <div
                key={doctor.id}
                onClick={() => onSelectDoctor(doctor.id)}
                className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-lg">
                  {doctor.avatarUrl ? (
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    doctor.fullName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {doctor.fullName}
                  </h4>
                  <p className="text-xs text-blue-600 font-medium truncate">
                    {doctor.specialization}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {doctor.yearsExperience} năm kinh nghiệm
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
