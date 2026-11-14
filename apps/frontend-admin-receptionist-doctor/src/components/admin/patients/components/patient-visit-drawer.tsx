"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CaretDown,
  ClipboardText,
  FirstAidKit,
  IdentificationCard,
  Pill,
  Stethoscope,
  VideoCamera,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  AdminAlert,
  AdminButton,
  AdminFormSection,
  AdminModal,
  Skeleton,
  StatusBadge,
} from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { cn } from "@/src/lib/utils/cn";
import { formatDate, formatDateTime } from "@/src/lib/utils/date";
import { getPatientDetail, getVisitMedicalRecord } from "../patients-api";
import { formatMoney, genderLabel, visitStatus } from "../patient-utils";
import type { PatientDetail, PatientVisit } from "../types";

type VisitFilter = "COMPLETED" | "ALL";

export function PatientVisitDrawer({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const { data: patient, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.patientDetail(patientId),
    queryFn: () => getPatientDetail(patientId),
  });

  return (
    <AdminModal
      variant="drawer"
      title={patient?.fullName ?? "Hồ sơ bệnh nhân"}
      description={patient ? `Mã bệnh nhân ${patient.patientCode}` : "Đang tải thông tin..."}
      icon={<IdentificationCard size={20} weight="duotone" />}
      onClose={onClose}
      footer={
        <AdminButton variant="secondary" onClick={onClose}>
          Đóng
        </AdminButton>
      }
    >
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : isError || !patient ? (
        <div className="mt-4">
          <AdminAlert message="Không tải được hồ sơ bệnh nhân." />
        </div>
      ) : (
        <PatientDetailBody patient={patient} />
      )}
    </AdminModal>
  );
}

