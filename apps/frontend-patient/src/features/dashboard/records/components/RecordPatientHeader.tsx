import type { PatientRecordsResponse } from "../api";
import { getGenderLabel, getInitials } from "./recordMappers";

type Props = {
  patient: PatientRecordsResponse["patient"];
  doctor?: string;
  specialty?: string;
  recordDate?: string;
};

function formatBirthDate(patient: Props["patient"]) {
  if (!patient.dateOfBirth) return "Chưa cập nhật";
  const birth = new Date(patient.dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "Chưa cập nhật";
  return birth.toLocaleDateString("vi-VN");
}

export function RecordPatientHeader({ patient, doctor, specialty, recordDate }: Props) {
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

      {/* 2. Key Info Chips (Dedicated Full-Width Grid) */}
      <div className={`grid grid-cols-1 gap-3 ${recordDate ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        {/* Chip 1: Ngày sinh */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#f8fbfe] p-3 sm:px-3.5 text-left transition-colors hover:border-blue-100">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0863c5]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Ngày sinh
            </span>
            <span className="mt-0.5 block text-sm font-extrabold text-slate-800 truncate">
              {formatBirthDate(patient)}
            </span>
          </div>
        </div>

        {/* Chip 2: Số điện thoại */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#f8fbfe] p-3 sm:px-3.5 text-left transition-colors hover:border-blue-100">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0863c5]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Số điện thoại
            </span>
            <span className="mt-0.5 block text-sm font-extrabold text-slate-800 truncate">
              {patient.phone || "Chưa cập nhật"}
            </span>
          </div>
        </div>

        {/* Chip 3: Giới tính */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#f8fbfe] p-3 sm:px-3.5 text-left transition-colors hover:border-blue-100">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0863c5]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Giới tính
            </span>
            <span className="mt-0.5 block text-sm font-extrabold text-slate-800 truncate">
              {getGenderLabel(patient.gender)}
            </span>
          </div>
        </div>

        {/* Chip 4: Ngày lập hồ sơ */}
        {recordDate && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:px-3.5 text-left transition-colors hover:border-blue-200">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-100 text-[#0863c5]">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#0058bc] whitespace-nowrap">
                Ngày lập hồ sơ
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-[#07366f] truncate">
                {recordDate}
              </span>
            </div>
          </div>
        )}
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
