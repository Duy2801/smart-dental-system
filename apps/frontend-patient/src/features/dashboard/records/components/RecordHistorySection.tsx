"use client";

import { useMemo, useState } from "react";
import type { PatientRecordsResponse } from "../api";
import type { TreatmentRecordView } from "./recordMappers";
import { RecordTreatmentCard } from "./RecordTreatmentCard";
import { T } from "../../common/typography";

type RecordHistorySectionProps = {
  treatments: TreatmentRecordView[];
  recordsData: PatientRecordsResponse;
};

const ALL_FILTER = "Tất cả";

export function RecordHistorySection({
  treatments,
  recordsData,
}: RecordHistorySectionProps) {
  const [filter, setFilter] = useState(ALL_FILTER);
  const [selectedId, setSelectedId] = useState(treatments[0]?.id ?? "");

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
    <div className="space-y-5 animate-in fade-in duration-300">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-0">
        <div className="border-b border-slate-200 p-5 sm:p-6 bg-slate-50/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`${T.overline} text-[#0058bc]`}>
                Hồ Sơ Bệnh Án & Kế Hoạch Điều Trị
              </p>
              <h2 className="mt-0.5 text-xl font-extrabold tracking-[-0.02em] text-slate-950">
                Danh sách phác đồ điều trị của bệnh nhân
              </h2>
              <p className={`mt-1.5 max-w-2xl ${T.body}`}>
                Chọn từng phác đồ bên trái để xem hồ sơ bệnh án (chẩn đoán, phim X-quang) hiện trước, sau đó là kế hoạch điều trị và hóa đơn chi tiết bên phải.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Lọc theo loại điều trị"
                value={filter}
                onChange={(event) => handleFilterChange(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100 font-semibold"
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
          {/* Cột Trái: Danh sách phác đồ */}
          <div className="border-b border-slate-200 bg-slate-50/80 lg:border-b-0 lg:border-r">
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
                        className={`w-full rounded-xl border px-4 py-3 text-left transition cursor-pointer ${
                          selected
                            ? "border-[#0863c5] bg-blue-50 shadow-sm ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={`${T.overline} text-[#0058bc]`}>
                              Phác đồ {index + 1}
                            </p>
                            <h3 className="mt-1 text-sm font-semibold text-slate-950">
                              {treatment.title}
                            </h3>
                            <p className={`mt-1 ${T.bodySm}`}>{treatment.date}</p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                            {treatment.category}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    Không có phác đồ phù hợp.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột Phải: Thẻ Chi Tiết Điều Trị (Hiển thị Hồ sơ bệnh án TRƯỚC, sau đó tới Kế hoạch điều trị) */}
          <div className="p-4 sm:p-6">
            {selectedTreatment ? (
              <RecordTreatmentCard
                treatment={selectedTreatment}
                index={filteredTreatments.findIndex(
                  (item) => item.id === selectedTreatment.id,
                )}
                recordsData={recordsData}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Chọn một phác đồ để xem chi tiết.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
