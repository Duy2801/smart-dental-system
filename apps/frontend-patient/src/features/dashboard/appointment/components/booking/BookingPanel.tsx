"use client";

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

function StepTitle({ number, children }: { number: number; children: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0863c5] text-[11px] font-bold text-white">
        {number}
      </span>
      <h2 className="text-sm font-bold text-slate-800">{children}</h2>
    </div>
  );
}

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
  const lockedSectionClass = canEditBookingDetails
    ? undefined
    : "pointer-events-none opacity-50";

  return (
    <div className="space-y-8">
      <section>
        <StepTitle number={1}>Chon nguoi kham</StepTitle>
        <PatientSelector
          patients={patients}
          selectedPatientId={selectedPatientId}
          isLoading={isLoadingPatients}
          isCreating={isCreatingPatient}
          onSelectPatient={onSelectPatient}
          onCreatePatient={onCreatePatient}
        />
      </section>

      <section className={lockedSectionClass}>
        <StepTitle number={2}>Chọn dịch vụ & phương pháp điều trị</StepTitle>
        <ServiceSelector
          services={services}
          selectedServiceId={selectedServiceId}
          selectedMethodId={selectedMethodId}
          onSelectService={onSelectService}
          onSelectMethod={onSelectMethod}
        />
      </section>

      <section className={lockedSectionClass}>
        <StepTitle number={3}>Chọn ngày và giờ khám</StepTitle>
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
      </section>

      <section className={lockedSectionClass}>
        <StepTitle number={4}>Chọn bác sĩ</StepTitle>
        <DoctorSelector
          doctors={doctors}
          selectedId={selectedDoctorId}
          onSelect={onSelectDoctor}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={!canReview}
          onClick={onOpenReview}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {isCheckingAvailability ? (
            <>
              <LoadingSpinner />
              Mở màn hình xác nhận...
            </>
          ) : (
            "Tiếp tục đến bước Xác nhận →"
          )}
        </button>
      </div>
    </div>
  );
}

