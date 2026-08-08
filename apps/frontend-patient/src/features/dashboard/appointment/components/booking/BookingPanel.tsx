"use client";

import type {
  AppointmentService,
  BookingDate,
  Dentist,
} from "../../types";
import { DoctorSelector } from "./DoctorSelector";
import { SchedulePicker } from "./SchedulePicker";
import { ServiceSelector } from "./ServiceSelector";

export type BookingPanelProps = {
  services: AppointmentService[];
  doctors: Dentist[];
  dates: BookingDate[];
  times: string[];
  blockedTimes?: string[];
  blockedRanges?: string[];
  slotIntervalMinutes: number;
  selectedServiceId: string;
  selectedMethodId: string;
  selectedDoctorId: string;
  selectedDateId: string;
  selectedTime: string;
  canReview: boolean;
  isCheckingAvailability?: boolean;
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
  services,
  doctors,
  dates,
  times,
  blockedTimes = [],
  blockedRanges = [],
  slotIntervalMinutes,
  selectedServiceId,
  selectedMethodId,
  selectedDoctorId,
  selectedDateId,
  selectedTime,
  canReview,
  isCheckingAvailability,
  onSelectService,
  onSelectMethod,
  onSelectDoctor,
  onSelectDate,
  onSelectTime,
  onOpenReview,
  onCancelBooking,
}: BookingPanelProps) {
  return (
    <div className="space-y-8">
      <section>
        <StepTitle number={1}>Chọn dịch vụ & phương pháp điều trị</StepTitle>
        <ServiceSelector
          services={services}
          selectedServiceId={selectedServiceId}
          selectedMethodId={selectedMethodId}
          onSelectService={onSelectService}
          onSelectMethod={onSelectMethod}
        />
      </section>

      <section>
        <StepTitle number={2}>Chọn ngày và giờ khám</StepTitle>
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

      <section>
        <StepTitle number={3}>Chọn bác sĩ</StepTitle>
        <DoctorSelector
          doctors={doctors}
          selectedId={selectedDoctorId}
          onSelect={onSelectDoctor}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancelBooking}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
        >
          Hủy đặt lịch
        </button>

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
