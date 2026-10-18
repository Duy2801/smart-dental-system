"use client";

import { MagicWand, PencilSimpleLine, Stethoscope } from "@phosphor-icons/react";
import { AdminButton, AdminFilterSelect, AdminToolbar } from "@/src/components/admin/common";
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
  const actionDisabled = !doctorId || scheduleDisabled;

  return (
    <AdminToolbar
      actions={
        <>
          <AdminButton variant="secondary" onClick={onOpenManual} disabled={actionDisabled}>
            <PencilSimpleLine size={16} weight="bold" />
            Cập nhật ca
          </AdminButton>
          <AdminButton onClick={onOpenAuto} disabled={actionDisabled}>
            <MagicWand size={16} weight="bold" />
            Tự động lên lịch
          </AdminButton>
        </>
      }
    >
      <AdminFilterSelect
        value={doctorId}
        onChange={(event) => onDoctorChange(event.target.value)}
        disabled={loadingDoctors || doctors.length === 0}
        aria-label="Chọn bác sĩ"
        icon={<Stethoscope size={15} />}
        wrapperClassName="w-full sm:w-72"
      >
        {doctors.length === 0 ? (
          <option value="">{loadingDoctors ? "Đang tải bác sĩ..." : "Chưa có bác sĩ"}</option>
        ) : (
          doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {getDoctorName(doctor)}
            </option>
          ))
        )}
      </AdminFilterSelect>
      {selectedDoctor ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono font-bold text-slate-700">
            {selectedDoctor.doctorCode}
          </span>
          {selectedDoctor.specialization ? (
            <span className="rounded-md bg-brand-light px-2 py-1 font-semibold text-brand">
              {selectedDoctor.specialization}
            </span>
          ) : null}
        </div>
      ) : null}
    </AdminToolbar>
  );
}
