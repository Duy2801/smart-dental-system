import Link from "next/link";
import type { PatientRecordsResponse } from "../api";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";
import {
  formatShortDate,
  getGenderLabel,
  getInitials,
} from "./recordMappers";

type RecordPatientHeroProps = {
  patient: PatientRecordsResponse["patient"];
  relationshipLabel?: string;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className={`text-xs font-medium ${T.bodySm}`}>{label}</span>
      <span className="max-w-[60%] truncate text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className={T.fieldLabel}>{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function RecordPatientHero({
  patient,
  relationshipLabel = "Người khám",
}: RecordPatientHeroProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.75fr)]">
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-extrabold text-slate-900">
                {getInitials(patient.fullName)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={T.overline + " text-[#0058bc]"}>
                    Hồ sơ bệnh án
                  </p>
                  <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    {relationshipLabel}
                  </span>
                </div>
                <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] text-slate-950">
                  {patient.fullName}
                </h1>
                <p className={`mt-2 ${T.body}`}>
                  Patient ID: #{patient.patientCode}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoBox label="Giới tính" value={getGenderLabel(patient.gender)} />
            <InfoBox
              label="Tuổi"
              value={patient.age ? `${patient.age} tuổi` : "Chưa cập nhật"}
            />
            <InfoBox
              label="Lần khám cuối"
              value={
                patient.lastVisitAt
                  ? formatShortDate(patient.lastVisitAt)
                  : "Chưa có"
              }
            />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <MetaRow label="Liên hệ" value={patient.phone ?? patient.email ?? "Chưa cập nhật"} />
          <MetaRow
            label="Địa chỉ"
            value={patient.address ?? "Chưa cập nhật địa chỉ"}
          />
          <MetaRow
            label="Tình trạng"
            value={
              patient.medicalHistory
                ? "Đã có ghi chú lâm sàng"
                : "Đang trống"
            }
          />
          <div className="mt-4 grid gap-2">
            <Link
              href={ROUTES.appointment}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#0863c5] bg-[#0863c5] text-sm font-semibold text-white transition hover:bg-[#0753a8]"
            >
              Đặt lịch hẹn
            </Link>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#0863c5]"
            >
              Tải hồ sơ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
