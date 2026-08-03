import type {
  AppointmentPaymentOption,
  AppointmentService,
  BookingDate,
  CurrentAppointment,
  Dentist,
  NotificationPreferences,
} from "../../types";
import { BookingPanel } from "./BookingPanel";
import { CurrentAppointmentCard } from "../sidebar/CurrentAppointmentCard";
import { NotificationSettings } from "../sidebar/NotificationSettings";
import { SupportCard } from "../sidebar/SupportCard";

type BookingModeViewProps = {
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
  current: CurrentAppointment | null;
  notifications: NotificationPreferences;
  successMessage: string | null;
  isSubmitting: boolean;
  isCheckingAvailability: boolean;
  onSelectService: (id: string) => void;
  onSelectDoctor: (id: string) => void;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
  onSelectPaymentOption: (value: AppointmentPaymentOption) => void;
  onToggleNotification: (key: keyof NotificationPreferences) => void;
  onOpenReview: () => void;
  onConfirmBooking: () => void;
  onCloseSuccess: () => void;
  onCancelBooking: () => void;
};

export function BookingModeView({
  services,
  doctors,
  dates,
  times,
  blockedTimes = [],
  blockedRanges = [],
  slotIntervalMinutes,
  selectedServiceId,
  selectedDoctorId,
  selectedDateId,
  selectedTime,
  selectedService,
  selectedDoctor,
  selectedDate,
  selectedPaymentOption,
  current,
  notifications,
  successMessage,
  isSubmitting,
  isCheckingAvailability,
  onSelectService,
  onSelectDoctor,
  onSelectDate,
  onSelectTime,
  onSelectPaymentOption,
  onToggleNotification,
  onOpenReview,
  onConfirmBooking,
  onCloseSuccess,
  onCancelBooking,
}: BookingModeViewProps) {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Đặt lịch hẹn mới
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Chọn dịch vụ, thời gian và bác sĩ phù hợp với bạn.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.7fr)_360px]">
        <BookingPanel
          services={services}
          doctors={doctors}
          dates={dates}
          times={times}
          blockedTimes={blockedTimes}
          blockedRanges={blockedRanges}
          slotIntervalMinutes={slotIntervalMinutes}
          selectedServiceId={selectedServiceId}
          selectedDoctorId={selectedDoctorId}
          selectedDateId={selectedDateId}
          selectedTime={selectedTime}
          selectedService={selectedService}
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          selectedPaymentOption={selectedPaymentOption}
          successMessage={successMessage}
          isSubmitting={isSubmitting}
          isCheckingAvailability={isCheckingAvailability}
          onSelectService={onSelectService}
          onSelectDoctor={onSelectDoctor}
          onSelectDate={onSelectDate}
          onSelectTime={onSelectTime}
          onOpenReview={onOpenReview}
          onConfirmBooking={onConfirmBooking}
          onCloseSuccess={onCloseSuccess}
          onCancelBooking={onCancelBooking}
          onSelectPaymentOption={onSelectPaymentOption}
        />
        <aside className="space-y-5 lg:sticky lg:top-24">
          <CurrentAppointmentCard appointment={current} />
          <NotificationSettings
            value={notifications}
            onChange={onToggleNotification}
          />
          <SupportCard />
        </aside>
      </div>
    </main>
  );
}
