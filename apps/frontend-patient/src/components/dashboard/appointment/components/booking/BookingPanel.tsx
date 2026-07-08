"use client";

import type { FormEventHandler } from "react";
import type { AppointmentService, BookingDate, Dentist } from "../../types";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { ServiceSelector } from "./ServiceSelector";
import { DoctorSelector } from "./DoctorSelector";
import { SchedulePicker } from "./SchedulePicker";

type BookingPanelProps = {
  services: AppointmentService[];
  doctors: Dentist[];
  dates: BookingDate[];
  times: string[];
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDateId: string;
  selectedTime: string;
  successMessage: string | null;
  onSelectService: (id: string) => void;
  onSelectDoctor: (id: string) => void;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
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

export function BookingPanel(props: BookingPanelProps) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-8">
      <section>
        <StepTitle number={1}>Chọn dịch vụ</StepTitle>
        <ServiceSelector
          services={props.services}
          selectedId={props.selectedServiceId}
          onSelect={props.onSelectService}
        />
      </section>

      <section>
        <StepTitle number={2}>Chọn ngày và giờ khám</StepTitle>
        <SchedulePicker
          dates={props.dates}
          times={props.times}
          selectedDateId={props.selectedDateId}
          selectedTime={props.selectedTime}
          onSelectDate={props.onSelectDate}
          onSelectTime={props.onSelectTime}
        />
      </section>

      <section>
        <StepTitle number={3}>Chọn bác sĩ</StepTitle>
        <DoctorSelector
          doctors={props.doctors}
          selectedId={props.selectedDoctorId}
          onSelect={props.onSelectDoctor}
        />
      </section>

      {props.successMessage && (
        <p role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {props.successMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0758b7] px-7 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#064b9c] sm:w-auto"
        >
          <DashboardIcon name="appointment" className="h-4 w-4" />
          Xác nhận đặt lịch
          <DashboardIcon name="arrow" className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
