"use client";

import { useMemo, useState } from "react";
import {
  cleanRecordTitle,
  detectTreatmentCategory,
  formatShortDate,
  type TreatmentRecordView,
} from "./recordMappers";
import { RecordTreatmentCard } from "./RecordTreatmentCard";
import { RecordMedicalVisitCard } from "./RecordMedicalVisitCard";
import { RecordPatientHeader } from "./RecordPatientHeader";
import { DashboardIcon } from "../../common/DashboardIcon";
import type { PatientProfile } from "../../appointment/api";
import type {
  PatientRecordsResponse,
  TreatmentPlanRecord,
  TreatmentPlanStepRecord,
} from "../api";

type RecordHistorySectionProps = {
  treatments: TreatmentRecordView[];
  recordsData: PatientRecordsResponse | null;
  profiles?: PatientProfile[];
  selectedPatientId?: string;
  onSelectPatient?: (patientId: string) => void;
  profilesLoading?: boolean;
  summaryLoading?: boolean;
  plansLoading?: boolean;
  summaryError?: boolean;
  plansError?: boolean;
};

const relationshipLabels: Record<string, string> = {
  SELF: "Tôi",
  CHILD: "Con",
  FATHER: "Bố",
  MOTHER: "Mẹ",
  OTHER: "Người thân",
};

type UnifiedRecordItem =
  | {
      type: "plan";
      id: string;
      treatment: TreatmentRecordView;
      title: string;
      date: string;
      doctor: string;
      category: string;
      stepCount: number;
      completedSteps: number;
    }
  | {
      type: "visit";
      id: string;
      record: PatientRecordsResponse["medicalRecords"][number];
      title: string;
      date: string;
      doctor: string;
      category: string;
      stepCount: number;
      completedSteps: number;
    };

