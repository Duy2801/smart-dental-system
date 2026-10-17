"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { SkeletonRows } from "@/src/components/admin/common";
import type { ShiftMatrixResponse } from "../types";

type ShiftMatrixTableProps = {
  loading: boolean;
  matrix: ShiftMatrixResponse | null;
};

export function ShiftMatrixTable({ loading, matrix }: ShiftMatrixTableProps) {
  if (loading || !matrix) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SkeletonRows count={8} />
      </div>
    );
  }

  const { doctors, days } = matrix;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-emerald-300 bg-emerald-100" /> Ca trực
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-sky-300 bg-sky-100" /> Làm bù
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-red-300 bg-red-100" /> Nghỉ phép
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="sticky left-0 z-10 min-w-50 bg-slate-50 p-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Bác sĩ / Chuyên khoa
                </th>
                {days.map((day) => (
                  <th key={day.dayOfWeek} className="min-w-32.5 p-3 text-center align-top">
                    <div className="text-sm font-bold text-slate-800">{day.label}</div>
                    {!day.businessHour?.isOpen ? (
                      <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        Nghỉ
                      </span>
                    ) : day.isUnderstaffed ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <WarningCircle size={11} weight="fill" />
                        Thiếu ({day.activeDoctorCount} BS)
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {day.activeDoctorCount} BS trực
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 bg-white p-4">
                    <div className="font-semibold text-slate-900">{doc.user.fullName}</div>
                    <div className="text-xs text-slate-500">{doc.specialization}</div>
                  </td>
                  {days.map((day) => {
                    const docShift = day.doctorShifts.find((d) => d.doctorId === doc.id);
                    const isAvailable = docShift?.isAvailable;
                    const shifts = docShift?.shifts ?? [];
                    const timeOffs = docShift?.timeOffs ?? [];
                    const overrides = docShift?.dateOverrides ?? [];

                    return (
                      <td key={day.dayOfWeek} className="border-l border-slate-100 p-2.5 text-center align-top">
                        {timeOffs.length > 0 ? (
                          <span className="inline-block rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Nghỉ phép
                          </span>
                        ) : isAvailable ? (
                          <div className="flex flex-col items-center gap-1">
                            {shifts.map((s) => (
                              <span key={s.id} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800">
                                {s.startTime} - {s.endTime}
                              </span>
                            ))}
                            {overrides.map((o) => (
                              <span key={o.id} className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-xs font-semibold text-sky-800">
                                Bù {o.startTime} - {o.endTime}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
