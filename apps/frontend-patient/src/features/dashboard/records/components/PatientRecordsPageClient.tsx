"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPatientRecords } from "../api";
import { mapRecordTreatments } from "./recordMappers";
import { RecordHistorySection } from "./RecordHistorySection";
import { RecordPatientHero } from "./RecordPatientHero";
import { PatientPageSkeleton } from "../../common/PatientSkeleton";
import { ROUTES } from "../../common/routes";

export function PatientRecordsPageClient() {
  const recordsQuery = useQuery({
    queryKey: ["patient", "records"],
    queryFn: getPatientRecords,
  });

  if (recordsQuery.isLoading) {
    return <PatientPageSkeleton />;
  }

  if (recordsQuery.isError || !recordsQuery.data) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
        <section className="border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          Không thể tải hồ sơ điều trị. Vui lòng đăng nhập lại hoặc thử lại sau.
        </section>
      </main>
    );
  }

  const treatments = mapRecordTreatments(recordsQuery.data.treatmentPlans);

  return (
    <main className="mx-auto w-full max-w-[1520px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#0058bc]">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800">Hồ sơ bệnh án</span>
      </div>

      <RecordPatientHero patient={recordsQuery.data.patient} />
      <section className="w-full">
        <RecordHistorySection treatments={treatments} />
      </section>
    </main>
  );
}
