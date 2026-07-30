"use client";

import { useMemo, useState } from "react";
import type { TreatmentRecordView } from "./recordMappers";
import { RecordTreatmentCard } from "./RecordTreatmentCard";
import { DashboardIcon } from "../../common/DashboardIcon";

type RecordHistorySectionProps = {
  treatments: TreatmentRecordView[];
};

const ALL_FILTER = "Tất cả";

export function RecordHistorySection({ treatments }: RecordHistorySectionProps) {
  const [filter, setFilter] = useState(ALL_FILTER);
  const [selectedId, setSelectedId] = useState(treatments[0]?.id ?? "");

  const filterOptions = useMemo(
    () => [ALL_FILTER, ...Array.from(new Set(treatments.map((treatment) => treatment.category)))],
    [treatments],
  );

  const filteredTreatments = useMemo(
    () =>
      filter === ALL_FILTER
        ? treatments
        : treatments.filter((treatment) => treatment.category === filter),
    [filter, treatments],
  );

  const selectedTreatment =
    filteredTreatments.find((treatment) => treatment.id === selectedId) ??
    filteredTreatments[0] ??
    treatments[0];

  function handleFilterChange(value: string) {
    setFilter(value);
    const nextTreatment =
      value === ALL_FILTER
        ? treatments[0]
        : treatments.find((treatment) => treatment.category === value);
    setSelectedId(nextTreatment?.id ?? "");
  }

  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0058bc]">
              Lịch sử điều trị
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-slate-950">
              Danh sách phác đồ
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Chọn từng phác đồ bên trái để xem chi tiết bên phải.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo loại điều trị"
              value={filter}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0058bc]"
            >
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="p-4">
            <div className="space-y-2">
              {filteredTreatments.length ? (
                filteredTreatments.map((treatment, index) => {
                  const selected = treatment.id === selectedTreatment?.id;
                  return (
                    <button
                      key={treatment.id}
                      type="button"
                      onClick={() => setSelectedId(treatment.id)}
                      className={`w-full border px-4 py-3 text-left transition ${selected
                          ? "border-[#0058bc] bg-white shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0058bc]">
                            Phác đồ {index + 1}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-950">
                            {treatment.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{treatment.date}</p>
                        </div>
                        <span className="border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          {treatment.category}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  Không có phác đồ phù hợp.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {selectedTreatment ? (
            <RecordTreatmentCard
              treatment={selectedTreatment}
              index={filteredTreatments.findIndex((item) => item.id === selectedTreatment.id)}
            />
          ) : (
            <div className="border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Chọn một phác đồ để xem chi tiết.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
