import { SkeletonRows } from "@/src/components/admin/common";
import type { ShiftMatrixResponse } from "../types";

type ShiftMatrixTableProps = {
  loading: boolean;
  matrix: ShiftMatrixResponse | null;
};

export function ShiftMatrixTable({ loading, matrix }: ShiftMatrixTableProps) {
  if (loading || !matrix) {
    return (
      <div className="rounded-xl border border-border bg-white p-5">
        <SkeletonRows count={8} />
      </div>
    );
  }

  const { doctors, days } = matrix;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border">
              <th className="p-4 font-semibold text-slate-700 min-w-[200px]">
                Bác sĩ / Chuyên khoa
              </th>
              {days.map((day) => (
                <th key={day.dayOfWeek} className="p-4 font-semibold text-slate-700 text-center min-w-[130px]">
                  <div>{day.label}</div>
                  {day.isUnderstaffed && (
                    <span className="inline-block mt-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Thiếu nhân sự ({day.activeDoctorCount} BS)
                    </span>
                  )}
                  {!day.isUnderstaffed && day.businessHour?.isOpen && (
                    <span className="inline-block mt-1 text-[11px] font-normal text-emerald-600">
                      {day.activeDoctorCount} BS trực
                    </span>
                  )}
                  {!day.businessHour?.isOpen && (
                    <span className="inline-block mt-1 text-[11px] font-normal text-slate-400">
                      Nghỉ
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-800">{doc.user.fullName}</div>
                  <div className="text-xs text-muted-foreground">{doc.specialization}</div>
                </td>
                {days.map((day) => {
                  const docShift = day.doctorShifts.find((d) => d.doctorId === doc.id);
                  const isAvailable = docShift?.isAvailable;
                  const shifts = docShift?.shifts ?? [];
                  const timeOffs = docShift?.timeOffs ?? [];
                  const overrides = docShift?.dateOverrides ?? [];

                  return (
                    <td key={day.dayOfWeek} className="p-3 text-center vertical-top border-l border-border/50">
                      {timeOffs.length > 0 ? (
                        <span className="inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          Nghỉ phép
                        </span>
                      ) : isAvailable ? (
                        <div className="flex flex-col items-center gap-1">
                          {shifts.map((s) => (
                            <span key={s.id} className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-mono text-emerald-800">
                              {s.startTime} - {s.endTime}
                            </span>
                          ))}
                          {overrides.map((o) => (
                            <span key={o.id} className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-mono text-blue-800">
                              Làm bù: {o.startTime} - {o.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
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
  );
}
