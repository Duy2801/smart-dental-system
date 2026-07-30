"use client";

import { useMemo, useState } from "react";
import type { TreatmentRecordView } from "./recordMappers";
import { RecordTreatmentCard } from "./RecordTreatmentCard";

type RecordHistorySectionProps = {
  treatments: TreatmentRecordView[];
};

const PAGE_SIZE = 3;
const ALL_FILTER = "Tất cả điều trị";

export function RecordHistorySection({
  treatments,
}: RecordHistorySectionProps) {
  const [filter, setFilter] = useState(ALL_FILTER);
  const [page, setPage] = useState(1);
  const filterOptions = useMemo(
    () => [
      ALL_FILTER,
      ...Array.from(new Set(treatments.map((treatment) => treatment.category))),
    ],
    [treatments],
  );
  const filteredTreatments = useMemo(
    () =>
      filter === ALL_FILTER
        ? treatments
        : treatments.filter((treatment) => treatment.category === filter),
    [filter, treatments],
  );
  const totalPages = Math.max(1, Math.ceil(filteredTreatments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleTreatments = filteredTreatments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc]">
            Hành trình chăm sóc
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Lịch sử điều trị
          </h2>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="hidden sm:inline">Lọc theo</span>
          <select
            aria-label="Lọc theo loại điều trị"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#0058bc] outline-none focus:border-blue-400"
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        {visibleTreatments.length ? (
          visibleTreatments.map((treatment, index) => (
            <RecordTreatmentCard
              key={treatment.id}
              treatment={treatment}
              index={(currentPage - 1) * PAGE_SIZE + index}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Chưa có dữ liệu điều trị phù hợp.
          </div>
        )}
      </div>

      {filteredTreatments.length > PAGE_SIZE && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            Hiển thị {visibleTreatments.length} / {filteredTreatments.length} hồ sơ
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0058bc]">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
