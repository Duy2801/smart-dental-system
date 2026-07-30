"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import { RecordClinicalImage } from "./RecordClinicalImage";
import { RecordTreatmentTimeline } from "./RecordTreatmentTimeline";
import { formatMoney, getInitials, type TreatmentRecordView } from "./recordMappers";

type RecordTreatmentCardProps = {
  treatment: TreatmentRecordView;
  index: number;
};

export function RecordTreatmentCard({
  treatment,
  index,
}: RecordTreatmentCardProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const initialStepId =
    treatment.treatmentPlan.find((step) => step.status === "current")?.id ??
    treatment.treatmentPlan.find((step) => step.status === "completed")?.id ??
    treatment.treatmentPlan[0]?.id ??
    "summary";
  const [selectedStepId, setSelectedStepId] = useState(initialStepId);
  const selectedStep = useMemo(
    () =>
      treatment.treatmentPlan.find((step) => step.id === selectedStepId) ??
      treatment.treatmentPlan[0],
    [selectedStepId, treatment.treatmentPlan],
  );
  const isSummary = selectedStep?.status === "summary";
  const appointment = selectedStep?.appointment ?? treatment.followUp;
  const appointmentCompleted =
    selectedStep?.appointment?.completed || selectedStep?.status === "completed";
  const recordHref = selectedStep?.medicalRecordId
    ? `/records?recordId=${selectedStep.medicalRecordId}`
    : null;
  const planId = treatment.id;
  const pdfHref = `/records?planId=${planId}&export=pdf`;
  const appointmentsHref = `/records?planId=${planId}&view=appointments`;
  const invoicesHref = `/records?planId=${planId}&view=invoices`;
  const [trackProgress, setTrackProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const node = articleRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      const start = viewport * 0.85;
      const end = -rect.height * 0.25;
      const raw = (start - rect.top) / (start - end);
      setTrackProgress(Math.max(0, Math.min(1, raw)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <article
      ref={articleRef}
      className="relative border-l-2 border-slate-200 pb-6 pl-6 last:border-transparent"
    >
      <span className="absolute left-[-1px] top-0 h-full w-[2px] rounded-full bg-slate-100" />
      <span
        className="absolute left-[-1px] top-0 w-[2px] rounded-full bg-gradient-to-b from-[#0058bc] via-cyan-400 to-emerald-400 transition-[height] duration-150"
        style={{ height: `${Math.max(18, Math.round(trackProgress * 100))}%` }}
      />
      <span
        className={`absolute -left-[8px] top-0 h-3.5 w-3.5 rounded-full border-[3px] border-[#f6f8fc] transition-all duration-300 ${treatment.active
          ? "bg-[#0058bc] shadow-[0_0_0_3px_rgba(0,88,188,.12)] animate-pulse"
          : "bg-slate-300"
          }`}
        style={{ top: `calc(${Math.max(10, Math.round(trackProgress * 100))}% - 7px)` }}
      />

      <div
        className={`overflow-hidden rounded-2xl border bg-white shadow-[0_10px_32px_rgba(15,23,42,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(15,23,42,.09)] ${treatment.active ? "border-blue-100" : "border-slate-200"}`}
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#f8fbff] to-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc] transition-colors duration-300">
                Quy trình điều trị
              </p>
              <h3
                className={`mt-1 text-[17px] font-bold leading-6 transition-colors duration-300 ${treatment.active ? "text-[#0058bc]" : "text-slate-900"}`}
              >
                {treatment.title}
              </h3>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <DashboardIcon name="calendar" className="h-3.5 w-3.5" />
                {treatment.date}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {recordHref ? (
                <Link
                  href={recordHref}
                  className="inline-flex items-center justify-center rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-[#0058bc] shadow-sm hover:bg-blue-50"
                >
                  Xem hồ sơ bệnh án
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400">
                  Chưa có bệnh án
                </span>
              )}
              <div className="w-fit rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">
                  Răng điều trị
                </p>
                <p className="mt-1 text-sm font-bold text-[#0058bc]">
                  {treatment.tooth}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {recordHref ? (
              <Link
                href={recordHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#0058bc] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0050aa]"
              >
                <DashboardIcon name="document" className="h-4 w-4" />
                Xem hồ sơ bệnh án
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400">
                <DashboardIcon name="document" className="h-4 w-4" />
                Chưa có hồ sơ bệnh án
              </span>
            )}
            <Link
              href={pdfHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0058bc]"
            >
              <DashboardIcon name="document" className="h-4 w-4" />
              Tải hồ sơ PDF
            </Link>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.9fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                  Quy trình lâm sàng
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isSummary ? treatment.description : selectedStep?.description}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-[#0058bc]">
                  {getInitials(treatment.doctor)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{treatment.doctor}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {treatment.specialty}
                  </p>
                  <Link
                    href={index === 0 ? "/doctor/le-hoang-nam" : "/doctor"}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0058bc] hover:underline"
                  >
                    Liên hệ bác sĩ <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RecordClinicalImage
                type="xray"
                title="X-quang"
                imageUrl={selectedStep?.images.xray}
              />
              <RecordClinicalImage
                type="clinical"
                title="Lâm sàng"
                imageUrl={selectedStep?.images.clinical}
              />
            </div>
          </div>

          <RecordTreatmentTimeline
            steps={treatment.treatmentPlan}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
          />

          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                Đơn thuốc & dặn dò
              </p>
              <div className="mt-3 space-y-2 rounded-2xl bg-slate-50/80 p-4">
                {(selectedStep?.prescriptions ?? treatment.prescriptions).map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm leading-6 text-slate-700"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0058bc] hover:underline">
                <span aria-hidden="true">↓</span>
                Tải đơn thuốc PDF
              </button>
              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-700">
                  Hướng dẫn chăm sóc tại nhà
                </p>
                <div className="mt-3 space-y-2">
                  {(selectedStep?.careInstructions ?? treatment.careInstructions).map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-sm leading-6 text-slate-700"
                      >
                        <span className="mt-0.5 text-cyan-700" aria-hidden="true">
                          ✓
                        </span>
                        <span>{item}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                    {isSummary ? "Tổng tiền đã trả" : "Chi phí buổi khám"}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatMoney(selectedStep?.paidAmount ?? treatment.paidAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {selectedStep?.paymentStatusLabel ?? treatment.paymentStatusLabel}
                  </span>
                  {(selectedStep?.paidAmount ?? 0) > 0 && (
                    <span className="mt-2 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white">
                      Đã thanh toán
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc]">
                  {isSummary
                    ? "Tổng quan quy trình"
                    : appointment
                      ? "Lịch hẹn"
                      : "Trạng thái điều trị"}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {isSummary
                    ? `${treatment.treatmentPlan.length - 1} bước điều trị`
                    : appointment
                      ? `${appointment.dateLabel} - ${appointment.time}`
                      : `Đã hoàn thành - ${selectedStep?.date ?? treatment.date}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {appointment?.doctor ?? treatment.doctor}
                </p>
                {appointment && !isSummary && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                      Nội dung buổi hẹn
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">
                      {appointment.description}
                    </p>
                  </div>
                )}
                {isSummary || appointmentCompleted ? (
                  <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    {isSummary ? "Đã xem tổng quan" : "Lịch hẹn đã hoàn thành"}
                  </span>
                ) : appointment ? (
                  <Link
                    href="/appointment"
                    className="mt-3 inline-flex rounded-full bg-[#0058bc] px-4 py-2 text-xs font-bold text-white"
                  >
                    Xác nhận lịch
                  </Link>
                ) : (
                  <span className="mt-3 inline-flex rounded-full bg-[#0058bc]/10 px-3 py-1.5 text-xs font-bold text-[#0058bc]">
                    Hoàn thành
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
