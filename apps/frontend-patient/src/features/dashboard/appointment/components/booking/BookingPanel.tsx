"use client";

import { useMemo, useState } from "react";
import type {
  AppointmentService,
  BookingDate,
  Dentist,
} from "../../types";
import type {
  CreatePatientProfilePayload,
  PatientProfile,
} from "../../api";
import { DoctorSelector } from "./DoctorSelector";
import { PatientSelector } from "./PatientSelector";
import { SchedulePicker } from "./SchedulePicker";
import { ServiceSelector } from "./ServiceSelector";

export type BookingPanelProps = {
  patients: PatientProfile[];
  services: AppointmentService[];
  doctors: Dentist[];
  dates: BookingDate[];
  times: string[];
  blockedTimes?: string[];
  blockedRanges?: string[];
  slotIntervalMinutes: number;
  selectedServiceId: string;
  selectedPatientId: string;
  selectedMethodId: string;
  selectedDoctorId: string;
  selectedDateId: string;
  selectedTime: string;
  canReview: boolean;
  canEditBookingDetails: boolean;
  isCheckingAvailability?: boolean;
  isLoadingPatients?: boolean;
  isCreatingPatient?: boolean;
  onSelectPatient: (id: string) => void;
  onCreatePatient: (payload: CreatePatientProfilePayload) => Promise<void>;
  onSelectService: (id: string) => void;
  onSelectMethod: (id: string) => void;
  onSelectDoctor: (id: string) => void;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
  onOpenReview: () => void;
  onCancelBooking: () => void;
};

function LoadingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
    />
  );
}

