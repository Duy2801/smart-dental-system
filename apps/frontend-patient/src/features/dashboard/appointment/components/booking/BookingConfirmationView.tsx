"use client";

import type {
  AppointmentPaymentOption,
  AppointmentService,
  BookingDate,
  Dentist,
  TreatmentMethodItem,
} from "../../types";

function formatPrice(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return "Liên hệ";
  if (typeof value === "number") {
    return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
  }
  const cleaned = String(value).replace(/[^\d]/g, "");
  if (!cleaned) return "Liên hệ";
  const num = Number(cleaned);
  return `${new Intl.NumberFormat("vi-VN").format(num)} đ`;
}

type BookingConfirmationViewProps = {
  selectedService?: AppointmentService;
  selectedTreatmentMethod?: TreatmentMethodItem;
  selectedDoctor?: Dentist;
  selectedDate?: BookingDate;
  selectedTime: string;
  selectedPaymentOption: AppointmentPaymentOption;
  onSelectPaymentOption: (option: AppointmentPaymentOption) => void;
  acceptedTerms: boolean;
  onToggleTerms: (accepted: boolean) => void;
  isSubmitting: boolean;
  onConfirmBooking: () => void;
  onBackToEdit: () => void;
};

export function BookingConfirmationView({
  selectedService,
  selectedTreatmentMethod,
  selectedDoctor,
  selectedDate,
  selectedTime,
  selectedPaymentOption,
  onSelectPaymentOption,
  acceptedTerms,
  onToggleTerms,
  isSubmitting,
  onConfirmBooking,
  onBackToEdit,
}: BookingConfirmationViewProps) {
  const formattedMonth = selectedDate?.month ? `thg ${selectedDate.month}` : "";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.75fr)_380px]">
      <div className="min-w-0 space-y-4">
        {/* Top Blue Banner Card (Compact) */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0863c5] to-[#0753a8] p-5 text-white shadow-md shadow-blue-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-md bg-white/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-100 uppercase">
                DỊCH VỤ ĐÃ CHỌN
              </span>
              <h2 className="mt-1 text-xl font-bold text-white truncate">
                {selectedService?.name || "Chưa chọn dịch vụ"}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-extrabold text-white">
                {formatPrice(selectedTreatmentMethod?.price)}
              </p>
              {selectedTreatmentMethod?.durationMinutes ? (
                <p className="text-[11px] text-blue-100/90 font-medium">
                  Thời lượng: {selectedTreatmentMethod.durationMinutes} phút
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-2.5 border-t border-white/15 pt-2 flex items-center justify-between text-xs text-blue-100/90">
            <span className="font-medium truncate">
              Phương pháp: <strong>{selectedTreatmentMethod?.name || "--"}</strong>
            </span>
          </div>
        </div>

        {/* Details Grid: Doctor & Date/Time */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Doctor Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0863c5]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                BÁC SĨ PHỤ TRÁCH
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 truncate">
                {selectedDoctor?.name || "BS do phòng khám sắp xếp"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {selectedDoctor?.specialty || "Chuyên khoa tổng quát"}
              </p>
            </div>
          </div>

          {/* Date & Time Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                THỜI GIAN KHÁM
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 truncate">
                {selectedDate ? `${selectedDate.weekday} ${selectedDate.day} ${formattedMonth}` : "--/--"}
              </p>
              <p className="text-xs font-semibold text-[#0863c5] truncate">
                Khung giờ: {selectedTime || "--:--"}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Selection Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Hình thức giữ lịch hẹn
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onSelectPaymentOption("DEPOSIT_30_PERCENT")}
              className={`rounded-xl border p-3 text-left transition flex items-start justify-between ${
                selectedPaymentOption === "DEPOSIT_30_PERCENT"
                  ? "border-[#0863c5] bg-blue-50/80 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Đặt cọc giữ lịch (30%)</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Hệ thống tự động tạo hóa đơn cọc</p>
              </div>
              <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selectedPaymentOption === "DEPOSIT_30_PERCENT" ? "border-[#0863c5] bg-[#0863c5]" : "border-slate-300"}`}>
                {selectedPaymentOption === "DEPOSIT_30_PERCENT" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPaymentOption("PAY_AT_COUNTER")}
              className={`rounded-xl border p-3 text-left transition flex items-start justify-between ${
                selectedPaymentOption === "PAY_AT_COUNTER"
                  ? "border-[#0863c5] bg-blue-50/80 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Thanh toán tại quầy</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Thanh toán khi đến khám tại phòng khám</p>
              </div>
              <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selectedPaymentOption === "PAY_AT_COUNTER" ? "border-[#0863c5] bg-[#0863c5]" : "border-slate-300"}`}>
                {selectedPaymentOption === "PAY_AT_COUNTER" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Actions & Policies Sidebar */}
      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0863c5]">
              Quy định đặt lịch
            </h4>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0863c5]">
              Lưu ý
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-500 font-bold">✓</span>
              <span><strong>Giữ lịch:</strong> Cọc trước hoặc thanh toán tại quầy khi đến khám.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-500 font-bold">✓</span>
              <span><strong>Số tiền cọc:</strong> 30% giá trị dịch vụ theo cấu hình phòng khám.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-500 font-bold">✓</span>
              <span><strong>Hóa đơn:</strong> Tự động tạo hóa đơn DEPOSIT ghi nhận trạng thái.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => onToggleTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0863c5] focus:ring-[#0863c5]"
              />
              <span className="text-[11px] leading-4 text-slate-600">
                Tôi đã kiểm tra kỹ thông tin và đồng ý với quy định của phòng khám.
              </span>
            </label>

            <button
              type="button"
              disabled={!acceptedTerms || isSubmitting}
              onClick={onConfirmBooking}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-4 text-xs font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300 shadow-md shadow-blue-200"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận đặt lịch ngay"
              )}
            </button>

            <button
              type="button"
              onClick={onBackToEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              ← Quay lại chỉnh sửa
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