export function RecordHistorySection({
  treatments,
  recordsData,
  profiles = [],
  selectedPatientId,
  onSelectPatient,
  profilesLoading = false,
  summaryLoading = false,
  plansLoading = false,
  summaryError = false,
  plansError = false,
}: RecordHistorySectionProps) {
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const medicalRecords = recordsData?.medicalRecords ?? [];

  // Unified list of records: each dental service has 1 primary comprehensive record
  const recordsList: UnifiedRecordItem[] = useMemo(() => {
    const list: UnifiedRecordItem[] = [];

    // 1. Treatment Plans (Phác đồ điều trị dịch vụ)
    treatments.forEach((t) => {
      const stepCount = t.treatmentPlan.filter((s) => s.status !== "summary").length;
      const completedSteps = t.treatmentPlan.filter((s) => s.status === "completed").length;
      const displayTitle = cleanRecordTitle(t.title, t.category);
      const displayCategory = t.category || detectTreatmentCategory(t.title);

      list.push({
        type: "plan",
        id: `plan:${t.id}`,
        treatment: t,
        title: displayTitle,
        date: t.date,
        doctor: t.doctor,
        category: displayCategory,
        stepCount,
        completedSteps,
      });
    });

    // Track services and IDs already covered by treatment plans
    const coveredServices = new Set<string>();
    const coveredRecordIds = new Set<string>();

    treatments.forEach((t) => {
      if (t.category) coveredServices.add(t.category.toLowerCase().trim());
      t.treatmentPlan.forEach((step) => {
        if (step.medicalRecordId) coveredRecordIds.add(step.medicalRecordId);
      });
    });

    recordsData?.treatmentPlans?.forEach((p: TreatmentPlanRecord) => {
      p.steps?.forEach((s: TreatmentPlanStepRecord) => {
        s.medicalRecords?.forEach((mr) => coveredRecordIds.add(mr.id));
        s.appointments?.forEach((app) => {
          if (app.service) coveredServices.add(app.service.toLowerCase().trim());
        });
      });
      if (Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          if (item?.service) coveredServices.add(String(item.service).toLowerCase().trim());
        });
      }
    });

    // 2. Only add clinical visits for OTHER services that are NOT part of an existing treatment plan
    medicalRecords.forEach((r: PatientRecordsResponse["medicalRecords"][number]) => {
      if (coveredRecordIds.has(r.id)) return;
      if (r.treatmentPlanStepId) return;

      const rService = (r.service || "").toLowerCase().trim();
      if (rService && coveredServices.has(rService)) return;

      const displayTitle = cleanRecordTitle(r.diagnosis || r.service, r.service);
      const displayCategory = r.service || detectTreatmentCategory(r.diagnosis || "");

      list.push({
        type: "visit",
        id: `visit:${r.id}`,
        record: r,
        title: displayTitle,
        date: formatShortDate(r.createdAt),
        doctor: r.doctor || "Bác sĩ phụ trách",
        category: displayCategory,
        stepCount: 1,
        completedSteps: 1,
      });
    });

    return list;
  }, [treatments, medicalRecords, recordsData]);

  const activeRecord = useMemo(() => {
    if (selectedRecordId) {
      const found = recordsList.find((item) => item.id === selectedRecordId);
      if (found) return found;
    }
    return recordsList[0] ?? null;
  }, [recordsList, selectedRecordId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Left-Aligned Hero Section */}
      <section className="py-2 space-y-3 text-left">
        <div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#07366f]">
          Hồ Sơ Bệnh Án & Lịch Sử Điều Trị
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Chọn người khám trong gia đình và xem chi tiết hồ sơ bệnh án, đơn thuốc và tiến trình điều trị y khoa.
        </p>
      </section>

      {/* Main Consolidated Dashboard Panel */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-[#f4f9fd]/70 p-4 sm:p-5 lg:border-b-0 lg:border-r space-y-4">
            {/* Section 1: Family Profile Picker */}
            {profiles.length > 0 && (
              <div className="space-y-2.5">
                <label htmlFor="record-patient-profile" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DashboardIcon name="user" className="h-3.5 w-3.5 text-[#0058bc]" />
                  Hồ Sơ Người Khám ({profiles.length}):
                </label>

                <div className="relative">
                  <select
                    id="record-patient-profile"
                    value={selectedPatientId ?? (profiles.find((profile) => profile.isPrimary) ?? profiles[0]).id}
                    onChange={(event) => onSelectPatient?.(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200/90 bg-white pl-3.5 pr-10 py-2.5 text-sm font-semibold text-slate-800 shadow-xs outline-none transition hover:border-blue-300 focus:border-[#0058bc] focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.fullName} — {relationshipLabels[profile.relationship] ?? "Người thân"}{profile.isPrimary ? " (Hồ sơ chính)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {profilesLoading && <p className="text-xs text-slate-500">Đang tải danh sách người khám...</p>}

            {/* Section 2: Header Hồ Sơ Bệnh Án */}
            <div className={`space-y-2 ${profiles.length > 0 ? "pt-2 border-t border-slate-200/80" : ""}`}>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DashboardIcon name="document" className="h-3.5 w-3.5 text-[#0058bc]" />
                  Hồ Sơ Bệnh Án ({recordsList.length}):
                </span>
                <span className="text-[10px] font-bold text-[#0058bc] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  {recordsList.length > 1 ? `${recordsList.length} dịch vụ điều trị` : "1 dịch vụ điều trị"}
                </span>
              </div>
            </div>

            {/* Section 3: Danh Sách Hồ Sơ Bệnh Án */}
            <div className="space-y-3">
              {(plansLoading || profilesLoading || summaryLoading) && !recordsList.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 animate-pulse">
                  Đang tải hồ sơ bệnh án...
                </div>
              ) : (plansError && summaryError) ? (
                <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  Không tải được hồ sơ bệnh án. Vui lòng thử lại sau.
                </p>
              ) : recordsList.length ? (
                recordsList.map((item, index) => {
                  const isSelected = activeRecord?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedRecordId(item.id)}
                      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-[#1996e0] bg-white shadow-lg shadow-[#1996e0]/10 ring-2 ring-[#1996e0]/30"
                          : "border-slate-200/90 bg-white hover:border-[#1996e0]/50 hover:shadow-md"
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1996e0]" />
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isSelected
                                  ? "bg-[#1996e0] text-white"
                                  : "bg-blue-50 text-[#0863c5] border border-blue-200/60"
                              }`}
                            >
                              Hồ sơ #{index + 1}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.type === "plan"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  : "bg-sky-50 text-sky-700 border border-sky-100"
                              }`}
                            >
                              {item.type === "plan" ? "Phác đồ" : "Khám dịch vụ"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.date}
                            </span>
                          </div>

                          <h3
                            className={`mt-2 text-sm font-bold truncate transition-colors ${
                              isSelected
                                ? "text-[#1996e0]"
                                : "text-slate-900 group-hover:text-[#1996e0]"
                            }`}
                          >
                            {item.title}
                          </h3>

                          {/* Service Footer */}
                          <div className="mt-3 flex items-center justify-end text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="rounded-full bg-blue-50 text-[#1996e0] border border-blue-100 px-2 py-0.5 text-[10px] font-bold">
                              {item.category || "Nha khoa"}
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
                    Chưa có hồ sơ bệnh án
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bác sĩ chưa tạo hồ sơ bệnh án hoặc kế hoạch điều trị cho người khám này.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Record View */}
          <div className="space-y-5 p-4 sm:p-6 lg:p-7 bg-[#f4f9fd]/40">
            {(summaryLoading || profilesLoading || plansLoading) && !recordsData && (
              <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 animate-pulse">
                Đang tải hồ sơ bệnh nhân...
              </p>
            )}
            {summaryError && plansError && (
              <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                Không tải được thông tin bệnh án. Vui lòng thử lại sau.
              </p>
            )}
            {recordsData?.patient && (
              <RecordPatientHeader
                patient={recordsData.patient}
                doctor={activeRecord?.doctor}
                specialty={activeRecord?.type === "plan" ? activeRecord.treatment.specialty : undefined}
              />
            )}
            {activeRecord?.type === "visit" ? (
              <RecordMedicalVisitCard key={activeRecord.record.id} record={activeRecord.record} />
            ) : activeRecord?.type === "plan" && recordsData ? (
              <RecordTreatmentCard
                key={activeRecord.treatment.id}
                treatment={activeRecord.treatment}
                index={treatments.findIndex(
                  (item) => item.id === activeRecord.treatment.id,
                )}
                recordsData={recordsData}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-xs">
                <DashboardIcon name="document" className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">
                  Chưa chọn hồ sơ bệnh án
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {plansLoading ? "Hồ sơ sẽ xuất hiện khi tải xong." : "Bác sĩ chưa lập hồ sơ bệnh án cho người khám này."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
