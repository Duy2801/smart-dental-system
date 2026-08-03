"use client";

import { useEffect, useState } from "react";
import type {
  AppointmentPaymentOption,
  AppointmentService,
  BookingDate,
  Dentist,
} from "../../types";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { DoctorSelector } from "./DoctorSelector";
import { SchedulePicker } from "./SchedulePicker";
import { ServiceSelector } from "./ServiceSelector";

type BookingPanelProps = {
  services: AppointmentService[];
  doctors: Dentist[];
  dates: BookingDate[];
  times: string[];
  blockedTimes?: string[];
  blockedRanges?: string[];
  slotIntervalMinutes: number;
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDateId: string;
  selectedTime: string;
  selectedService?: AppointmentService;
  selectedDoctor?: Dentist;
  selectedDate?: BookingDate;
  selectedPaymentOption: AppointmentPaymentOption;
  successMessage: string | null;
  isSubmitting?: boolean;
  isCheckingAvailability?: boolean;
  onSelectService: (id: string) => void;
  onSelectDoctor: (id: string) => void;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
  onSelectPaymentOption: (value: AppointmentPaymentOption) => void;
  onOpenReview: () => void;
  onConfirmBooking: () => void;
  onCloseSuccess: () => void;
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

export function BookingPanel(props: BookingPanelProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAccepted, setReviewAccepted] = useState(false);
  const disabled =
    props.services.length === 0 ||
    props.doctors.length === 0 ||
    props.times.length === 0 ||
    Boolean(props.isSubmitting) ||
    Boolean(props.isCheckingAvailability);
  const canReview =
    Boolean(props.selectedService) &&
    Boolean(props.selectedDoctor) &&
    Boolean(props.selectedDate) &&
    Boolean(props.selectedTime) &&
    !disabled;

  useEffect(() => {
    if (!reviewOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [reviewOpen]);

  return (
    <>
      <div className="space-y-8">
        <section>
          <StepTitle number={1}>Chon dich vu</StepTitle>
          <ServiceSelector
            services={props.services}
            selectedId={props.selectedServiceId}
            onSelect={props.onSelectService}
          />
        </section>

        <section>
          <StepTitle number={2}>Chon ngay va gio kham</StepTitle>
          <SchedulePicker
            dates={props.dates}
            times={props.times}
            blockedTimes={props.blockedTimes}
            blockedRanges={props.blockedRanges}
            slotIntervalMinutes={props.slotIntervalMinutes}
            selectedDateId={props.selectedDateId}
            selectedTime={props.selectedTime}
            onSelectDate={props.onSelectDate}
            onSelectTime={props.onSelectTime}
          />
        </section>

        <section>
          <StepTitle number={3}>Chon bac si</StepTitle>
          <DoctorSelector
            doctors={props.doctors}
            selectedId={props.selectedDoctorId}
            onSelect={props.onSelectDoctor}
          />
        </section>

        <section>
          <StepTitle number={4}>Chon cach giu lich</StepTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <PaymentOptionCard
              title="Coc truoc"
              description="Giu lich ngay. He thong se tao hoa don coc theo cau hinh phong kham."
              selected={props.selectedPaymentOption === "DEPOSIT_30_PERCENT"}
              onClick={() => props.onSelectPaymentOption("DEPOSIT_30_PERCENT")}
            />
            <PaymentOptionCard
              title="Thanh toan tai quay"
              description="Gui yeu cau dat lich truoc, thanh toan khi ban den kham."
              selected={props.selectedPaymentOption === "PAY_AT_COUNTER"}
              onClick={() => props.onSelectPaymentOption("PAY_AT_COUNTER")}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-sm font-bold text-[#0a5fbe]">
              Phi coc duoc tinh theo cau hinh phong kham
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Neu chon coc truoc, he thong se tao hoa don loai <strong>DEPOSIT</strong>.
              Neu chon thanh toan tai quay, lich van duoc gui va ban thanh toan luc den kham.
            </p>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={props.onCancelBooking}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            Hủy đặt lịch
          </button>

          <button
            type="button"
            disabled={!canReview}
            onClick={() => {
              props.onOpenReview();
              setReviewAccepted(false);
              setReviewOpen(true);
            }}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {props.isCheckingAvailability ? (
              <>
                <LoadingSpinner />
                Mở màn hình xác nhận...
              </>
            ) : (
              "Xem lại & Xác nhận"
            )}
          </button>
        </div>
      </div>

      {reviewOpen ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-2xl transition-all"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0863c5]">
                  Xac nhan dat lich
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">
                  Xem lai thong tin va hoan tat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            {props.successMessage ? (
              <div className="p-6 sm:p-8">
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <DashboardIcon name="sparkles" className="h-7 w-7" />
                  </div>
                  <h4 className="mt-4 text-xl font-bold text-slate-900">
                    Đặt lịch thành công!
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {props.successMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewOpen(false);
                      props.onCloseSuccess();
                    }}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0863c5] px-6 text-sm font-bold text-white transition hover:bg-[#0753a8]"
                  >
                    Về quản lý lịch hẹn
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_340px]">
                  <section className="space-y-6">
                    <article className="rounded-[28px] bg-gradient-to-br from-[#0863c5] to-[#05468c] p-6 text-white shadow-lg shadow-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                            Thong tin tong quan
                          </p>
                          <h4 className="mt-1 text-2xl font-bold text-white">
                            {props.selectedService?.name ?? "Lịch hẹn khám"}
                          </h4>
                        </div>
                        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/14 text-white">
                          <DashboardIcon name="appointment" className="h-7 w-7" />
                        </span>
                      </div>
                      <div className="mt-6 grid gap-3 rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                        <SummaryLine
                          icon="appointment"
                          label="Dich vu"
                          value={props.selectedService?.name ?? "Chưa chọn"}
                          detail={
                            props.selectedService
                              ? `${props.selectedService.price} d`
                              : ""
                          }
                          inverse
                        />
                        <SummaryLine
                          icon="user"
                          label="Bác sĩ"
                          value={props.selectedDoctor?.name ?? "Chưa chọn"}
                          detail={props.selectedDoctor?.specialty ?? ""}
                          inverse
                        />
                      </div>
                    </article>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReviewCard
                        icon="calendar"
                        label="Ngay kham"
                        value={
                          props.selectedDate
                            ? `${props.selectedDate.weekday} ${props.selectedDate.day}`
                            : "--"
                        }
                        detail={props.selectedDate?.month ?? "Chưa chọn"}
                      />
                      <ReviewCard
                        icon="clock"
                        label="Gio kham"
                        value={props.selectedTime || "--"}
                        detail="Gio dia phuong"
                      />
                      <ReviewCard
                        icon="shield"
                        label="Trang thai yeu cau"
                        value="Cho phong kham xac nhan"
                        detail="Thong bao se duoc gui sau khi dat lich"
                      />
                      <ReviewCard
                        icon="document"
                        label="Cach giu lich"
                        value={
                          props.selectedPaymentOption === "DEPOSIT_30_PERCENT"
                            ? "Coc truoc"
                            : "Thanh toan tai quay"
                        }
                        detail={
                          props.selectedPaymentOption === "DEPOSIT_30_PERCENT"
                            ? "He thong se tao hoa don coc"
                            : "Thanh toan khi den kham"
                        }
                      />
                    </div>
                  </section>

                  <aside className="space-y-5">
                    <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0863c5]">
                            Chinh sach phong kham
                          </p>
                          <h4 className="mt-2 text-xl font-bold text-slate-900">
                            Dieu kien can luu y
                          </h4>
                        </div>
                        <span className="rounded-full bg-[#0863c5] px-3 py-1 text-[10px] font-bold text-white">
                          3 quy dinh
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <PolicyItem
                          title="Chon cach giu lich"
                          text="Ban co the coc truoc hoac chon thanh toan tai quay khi den kham."
                        />
                        <PolicyItem
                          title="Phan tram / so tien"
                          text="Muc coc co the la % gia dich vu hoac so tien co dinh theo cau hinh admin."
                        />
                        <PolicyItem
                          title="Ghi nhan vao hoa don"
                          text="Neu coc truoc, he thong tao hoa don DEPOSIT va ghi nhan trang thai giu lich."
                        />
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,.04)]">
                      <div className="flex gap-3">
                        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0863c5]">
                          <DashboardIcon name="checkup" className="h-5 w-5" />
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Xác nhận trước khi gửi lịch hẹn
                          </h4>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            He thong se gui yeu cau dat lich den phong kham ngay sau khi ban xac nhan.
                          </p>
                        </div>
                      </div>

                      <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                        <input
                          type="checkbox"
                          checked={reviewAccepted}
                          onChange={(event) => setReviewAccepted(event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#0863c5]"
                        />
                        <span className="text-sm leading-6 text-slate-600">
                          Toi da doc ky thong tin dat lich va dong y voi chinh sach cua phong kham.
                        </span>
                      </label>
                    </section>
                  </aside>
                </div>

                <div className="border-t border-slate-200/80 bg-white px-6 py-4 sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Vui long kiem tra ky truoc khi gui yeu cau dat lich.
                    </p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={props.onCancelBooking}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Hủy đặt lịch
                      </button>
                      <button
                        type="button"
                        aria-busy={Boolean(props.isSubmitting)}
                        disabled={!reviewAccepted || Boolean(props.isSubmitting)}
                        onClick={props.onConfirmBooking}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0758b7] px-6 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#064b9c] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {props.isSubmitting ? (
                          <LoadingSpinner />
                        ) : (
                          <DashboardIcon name="appointment" className="h-4 w-4" />
                        )}
                        {props.isSubmitting ? "Đang xử lý..." : "Đặt lịch ngay"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PaymentOptionCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-[#0863c5] bg-blue-50/70 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <span
          className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
            selected ? "border-[#0863c5]" : "border-slate-300"
          }`}
        >
          {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#0863c5]" /> : null}
        </span>
      </div>
    </button>
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

function ReviewCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: "calendar" | "clock" | "shield" | "document";
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-[28px] font-bold leading-none text-slate-900">
            {value}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0863c5]">
          <DashboardIcon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function PolicyItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,.03)]">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0863c5]">
        <DashboardIcon name="shield" className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function SummaryLine({
  icon,
  label,
  value,
  detail,
  inverse = false,
}: {
  icon: "appointment" | "user";
  label: string;
  value: string;
  detail: string;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
          inverse ? "bg-white/14 text-white" : "bg-blue-50 text-[#0863c5]"
        }`}
      >
        <DashboardIcon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
            inverse ? "text-white/70" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-1 truncate text-base font-bold ${
            inverse ? "text-white" : "text-slate-900"
          }`}
        >
          {value}
        </p>
        {detail ? (
          <p
            className={`mt-1 text-sm ${
              inverse ? "text-white/80" : "text-slate-500"
            }`}
          >
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