function PatientDetailBody({ patient }: { patient: PatientDetail }) {
  const [filter, setFilter] = useState<VisitFilter>("COMPLETED");
  const visits =
    filter === "COMPLETED"
      ? patient.appointments.filter((visit) => visit.status === "COMPLETED")
      : patient.appointments;
  const allergies = patient.allergies ?? [];

  return (
    <div className="mt-4 flex flex-col gap-4">
      <AdminFormSection title="Thông tin cá nhân" icon={<IdentificationCard size={15} weight="bold" />}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <InfoItem label="Số điện thoại" value={patient.phone} />
          <InfoItem label="Email" value={patient.email} />
          <InfoItem
            label="Giới tính / tuổi"
            value={`${genderLabel(patient.gender)}${patient.age !== null ? ` · ${patient.age} tuổi` : ""}`}
          />
          <InfoItem
            label="Ngày sinh"
            value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : null}
          />
          <InfoItem label="Địa chỉ" value={patient.address} className="sm:col-span-2" />
          <InfoItem
            label="Liên hệ khẩn cấp"
            value={
              patient.emergencyContactName
                ? `${patient.emergencyContactName}${patient.emergencyContactPhone ? ` · ${patient.emergencyContactPhone}` : ""}`
                : null
            }
            className="sm:col-span-2"
          />
        </dl>
        {allergies.length > 0 || patient.medicalHistory ? (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <WarningCircle size={16} weight="fill" className="mt-px shrink-0" />
            <div>
              <p className="font-bold">Tiền sử / dị ứng</p>
              <p className="mt-0.5 leading-5">
                {allergies.length > 0 ? allergies.join(", ") : patient.medicalHistory}
              </p>
            </div>
          </div>
        ) : null}
      </AdminFormSection>

      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="Lần khám" value={`${patient.totalVisits}`} tone="brand" />
        <SummaryTile label="Đã thanh toán" value={formatMoney(patient.finance?.paidTotal)} tone="emerald" />
        <SummaryTile label="Tổng hóa đơn" value={formatMoney(patient.finance?.billedTotal)} tone="slate" />
      </div>

      {patient.activeTreatmentPlan ? (
        <TreatmentPlanCard plan={patient.activeTreatmentPlan} />
      ) : null}

      <AdminFormSection title="Lịch sử khám" icon={<ClipboardText size={15} weight="bold" />}>
        <div role="tablist" className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-100 p-1">
          {(
            [
              { value: "COMPLETED", label: `Đã khám (${patient.totalVisits})` },
              { value: "ALL", label: `Tất cả lịch hẹn (${patient.appointments.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filter === tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                filter === tab.value
                  ? "bg-white text-brand shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {visits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white py-6 text-center text-xs text-slate-500">
            Chưa có lần khám nào.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {visits.map((visit) => (
              <VisitItem key={visit.id} visit={visit} />
            ))}
          </ol>
        )}
      </AdminFormSection>
    </div>
  );
}

function VisitItem({ visit }: { visit: PatientVisit }) {
  const [open, setOpen] = useState(false);
  const status = visitStatus(visit.status);
  const canOpen = Boolean(visit.recordId);

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors",
          canOpen ? "hover:bg-slate-50" : "cursor-default",
        )}
      >
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            visit.type === "ONLINE" ? "bg-violet-50 text-violet-600" : "bg-brand-light text-brand",
          )}
        >
          {visit.type === "ONLINE" ? <VideoCamera size={17} weight="duotone" /> : <Stethoscope size={17} weight="duotone" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{visit.serviceName}</p>
          <p className="truncate text-xs text-slate-500">
            {formatDateTime(visit.scheduledAt)} · BS. {visit.doctorName.replace(/^BS\.?\s*/i, "")}
          </p>
        </div>
        <StatusBadge label={status.label} variant={status.variant} />
        {canOpen ? (
          <CaretDown
            size={14}
            weight="bold"
            className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          />
        ) : null}
      </button>
      {open && visit.recordId ? <VisitRecord recordId={visit.recordId} /> : null}
    </li>
  );
}

function VisitRecord({ recordId }: { recordId: string }) {
  const { data: record, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.medicalRecord(recordId),
    queryFn: () => getVisitMedicalRecord(recordId),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }
  if (isError || !record) {
    return (
      <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-red-600">
        Không tải được hồ sơ bệnh án của lần khám này.
      </p>
    );
  }

  const medicines = record.prescriptions.flatMap((p) => p.items);

  return (
    <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RecordField label="Lý do khám" value={record.chiefComplaint} />
        <RecordField label="Chẩn đoán" value={record.diagnosis} />
        <RecordField label="Điều trị" value={record.treatmentNotes} className="sm:col-span-2" />
        <RecordField
          label="Hẹn tái khám"
          value={record.followUpDate ? formatDate(record.followUpDate) : null}
        />
      </dl>
      {medicines.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <Pill size={13} weight="bold" /> Đơn thuốc
          </p>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {medicines.map((item, index) => (
              <li key={`${item.medicineName}-${index}`} className="px-3 py-2 text-xs">
                <span className="font-bold text-slate-800">{item.medicineName}</span>
                <span className="text-slate-500">
                  {" "}
                  · {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")}
                </span>
                {item.instruction ? <p className="mt-0.5 text-slate-500">{item.instruction}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TreatmentPlanCard({ plan }: { plan: NonNullable<PatientDetail["activeTreatmentPlan"]> }) {
  const percent = plan.totalSteps > 0 ? Math.round((plan.completedSteps / plan.totalSteps) * 100) : 0;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <FirstAidKit size={16} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kế hoạch điều trị đang thực hiện</p>
          <p className="truncate text-sm font-bold text-slate-900">{plan.title}</p>
        </div>
        <span className="text-xs font-bold tabular-nums text-slate-700">
          {plan.completedSteps}/{plan.totalSteps} bước
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

const tileTones = {
  brand: "text-brand",
  emerald: "text-emerald-700",
  slate: "text-slate-800",
};

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof tileTones;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className={cn("mt-1 truncate text-base font-extrabold tabular-nums", tileTones[tone])}>{value}</p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function RecordField({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line break-words text-slate-800">{value || "—"}</dd>
    </div>
  );
}
