import Link from "next/link";
import type { PatientRecordsResponse } from "../api";
import { PatientProfileEditor } from "../../profile/components/PatientProfileEditor";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";
import {
  formatShortDate,
  getGenderLabel,
  getInitials,
} from "./recordMappers";

type RecordPatientHeroProps = {
  patient: PatientRecordsResponse["patient"];
};

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className={`text-xs font-medium ${T.bodySm}`}>{label}</span>
      <span className="max-w-[60%] truncate text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

export function RecordPatientHero({ patient }: RecordPatientHeroProps) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.75fr)]">
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center border border-slate-200 bg-slate-50 text-xl font-extrabold text-slate-900">
                {getInitials(patient.fullName)}
              </div>
              <div>
                <p className={T.overline + " text-[#0058bc]"}>
                  Hồ sơ bệnh án
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] text-slate-950">
                  {patient.fullName}
                </h1>
                <p className={`mt-2 ${T.body}`}>
                  Patient ID: #{patient.patientCode}
                </p>
              </div>
            </div>

            <PatientProfileEditor />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className={T.fieldLabel}>Giới tính</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {getGenderLabel(patient.gender)}
              </p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className={T.fieldLabel}>Tuổi</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {patient.age ? `${patient.age} tuổi` : "Chưa cập nhật"}
              </p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className={T.fieldLabel}>Lần khám cuối</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {patient.lastVisitAt
                  ? formatShortDate(patient.lastVisitAt)
                  : "Chưa có"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <MetaRow label="Liên hệ" value={patient.phone ?? patient.email} />
          <MetaRow
            label="Địa chỉ"
            value={patient.address ?? "Chưa cập nhật địa chỉ"}
          />
          <MetaRow
            label="Tình trạng"
            value={patient.medicalHistory ? "Đã có ghi chú lâm sàng" : "Đang trống"}
          />
          <div className="mt-4 grid gap-2">
            <Link
              href={ROUTES.appointment}
              className="inline-flex h-10 items-center justify-center border border-[#0058bc] bg-[#0058bc] text-sm font-semibold text-white transition hover:bg-[#054a9f]"
            >
              Đặt lịch hẹn
            </Link>
            <Link
              href={ROUTES.records}
              className="inline-flex h-10 items-center justify-center border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-[#0058bc] hover:text-[#0058bc]"
            >
              Tải hồ sơ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
