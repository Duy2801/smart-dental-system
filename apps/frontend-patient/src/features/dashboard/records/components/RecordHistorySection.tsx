"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatientRecordsResponse } from "../api";
import type { TreatmentRecordView } from "./recordMappers";
import { RecordTreatmentCard } from "./RecordTreatmentCard";
import { DashboardIcon } from "../../common/DashboardIcon";
import type { PatientProfile } from "../../appointment/api";

type RecordHistorySectionProps = {
  treatments: TreatmentRecordView[];
  recordsData: PatientRecordsResponse;
  profiles?: PatientProfile[];
  selectedPatientId?: string;
  onSelectPatient?: (patientId: string) => void;
};

const ALL_FILTER = "Tất cả";

const relationshipLabels: Record<string, string> = {
  SELF: "Tôi",
  CHILD: "Con",
  FATHER: "Bố",
  MOTHER: "Mẹ",
  OTHER: "Người thân",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function RecordHistorySection({
  treatments,
  recordsData,
  profiles = [],
  selectedPatientId,
  onSelectPatient,
}: RecordHistorySectionProps) {
  const [filter, setFilter] = useState(ALL_FILTER);
  const [selectedId, setSelectedId] = useState(treatments[0]?.id ?? "");

  // Tự động chuyển selectedId về phác đồ đầu tiên của bệnh nhân khi đổi bệnh nhân/dữ liệu phác đồ
  useEffect(() => {
    if (treatments.length > 0) {
      setSelectedId((prev) => {
        const exists = treatments.some((t) => t.id === prev);
        return exists ? prev : treatments[0].id;
      });
    } else {
      setSelectedId("");
    }
  }, [treatments]);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Left-Aligned Hero Section */}
      <section className="py-1 space-y-2.5 text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0863c5]">
          <DashboardIcon name="sparkles" className="h-3.5 w-3.5 text-[#0863c5]" />
          Hồ Sơ Y Khoa Gia Đình & Phác Đồ Điều Trị
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Danh Sách Phác Đồ & Hồ Sơ Bệnh Nhân
        </h1>

        <p className="max-w-2xl text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
          Chọn người khám trong gia đình và xem chi tiết phác đồ điều trị, đơn thuốc và tiến trình y khoa.
        </p>
      </section>

      {/* Main Consolidated Dashboard Panel */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-[#f4f9fd]/70 p-4 sm:p-5 lg:border-b-0 lg:border-r space-y-4">
            {/* Section 1: Family Profile Picker */}
            {profiles.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DashboardIcon name="user" className="h-3.5 w-3.5 text-[#1996e0]" />
                  Hồ Sơ Người Khám ({profiles.length}):
                </span>

                <div className="space-y-2 w-full">
                  {profiles.map((profile) => {
                    const selected = profile.id === selectedPatientId;
                    const relLabel = relationshipLabels[profile.relationship] ?? "Người thân";

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => onSelectPatient?.(profile.id)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-left border ${
                          selected
                            ? "bg-gradient-to-r from-[#1996e0] to-blue-600 text-white border-[#1996e0] shadow-md shadow-blue-500/20"
                            : "bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              selected
                                ? "bg-white text-[#1996e0] shadow-xs"
                                : "bg-blue-50 text-[#1996e0]"
                            }`}
                          >
                            {getInitials(profile.fullName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-extrabold leading-snug break-words">
                              {profile.fullName}
                            </span>
                            <span
                              className={`text-[10px] font-semibold block mt-0.5 ${
                                selected ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {relLabel} {profile.isPrimary && "• (Hồ sơ chính)"}
                            </span>
                          </div>
                        </div>

                        {selected && (
                          <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-black shrink-0">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Treatment List Header & Filter Pills */}
            <div className={`space-y-3 ${profiles.length > 0 ? "pt-3 border-t border-slate-200/80" : ""}`}>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Danh Sách Phác Đồ ({filteredTreatments.length})
                </span>
                <span className="text-[10px] font-bold text-[#1996e0] bg-[#1996e0]/10 px-2 py-0.5 rounded-md border border-[#1996e0]/20">
                  Chọn phác đồ
                </span>
              </div>

              {filterOptions.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {filterOptions.map((option) => {
                    const active = filter === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleFilterChange(option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          active
                            ? "bg-[#1996e0] text-white shadow-xs font-extrabold"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {filteredTreatments.length ? (
                filteredTreatments.map((treatment, index) => {
                  const selected = treatment.id === selectedTreatment?.id;
                  const stepCount = treatment.treatmentPlan.length;
                  const completedSteps = treatment.treatmentPlan.filter(
                    (s) => s.status === "completed",
                  ).length;

                  return (
                    <button
                      key={treatment.id}
                      type="button"
                      onClick={() => setSelectedId(treatment.id)}
                      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                        selected
                          ? "border-[#1996e0] bg-white shadow-lg shadow-[#1996e0]/10 ring-2 ring-[#1996e0]/30"
                          : "border-slate-200/90 bg-white hover:border-[#1996e0]/50 hover:shadow-md"
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {selected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1996e0]" />
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                selected
                                  ? "bg-[#1996e0] text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              Phác đồ #{index + 1}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {treatment.date}
                            </span>
                          </div>

                          <h3
                            className={`mt-2 text-sm font-bold truncate transition-colors ${
                              selected ? "text-[#1996e0]" : "text-slate-900 group-hover:text-[#1996e0]"
                            }`}
                          >
                            {treatment.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                            👨‍⚕️ {treatment.doctor}
                          </p>

                          {/* Progress mini indicator */}
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="font-medium text-slate-600">
                              Tiến trình: <strong className="text-slate-900">{completedSteps}/{stepCount} bước</strong>
                            </span>
                            <span className="rounded-full bg-blue-50 text-[#1996e0] border border-blue-100 px-2 py-0.5 text-[10px] font-bold">
                              {treatment.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
                  <DashboardIcon name="document" className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">
                    Không tìm thấy phác đồ phù hợp
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Vui lòng chọn danh mục lọc khác ở phía trên.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Record View */}
          <div className="p-4 sm:p-6 lg:p-7 bg-[#f4f9fd]/40">
            {selectedTreatment ? (
              <RecordTreatmentCard
                treatment={selectedTreatment}
                index={filteredTreatments.findIndex(
                  (item) => item.id === selectedTreatment.id,
                )}
                recordsData={recordsData}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-xs">
                <DashboardIcon name="document" className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">
                  Chưa chọn phác đồ điều trị
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy nhấp vào một phác đồ ở danh sách bên trái để mở toàn bộ thông tin bệnh án y khoa.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

