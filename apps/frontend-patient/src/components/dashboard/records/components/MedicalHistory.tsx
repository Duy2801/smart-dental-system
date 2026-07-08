"use client";

import { useMemo, useState } from "react";
import type { MedicalHistoryRecord } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";

type HistoryFilter = "Tất cả" | MedicalHistoryRecord["category"];

const filters: HistoryFilter[] = ["Tất cả", "Khám tổng quát", "Nội nha", "Phục hình", "Chỉnh nha"];

export function MedicalHistory({ records }: { records: MedicalHistoryRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("Tất cả");
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    const filtered = records.filter((record) => {
      const matchesFilter = filter === "Tất cả" || record.category === filter;
      const matchesQuery =
        !normalizedQuery ||
        `${record.title} ${record.description}`.toLocaleLowerCase("vi").includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });

    return expanded ? filtered : filtered.slice(0, 2);
  }, [expanded, filter, query, records]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-900">Lịch sử khám bệnh</h2>
          <p className="mt-1 text-xs text-slate-500">Theo dõi các lần thăm khám và điều trị trước đây.</p>
        </div>
        <div className="flex gap-2">
          <label className="relative block min-w-0 flex-1 sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-slate-400">
              <DashboardIcon name="search" className="h-4 w-4" />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm hồ sơ..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none transition focus:border-[#0863c5] focus:bg-white focus:ring-3 focus:ring-blue-100"
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((current) => !current)}
              aria-expanded={filterOpen}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <span aria-hidden="true">☷</span> Lọc
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setFilter(item);
                      setFilterOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                      filter === item ? "bg-blue-50 font-bold text-[#0863c5]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleRecords.map((record) => (
          <article key={record.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#0863c5]">{record.category}</p>
                <h3 className="mt-1 text-sm font-bold text-slate-800">{record.title}</h3>
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                {record.date}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{record.description}</p>
            <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0863c5] hover:underline">
              Xem chi tiết <DashboardIcon name="arrow" className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}

        {visibleRecords.length === 0 && (
          <div className="rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-400">
            Không tìm thấy hồ sơ phù hợp.
          </div>
        )}
      </div>

      {records.length > 2 && !query && filter === "Tất cả" && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mx-auto mt-5 block text-xs font-semibold text-slate-500 hover:text-[#0863c5]"
        >
          {expanded ? "Thu gọn lịch sử" : "Xem thêm lịch sử"}
        </button>
      )}
    </section>
  );
}
