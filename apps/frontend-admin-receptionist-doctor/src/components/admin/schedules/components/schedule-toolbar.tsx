import { AdminButton } from "@/src/components/admin/common";
import { getDoctorName } from "../schedule-utils";
import type { Doctor } from "../types";

type ScheduleToolbarProps = {
  doctorId: string;
  doctors: Doctor[];
  loadingDoctors: boolean;
  onDoctorChange: (doctorId: string) => void;
  onOpenAuto: () => void;
  onOpenManual: () => void;
  scheduleDisabled: boolean;
  selectedDoctor?: Doctor;
};

export function ScheduleToolbar({
  doctorId,
  doctors,
  loadingDoctors,
  onDoctorChange,
  onOpenAuto,
  onOpenManual,
  scheduleDisabled,
  selectedDoctor,
}: ScheduleToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:min-w-72">
        <select
          value={doctorId}
          onChange={(event) => onDoctorChange(event.target.value)}
          disabled={loadingDoctors || doctors.length === 0}
          className="h-12 rounded-lg border border-border bg-white px-3 text-sm font-medium text-brand-dark outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-muted"
        >
          {doctors.length === 0 ? (
            <option value="">Chưa có bác sĩ</option>
          ) : (
            doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {getDoctorName(doctor)}
              </option>
            ))
          )}
        </select>
        {selectedDoctor ? (
          <span className="text-xs text-muted-foreground">
            {selectedDoctor.doctorCode} - {selectedDoctor.specialization}
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <AdminButton
          variant="secondary"
          onClick={onOpenManual}
          disabled={!doctorId || scheduleDisabled}
          className="h-12"
        >
          Thêm ca
        </AdminButton>
        <AdminButton
          onClick={onOpenAuto}
          disabled={!doctorId || scheduleDisabled}
          className="h-12"
        >
          Tự động lên lịch
        </AdminButton>
      </div>
    </div>
  );
}