export function BookingPanel({
  patients,
  services,
  doctors,
  dates,
  times,
  blockedTimes = [],
  blockedRanges = [],
  slotIntervalMinutes,
  selectedServiceId,
  selectedPatientId,
  selectedMethodId,
  selectedDoctorId,
  selectedDateId,
  selectedTime,
  canReview,
  canEditBookingDetails,
  isCheckingAvailability,
  isLoadingPatients,
  isCreatingPatient,
  onSelectPatient,
  onCreatePatient,
  onSelectService,
  onSelectMethod,
  onSelectDoctor,
  onSelectDate,
  onSelectTime,
  onOpenReview,
  onCancelBooking,
}: BookingPanelProps) {
  // Active step state (1: Patient, 2: Service, 3: Schedule, 4: Doctor)
  const [activeStep, setActiveStep] = useState<number>(() => {
    if (!selectedPatientId) return 1;
    if (!selectedServiceId || !selectedMethodId) return 2;
    if (!selectedDateId || !selectedTime) return 3;
    return 4;
  });

  // Validation checks for each step
  const isStep1Complete = Boolean(selectedPatientId);
  const isStep2Complete = Boolean(selectedServiceId) && Boolean(selectedMethodId);
  const isStep3Complete = Boolean(selectedDateId) && Boolean(selectedTime);
  const isStep4Complete = Boolean(selectedDoctorId);

  const completedSteps = [
    isStep1Complete,
    isStep2Complete,
    isStep3Complete,
    isStep4Complete,
  ];

  // Quick info objects for summary header
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );
  const selectedMethod = useMemo(
    () => selectedService?.treatmentMethods.find((m) => m.id === selectedMethodId),
    [selectedService, selectedMethodId]
  );
  const selectedDate = useMemo(
    () => dates.find((d) => d.id === selectedDateId),
    [dates, selectedDateId]
  );
  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const handleStepClick = (stepNum: number) => {
    if (
      stepNum === 1 ||
      (stepNum === 2 && isStep1Complete) ||
      (stepNum === 3 && isStep1Complete && isStep2Complete) ||
      (stepNum === 4 && isStep1Complete && isStep2Complete && isStep3Complete)
    ) {
      setActiveStep(stepNum);
    }
  };

  const stepsConfig = [
    { number: 1, label: "CHỌN NGƯỜI KHÁM" },
    { number: 2, label: "CHỌN DỊCH VỤ" },
    { number: 3, label: "CHỌN LỊCH KHÁM" },
    { number: 4, label: "CHỌN BÁC SĨ" },
  ];

  return (
    <div className="space-y-6">
      {/* STEPPER BAR (Inspired by Image 1) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between">
          {stepsConfig.map((step, idx) => {
            const stepNum = step.number;
            const isActive = activeStep === stepNum;
            const isCompleted = completedSteps[stepNum - 1];
            const isClickable =
              stepNum === 1 ||
              (stepNum === 2 && isStep1Complete) ||
              (stepNum === 3 && isStep1Complete && isStep2Complete) ||
              (stepNum === 4 && isStep1Complete && isStep2Complete && isStep3Complete);

            return (
              <div key={step.number} className="flex flex-1 items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleStepClick(stepNum)}
                  className={`group flex flex-col items-center sm:flex-row sm:gap-3 transition text-left ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                    }`}
                >
                  {/* Step Pill / Badge */}
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs sm:text-sm transition-all ${isActive
                        ? "bg-[#0863c5] text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-100 scale-105"
                        : isCompleted
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-100 border border-slate-200 text-slate-400"
                      }`}
                  >
                    {isCompleted && !isActive ? (
                      <svg className="h-5 w-5 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      `0${step.number}`
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-1 text-center sm:mt-0 sm:text-left">
                    <span
                      className={`block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider transition ${isActive
                          ? "text-[#0863c5]"
                          : isCompleted
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                    >
                      {step.label}
                    </span>
                    <span className="hidden text-[10px] text-slate-400 sm:block font-medium">
                      {isCompleted && !isActive ? "Đã hoàn thành" : `Bước ${step.number}`}
                    </span>
                  </div>
                </button>

                {/* Connecting Line */}
                {idx < stepsConfig.length - 1 && (
                  <div className="mx-2 sm:mx-3 h-[2px] flex-1 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${completedSteps[idx] ? "bg-emerald-500" : "bg-transparent"
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED CHOICES SUMMARY CHIPS */}
      {(selectedPatient || selectedService || selectedDate || selectedDoctor) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs">
          <span className="font-bold text-[#0863c5]">Thông tin đã chọn:</span>
          {selectedPatient && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs border border-slate-200">
              👤 {selectedPatient.fullName}
            </span>
          )}
          {selectedService && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs border border-slate-200">
              🩺 {selectedService.name} {selectedMethod ? `(${selectedMethod.name})` : ""}
            </span>
          )}
          {selectedDate && selectedTime && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs border border-slate-200">
              📅 {selectedDate.weekday}, {selectedDate.day}/{selectedDate.month} lúc {selectedTime}
            </span>
          )}
          {selectedDoctor && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs border border-slate-200">
              👨‍⚕️ {selectedDoctor.name}
            </span>
          )}
        </div>
      )}

      {/* ACTIVE STEP CONTENT PANEL */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        {/* STEP 1: CHỌN NGƯỜI KHÁM */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                1. Chọn người khám
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Lịch hẹn sẽ được gắn trực tiếp với hồ sơ người đi khám.
              </p>
            </div>
            <PatientSelector
              patients={patients}
              selectedPatientId={selectedPatientId}
              isLoading={isLoadingPatients}
              isCreating={isCreatingPatient}
              onSelectPatient={onSelectPatient}
              onCreatePatient={onCreatePatient}
            />
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={!isStep1Complete}
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-sm"
              >
                Tiếp tục: Chọn dịch vụ
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHỌN DỊCH VỤ & ĐIỀU TRỊ */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                2. Chọn dịch vụ & phương pháp điều trị
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Vui lòng chọn loại dịch vụ và gói điều trị mong muốn.
              </p>
            </div>
            <ServiceSelector
              services={services}
              selectedServiceId={selectedServiceId}
              selectedMethodId={selectedMethodId}
              onSelectService={onSelectService}
              onSelectMethod={onSelectMethod}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                Quay lại người khám
              </button>
              <button
                type="button"
                disabled={!isStep2Complete}
                onClick={() => setActiveStep(3)}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-sm"
              >
                Tiếp tục: Chọn ngày & giờ
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHỌN NGÀY VÀ GIỜ KHÁM */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                3. Chọn ngày và giờ khám
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Chọn ngày khám và thời gian phù hợp còn suất trống.
              </p>
            </div>
            <SchedulePicker
              dates={dates}
              times={times}
              blockedTimes={blockedTimes}
              blockedRanges={blockedRanges}
              slotIntervalMinutes={slotIntervalMinutes}
              selectedDateId={selectedDateId}
              selectedTime={selectedTime}
              onSelectDate={onSelectDate}
              onSelectTime={onSelectTime}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                Quay lại dịch vụ
              </button>
              <button
                type="button"
                disabled={!isStep3Complete}
                onClick={() => setActiveStep(4)}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-sm"
              >
                Tiếp tục: Chọn bác sĩ
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CHỌN BÁC SĨ */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                4. Chọn bác sĩ phụ trách
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Chọn Bác sĩ chuyên khoa phụ trách khám và tư vấn trực tiếp.
              </p>
            </div>
            <DoctorSelector
              doctors={doctors}
              selectedId={selectedDoctorId}
              onSelect={onSelectDoctor}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                Quay lại chọn lịch
              </button>
              <button
                type="button"
                disabled={!canReview}
                onClick={onOpenReview}
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-md"
              >
                {isCheckingAvailability ? (
                  <>
                    <LoadingSpinner />
                    Mở màn hình xác nhận...
                  </>
                ) : (
                  "Tiếp tục đến bước xác nhận"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
