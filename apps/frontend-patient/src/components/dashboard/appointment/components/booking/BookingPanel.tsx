"use client";

import { useEffect, useState } from "react";
import type { AppointmentService, BookingDate, Dentist } from "../../types";
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
  successMessage: string | null;
  isSubmitting?: boolean;
  isCheckingAvailability?: boolean;
  onSelectService: (id: string) => void;
  onSelectDoctor: (id: string) => void;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
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
          <StepTitle number={3}>Chọn bác sĩ</StepTitle>
          <DoctorSelector
            doctors={props.doctors}
            selectedId={props.selectedDoctorId}
            onSelect={props.onSelectDoctor}
          />
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
              setReviewAccepted(false);
              setReviewOpen(true);
              props.onOpenReview();
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0758b7] px-7 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#064b9c] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <DashboardIcon name="appointment" className="h-4 w-4" />
            Xác nhận đặt lịch
            <DashboardIcon name="arrow" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {reviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[3px] animate-[modal-fade-in_180ms_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[min(88vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_30px_90px_rgba(15,23,42,.28)] animate-[modal-panel-in_220ms_cubic-bezier(.22,1,.36,1)]"
          >
            {props.successMessage ? (
              <div className="p-6 text-center sm:p-7">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <DashboardIcon name="checkup" className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-slate-900">
                  Đặt lịch thành công
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {props.successMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReviewOpen(false);
                    setReviewAccepted(false);
                    props.onCloseSuccess();
                  }}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#0758b7] px-6 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#064b9c]"
                >
                  Về quản lý lịch hẹn
                </button>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200/80 px-6 py-5 sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0863c5]">
                        Xem lại trước khi đặt lịch
                      </p>
                      <h3 className="mt-2 text-[30px] font-bold text-slate-900">
                        Xác nhận thông tin đã chọn
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Vui lòng kiểm tra lại lịch hẹn, chính sách và xác nhận trước khi gửi yêu cầu đến phòng khám.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewOpen(false);
                        setReviewAccepted(false);
                      }}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                      aria-label="Đóng hộp xác nhận"
                    >
                      <span className="text-xl leading-none">x</span>
                    </button>
                  </div>
                </div>

                <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.1fr)_360px]">
                  <section className="space-y-5">
                    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#0a5fbe] via-[#0d74d8] to-[#3ea4f0] p-6 text-white shadow-[0_18px_48px_rgba(8,99,197,.25)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                            Lịch hẹn sắp gửi
                          </p>
                          <h4 className="mt-3 text-3xl font-bold">
                            {props.selectedTime || "--:--"}
                          </h4>
                          <p className="mt-2 text-sm text-white/85">
                            {props.selectedDate
                              ? `${props.selectedDate.weekday} ${props.selectedDate.day} ${props.selectedDate.month}`
                              : "Chưa chọn ngày khám"}
                          </p>
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
                          label="Bac si"
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
                        detail={props.selectedDate?.month ?? "Chua chon"}
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
                        label="Ho so dat lich"
                        value="Thong tin da san sang"
                        detail="Phong kham se doi chieu khi tiep nhan"
                      />
                    </div>
                  </section>

                  <aside className="space-y-5">
                    <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0863c5]">
                            Chính sách phòng khám
                          </p>
                          <h4 className="mt-2 text-xl font-bold text-slate-900">
                            Điều kiện cần lưu ý
                          </h4>
                        </div>
                        <span className="rounded-full bg-[#0863c5] px-3 py-1 text-[10px] font-bold text-white">
                          3 quy dinh
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <PolicyItem
                          title="Hủy lịch trước 12 giờ"
                          text="Thông báo sớm để được hủy lịch miễn phí và không bị đánh dấu vắng mặt."
                        />
                        <PolicyItem
                          title="Đổi lịch trước 6 giờ"
                          text="Phòng khám chỉ hỗ trợ đổi lịch online khi còn đủ tối thiểu 6 giờ."
                        />
                        <PolicyItem
                          title="No-show và đặt cọc"
                          text="Từ 2 lần no-show sẽ yêu cầu cọc 50%. Từ 3 lần trở lên, vui lòng liên hệ lễ tân."
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
                            Hệ thống sẽ gửi yêu cầu đặt lịch đến phòng khám ngay sau khi bạn xác nhận.
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
                          Tôi đã đọc kỹ thông tin đặt lịch và đồng ý với chính sách của phòng khám.
                        </span>
                      </label>
                    </section>
                  </aside>
                </div>

                <div className="border-t border-slate-200/80 bg-white px-6 py-4 sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Vui lòng kiểm tra kỹ trước khi gửi yêu cầu đặt lịch.
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

function PolicyItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,.03)]">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0863c5]">
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
          inverse
            ? "bg-white/14 text-white"
            : "bg-blue-50 text-[#0863c5]"
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
