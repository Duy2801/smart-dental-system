"use client";

import { useQuery } from "@tanstack/react-query";
import { getPatientRecords } from "../api";
import { mapRecordTreatments } from "./recordMappers";
import { RecordHistorySection } from "./RecordHistorySection";
import { RecordPatientHero } from "./RecordPatientHero";

export function PatientRecordsPageClient() {
  const recordsQuery = useQuery({
    queryKey: ["patient", "records"],
    queryFn: getPatientRecords,
  });

  if (recordsQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1360px] space-y-7 px-4 py-7 sm:px-6 lg:px-8">
        <section className="h-56 animate-pulse rounded-[26px] bg-slate-100" />
        <section className="h-[540px] animate-pulse rounded-xl bg-slate-100" />
      </main>
    );
  }

  if (recordsQuery.isError || !recordsQuery.data) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
          Không thể tải hồ sơ điều trị. Vui lòng đăng nhập lại hoặc thử lại sau.
        </section>
      </main>
    );
  }

  const treatments = mapRecordTreatments(recordsQuery.data.treatmentPlans);

  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-7 px-4 py-7 sm:px-6 lg:px-8">
      <RecordPatientHero patient={recordsQuery.data.patient} />

      <div className="grid items-start gap-5">
        <RecordHistorySection treatments={treatments} />
      </div>
    </main>
  );
}
