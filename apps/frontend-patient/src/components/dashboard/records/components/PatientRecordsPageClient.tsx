"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPatientRecords } from "../api";
import { mapRecordTreatments } from "./recordMappers";
import { RecordHistorySection } from "./RecordHistorySection";
import { RecordPatientHero } from "./RecordPatientHero";
import { DashboardIcon } from "../../common/DashboardIcon";

export function PatientRecordsPageClient() {
  const recordsQuery = useQuery({
    queryKey: ["patient", "records"],
    queryFn: getPatientRecords,
  });

  if (recordsQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <section className="h-56 animate-pulse border border-slate-200 bg-slate-100" />
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]">
            <div className="h-[720px] animate-pulse border border-slate-200 bg-slate-100" />
            <div className="h-[720px] animate-pulse border border-slate-200 bg-slate-100" />
          </section>
        </div>
      </main>
    );
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
  const activeTreatment = treatments[0];

  return (
    <main className="mx-auto w-full max-w-[1520px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Link href="/home" className="hover:text-[#0058bc]">
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

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
