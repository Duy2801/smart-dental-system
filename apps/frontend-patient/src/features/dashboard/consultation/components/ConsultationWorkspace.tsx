"use client";

import { useEffect, useState } from "react";
import { createConsultationBooking } from "../api";
import type {
  ConsultationBookingResult,
  ConsultationDurationMinutes,
  ConsultationDurationOption,
} from "../types";

import { DoctorSelector } from "./DoctorSelector";
import { DurationSelector } from "./DurationSelector";
import { MyConsultationsList } from "./MyConsultationsList";
import { PaymentCheckoutView } from "./PaymentCheckoutView";
import { SlotPicker } from "./SlotPicker";

import { useQueryClient } from "@tanstack/react-query";
import { consultationQueryKeys } from "../hooks/useConsultationQueries";

export function ConsultationWorkspace() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"book" | "my-consultations">("book");

  // Booking Form state
  const [selectedDuration, setSelectedDuration] =
    useState<ConsultationDurationMinutes>(30);
  const [selectedDurationOption, setSelectedDurationOption] =
    useState<ConsultationDurationOption | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Status & Results
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] =
    useState<ConsultationBookingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate || !selectedSlot) {
      setErrorMessage("Vui lòng chọn đầy đủ Bác sĩ, Ngày và Khung giờ tư vấn.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const scheduledAt = `${selectedDate}T${selectedSlot}:00.000Z`;
      const result = await createConsultationBooking({
        doctorId: selectedDoctorId,
        scheduledAt,
        durationMinutes: selectedDuration,
        notes,
      });

      await queryClient.invalidateQueries({
        queryKey: consultationQueryKeys.all,
      });
      setBookingResult(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi tạo đơn đặt tư vấn. Vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner & Tab Switcher */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Telehealth Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Tư Vấn Nha Khoa Trực Tuyến
            </h1>
            <p className="text-blue-100 text-sm sm:text-base mt-1">
              Kết nối trực tiếp Video Call 1-1 với Bác sĩ chuyên khoa nha khoa hàng đầu.
            </p>
          </div>
          <div className="flex bg-white/10 p-1.5 rounded-xl backdrop-blur-md border border-white/20">
            <button
              onClick={() => setActiveTab("book")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "book"
                  ? "bg-white text-blue-700 shadow-md font-semibold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Đặt lịch tư vấn mới
            </button>
            <button
              onClick={() => setActiveTab("my-consultations")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "my-consultations"
                  ? "bg-white text-blue-700 shadow-md font-semibold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Lịch tư vấn của tôi
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      {activeTab === "book" && (
        <>
          {bookingResult ? (
            <PaymentCheckoutView
              bookingResult={bookingResult}
              onViewMyConsultations={() => setActiveTab("my-consultations")}
              onBookAnother={() => setBookingResult(null)}
            />
          ) : (
            <form
              onSubmit={handleBookingSubmit}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-8"
            >
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              {/* BƯỚC 1: Chọn gói thời lượng */}
              <DurationSelector
                selectedDuration={selectedDuration}
                onSelectDuration={(dur, option) => {
                  setSelectedDuration(dur);
                  if (option) setSelectedDurationOption(option);
                }}
              />

              {/* BƯỚC 2: Chọn bác sĩ */}
              <DoctorSelector
                selectedDoctorId={selectedDoctorId}
                onSelectDoctor={(docId) => setSelectedDoctorId(docId)}
              />

              {/* BƯỚC 3: Chọn ngày & slot */}
              <SlotPicker
                doctorId={selectedDoctorId}
                selectedDate={selectedDate}
                selectedDuration={selectedDuration}
                selectedSlot={selectedSlot}
                onChangeDate={(d) => setSelectedDate(d)}
                onSelectSlot={(s) => setSelectedSlot(s)}
              />

              {/* BƯỚC 4: Triệu chứng & ghi chú */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    4
                  </span>
                  <h2 className="text-lg font-bold text-slate-800">
                    Mô Tả Lý Do / Triệu Chứng Khám
                  </h2>
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập mô tả chi tiết về tình trạng răng miệng hoặc thắc mắc bạn cần Bác sĩ giải đáp..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Thông tin chính sách hủy */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-700">
                  ℹ️ Chính sách Hủy lịch & Thông báo:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>System tự động bắn thông báo nhắc trước <strong>10 phút</strong> đến cả Bệnh nhân & Bác sĩ.</li>
                  <li>Hủy trước <strong>&gt;24 tiếng</strong>: Hoàn <strong>100%</strong> phí dịch vụ.</li>
                  <li>Hủy trước từ <strong>4 tiếng - 24 tiếng</strong>: Hoàn <strong>50%</strong> phí dịch vụ.</li>
                  <li>Hủy dưới <strong>4 tiếng</strong> hoặc vắng mặt: Không áp dụng hoàn tiền.</li>
                </ul>
              </div>

              {/* Tóm tắt & Nút Đặt lịch */}
              <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Tổng chi phí (Thanh toán 100%):
                  </span>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {selectedDurationOption?.formattedPrice}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlot}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-center"
                >
                  {isSubmitting
                    ? "Đang khởi tạo đơn..."
                    : "Xác Nhận & Thanh Toán 100%"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {activeTab === "my-consultations" && (
        <MyConsultationsList onBookNew={() => setActiveTab("book")} />
      )}
    </div>
  );
}
