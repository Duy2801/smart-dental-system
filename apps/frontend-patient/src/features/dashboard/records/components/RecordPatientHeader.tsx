import type { PatientRecordsResponse } from "../api";
import { getGenderLabel, getInitials } from "./recordMappers";

type Props = {
  patient: PatientRecordsResponse["patient"];
  doctor?: string;
  specialty?: string;
};

function formatBirthAndAge(patient: Props["patient"]) {
  if (!patient.dateOfBirth) return patient.age != null ? `${patient.age} tuổi` : "Chưa cập nhật";
  const birth = new Date(patient.dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "Chưa cập nhật";
  const today = new Date();
  const age =
    patient.age ??
    today.getFullYear() -
      birth.getFullYear() -
      (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
        ? 1
        : 0);
  return `${birth.toLocaleDateString("vi-VN")} (${age} tuổi)`;
}

export function RecordPatientHeader({ patient, doctor, specialty }: Props) {
  const hasAllergy =
    patient.medicalHistory &&
    /dị ứng|allergy|penicillin|kháng sinh/i.test(patient.medicalHistory);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 transition-all space-y-4">
      {/* 1. Top Identity Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1996e0] to-[#0863c5] text-lg font-black text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
            {getInitials(patient.fullName)}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {patient.fullName}
              </h2>
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/90 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                {patient.patientCode || "PAT-RECORD"}
              </span>
              <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0863c5]">
                Hồ sơ chính
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span>Hồ sơ y tế điện tử SmartDental</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-semibold">Đồng bộ hoạt động</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Info Chips (Dedicated Full-Width 3-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Chip 1: Ngày sinh / Tuổi */}
        <div className="flex flex-col items-center justify-center text-center rounded-xl border border-slate-100 bg-[#f8fbfe] p-3.5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Ngày sinh / Tuổi
          </span>
          <span className="mt-0.5 block text-sm font-extrabold text-slate-800 whitespace-nowrap">
            {formatBirthAndAge(patient)}
          </span>
        </div>

        {/* Chip 2: Số điện thoại */}
        <div className="flex flex-col items-center justify-center text-center rounded-xl border border-slate-100 bg-[#f8fbfe] p-3.5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Số điện thoại
          </span>
          <span className="mt-0.5 block text-sm font-extrabold text-slate-800 whitespace-nowrap">
            {patient.phone || "Chưa cập nhật"}
          </span>
        </div>

        {/* Chip 3: Giới tính */}
        <div className="flex flex-col items-center justify-center text-center rounded-xl border border-slate-100 bg-[#f8fbfe] p-3.5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Giới tính
          </span>
          <span className="mt-0.5 block text-sm font-extrabold text-slate-800 whitespace-nowrap">
            {getGenderLabel(patient.gender)}
          </span>
        </div>
      </div>

      {/* 3. Bottom Medical Alert & In-Charge Doctor Strip */}
      <div className="grid gap-3 pt-1 sm:grid-cols-2">
        {/* Panel 1: Medical History / Allergy */}
        <div
          className={`flex items-start gap-3 rounded-xl p-3.5 transition-colors ${
            hasAllergy
              ? "border border-amber-200/90 bg-amber-50/70 text-amber-900"
              : "border border-slate-200/80 bg-slate-50/70 text-slate-800"
          }`}
        >
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-lg ${
              hasAllergy
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-200/80 text-slate-600"
            }`}
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span
              className={`block text-[10px] font-black uppercase tracking-wider ${
                hasAllergy ? "text-amber-800" : "text-slate-500"
              }`}
            >
              Tiền sử y khoa & dị ứng
            </span>
            <p className="mt-0.5 text-xs font-bold leading-relaxed line-clamp-2">
              {patient.medicalHistory || "Không ghi nhận tiền sử dị ứng / bệnh nền đặc biệt."}
            </p>
          </div>
        </div>

        {/* Panel 2: In-Charge Doctor */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-[#f4f9fd]/80 p-3.5 text-slate-800">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-blue-100 text-[#0863c5]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#1996e0]">
              Bác sĩ của mục đang xem
            </span>
            <p className="mt-0.5 text-xs font-bold text-slate-900 truncate">
              {doctor ? `${doctor}${specialty ? ` (${specialty})` : ""}` : "Bác sĩ chuyên khoa tại phòng khám"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
