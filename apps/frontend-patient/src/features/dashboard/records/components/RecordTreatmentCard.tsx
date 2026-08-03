"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import { DashboardIcon } from "../../common/DashboardIcon";
import {
  confirmPatientAppointment,
  restorePatientAppointment,
} from "../../appointment/api";
import { RecordClinicalImage } from "./RecordClinicalImage";
import { formatMoney, type TreatmentRecordView } from "./recordMappers";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";

type RecordTreatmentCardProps = {
  treatment: TreatmentRecordView;
  index: number;
};

type StepStatus = "completed" | "current" | "upcoming" | "summary";

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className={`${T.fieldLabel}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function ContentBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className={`${T.fieldLabel}`}>
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function labelForStep(status: StepStatus, isPreviousStep: boolean) {
  if (isPreviousStep) return "Bước trước";
  if (status === "summary") return "Tổng kết";
  if (status === "completed") return "Đã hoàn thành";
  if (status === "current") return "Đang thực hiện";
  return "Sắp tới";
}

export function RecordTreatmentCard({
  treatment,
  index,
}: RecordTreatmentCardProps) {
  const summaryReady = treatment.treatmentPlan
    .filter((step) => step.status !== "summary")
    .every((step) => step.status === "completed");
  const visibleSteps = summaryReady
    ? treatment.treatmentPlan
    : treatment.treatmentPlan.filter((step) => step.status !== "summary");
  const currentStepIndex = visibleSteps.findIndex((step) => step.status === "current");
  const previousStepIndex = currentStepIndex > 0 ? currentStepIndex - 1 : -1;

  const initialStepId =
    visibleSteps.find((step) => step.status === "current")?.id ??
    visibleSteps.find((step) => step.status === "upcoming")?.id ??
    visibleSteps.find((step) => step.status === "completed")?.id ??
    visibleSteps[0]?.id ??
    "";
  const [selectedStepId, setSelectedStepId] = useState(initialStepId);
  const selectedStep = useMemo(
    () => visibleSteps.find((step) => step.id === selectedStepId) ?? visibleSteps[0],
    [selectedStepId, visibleSteps],
  );

  const isSummary = selectedStep?.status === "summary";
  const appointment = selectedStep?.appointment ?? treatment.followUp;
  const appointmentId = selectedStep?.appointment?.id ?? null;
  const appointmentCompleted =
    selectedStep?.appointment?.completed || selectedStep?.status === "completed";
  const appointmentStatus = selectedStep?.appointment?.status;
  const needsAppointmentConfirmation = appointmentStatus === "pending";
  const needsAppointmentNextStep = appointmentStatus === "cancelled";
  const recordHref = selectedStep?.medicalRecordId
    ? `${ROUTES.records}?recordId=${selectedStep.medicalRecordId}`
    : null;
  const pdfHref = `${ROUTES.records}?planId=${treatment.id}&export=pdf`;
  const appointmentHref = appointment
    ? `${ROUTES.appointment}?planId=${encodeURIComponent(treatment.id)}&stepId=${encodeURIComponent(selectedStep?.id ?? "")}`
    : ROUTES.appointment;
  const appointmentCtaHref = appointmentHref;
  const appointmentCtaLabel = needsAppointmentNextStep
    ? "Xác nhận lịch hẹn tiếp theo"
    : "Xác nhận lịch hẹn";
  const appointmentCtaDescription = needsAppointmentNextStep
    ? "Lịch hẹn trước đó đã bị hủy. Hệ thống đã tạo lịch hẹn tiếp theo cùng bác sĩ và dịch vụ để bạn xác nhận."
    : "Đây là lịch hẹn đã được hệ thống tạo sẵn. Bạn chỉ cần xác nhận để chuyển sang bước tiếp theo.";
  const queryClient = useQueryClient();
  const confirmMutation = useMutation({
    mutationFn: confirmPatientAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient", "records"] }),
        queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] }),
      ]);
      toast.success(
        "Đã xác nhận lịch hẹn",
        "Lễ tân sẽ tiếp tục kiểm tra và xác nhận bước tiếp theo.",
      );
    },
    onError: () => {
      toast.error(
        "Không thể xác nhận lịch hẹn",
        "Vui lòng thử lại hoặc kiểm tra xem lịch có còn ở trạng thái chờ xác nhận không.",
      );
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restorePatientAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient", "records"] }),
        queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] }),
      ]);
      toast.success(
        "Lịch hẹn tiếp theo đã được khôi phục",
        "Lịch sẽ xuất hiện ngay trong danh sách sắp tới.",
      );
    },
    onError: () => {
      toast.error(
        "Không thể khôi phục lịch hẹn",
        "Vui lòng thử lại hoặc kiểm tra xem lịch còn ở trạng thái đã hủy không.",
      );
    },
  });

  return (
    <article className="overflow-hidden border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${T.overline} text-[#0058bc]`}>
                Quy trình {index + 1}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-500">
                {treatment.category}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-500">
                {treatment.date}
              </span>
            </div>
            <h3 className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-950">
              {treatment.title}
            </h3>
            <p className={`mt-2 max-w-3xl ${T.body}`}>
              {isSummary ? treatment.description : selectedStep?.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {recordHref ? (
              <Link
                href={recordHref}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-[#0058bc] hover:text-[#0058bc]"
              >
                <DashboardIcon name="document" className="h-4 w-4" />
                Bệnh án
              </Link>
            ) : null}
            <Link
              href={pdfHref}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-[#0058bc] hover:text-[#0058bc]"
            >
              <DashboardIcon name="document" className="h-4 w-4" />
              Tải PDF
            </Link>
          </div>
        </div>

        {appointment && (needsAppointmentConfirmation || needsAppointmentNextStep) ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                  {needsAppointmentNextStep
                    ? "Lịch hẹn tiếp theo đã được tạo"
                    : "Lịch hẹn cần xác nhận"}
                </p>
                <h4 className="mt-1 text-lg font-extrabold text-slate-950">
                  {appointment?.dateLabel} - {appointment?.time}
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {appointment?.description}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Bác sĩ phụ trách: {appointment?.doctor ?? treatment.doctor}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {appointmentCtaDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {needsAppointmentConfirmation ? (
                  <button
                    type="button"
                    onClick={() => appointmentId && confirmMutation.mutate(appointmentId)}
                    disabled={confirmMutation.isPending || !appointmentId}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-4 text-sm font-bold text-white transition hover:bg-[#054a9f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <DashboardIcon name="checkup" className="h-4 w-4" />
                    {confirmMutation.isPending
                      ? "Đang xác nhận..."
                      : appointmentCtaLabel}
                  </button>
                ) : needsAppointmentNextStep ? (
                  <button
                    type="button"
                    onClick={() => appointmentId && restoreMutation.mutate(appointmentId)}
                    disabled={restoreMutation.isPending || !appointmentId}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-4 text-sm font-bold text-white transition hover:bg-[#054a9f]"
                  >
                    <DashboardIcon name="checkup" className="h-4 w-4" />
                    {restoreMutation.isPending
                      ? "Đang khôi phục..."
                      : appointmentCtaLabel}
                  </button>
                ) : (
                  <Link
                    href={appointmentCtaHref}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-4 text-sm font-bold text-white transition hover:bg-[#054a9f]"
                  >
                    <DashboardIcon name="checkup" className="h-4 w-4" />
                    {appointmentCtaLabel}
                  </Link>
                )}
                <Link
                  href={`${appointmentHref}&action=reschedule`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                >
                  <DashboardIcon name="calendar" className="h-4 w-4" />
                  Đổi lịch
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {visibleSteps.map((step, stepIndex) => {
            const selected = step.id === selectedStepId;
            const complete = step.status === "completed";
            const current = step.status === "current";
            const upcoming = step.status === "upcoming";
            const isPreviousStep = stepIndex === previousStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepId(step.id)}
                className={`flex min-w-[220px] items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${selected
                  ? "border-[#0058bc] bg-blue-50"
                  : isPreviousStep
                    ? "border-emerald-300 bg-emerald-50"
                    : upcoming
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-[10px] font-bold ${selected
                    ? "border-[#0058bc] bg-[#0058bc] text-white"
                    : complete
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : current
                        ? "border-blue-500 bg-blue-500 text-white"
                        : upcoming
                          ? "border-amber-400 bg-amber-400 text-white"
                          : "border-slate-200 bg-white text-slate-400"
                    }`}
                >
                  {step.status === "summary" ? "T" : stepIndex + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {step.date}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-950">
                    {step.title}
                  </h4>
                  <p
                    className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${isPreviousStep
                      ? "bg-emerald-100 text-emerald-700"
                      : upcoming
                        ? "bg-amber-100 text-amber-800"
                        : current || selected
                          ? "bg-blue-100 text-[#0058bc]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {labelForStep(step.status, isPreviousStep)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Bác sĩ" value={treatment.doctor} />
            <StatPill label="Chuyên khoa" value={treatment.specialty} />
            <StatPill label="Răng điều trị" value={treatment.tooth} />
            <StatPill
              label="Chi phí"
              value={formatMoney(selectedStep?.paidAmount ?? treatment.paidAmount)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <ContentBlock label="Tóm tắt phác đồ">
              <p className="text-sm leading-6 text-slate-600">
                {selectedStep?.description ?? treatment.description}
              </p>
            </ContentBlock>

            <ContentBlock label="Trạng thái hiện tại">
              <div className="space-y-3">
                <StatPill
                  label="Lịch hẹn"
                  value={
                    appointment
                      ? `${appointment.dateLabel} - ${appointment.time}`
                      : "Không có"
                  }
                />
                <StatPill
                  label="Bác sĩ phụ trách"
                  value={appointment?.doctor ?? treatment.doctor}
                />
                <StatPill
                  label="Tình trạng"
                  value={
                    isSummary || appointmentCompleted
                      ? "Đã cập nhật"
                      : appointmentStatus === "confirmed"
                        ? "Đã xác nhận lịch hẹn"
                        : appointmentStatus === "cancelled"
                          ? "Đã hủy"
                          : needsAppointmentConfirmation
                            ? "Cần xác nhận lịch"
                            : "Đang theo dõi"
                  }
                />
              </div>
            </ContentBlock>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ContentBlock label="Đơn thuốc">
              <ul className="space-y-2">
                {(selectedStep?.prescriptions ?? treatment.prescriptions).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ContentBlock>

            <ContentBlock label="Hướng dẫn tại nhà">
              <ul className="space-y-2">
                {(selectedStep?.careInstructions ?? treatment.careInstructions).map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                      <span className="mt-0.5 text-[#0058bc]" aria-hidden="true">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ),
                )}
              </ul>
            </ContentBlock>
          </div>
        </div>

        <div className="space-y-4">
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

          {appointment && !isSummary ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Nội dung buổi hẹn
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {appointment.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
