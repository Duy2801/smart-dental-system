import type { PatientRecordsResponse } from "../api";
import { DashboardIcon } from "../../common/DashboardIcon";
import { PatientProfileEditor } from "../../profile/components/PatientProfileEditor";
import {
  formatShortDate,
  getGenderLabel,
  getInitials,
} from "./recordMappers";
import { RecordInfoChip } from "./RecordInfoChip";

type RecordPatientHeroProps = {
  patient: PatientRecordsResponse["patient"];
};

export function RecordPatientHero({ patient }: RecordPatientHeroProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[]">
      <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-50" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0058bc] to-cyan-400 text-3xl font-extrabold text-white shadow-xl shadow-blue-100">
            <DashboardIcon
              name="user"
              className="absolute -bottom-3 h-28 w-28 text-white/15"
            />
            <span className="relative">{getInitials(patient.fullName)}</span>
            <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {patient.fullName}
              </h1>
              <span className="mx-auto w-fit rounded-full bg-[#0058bc] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:mx-0">
                Patient ID: #{patient.patientCode}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {getGenderLabel(patient.gender)} · {patient.age ?? "--"} tuổi ·{" "}
              {patient.address ?? "Chưa cập nhật địa chỉ"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <RecordInfoChip icon="clock">
                Lần khám cuối:{" "}
                {patient.lastVisitAt
                  ? formatShortDate(patient.lastVisitAt)
                  : "Chưa có"}
              </RecordInfoChip>
              <RecordInfoChip icon="chat">
                {patient.phone ?? patient.email}
              </RecordInfoChip>
            </div>
          </div>
          <PatientProfileEditor />
        </div>
      </div>
    </section>
  );
}
