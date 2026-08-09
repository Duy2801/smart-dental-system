"use client";

import { formatCurrency } from "@/utils/helpers";
import type { ConsultationBookingResult } from "../types";

interface PaymentCheckoutViewProps {
  bookingResult: ConsultationBookingResult;
  onViewMyConsultations: () => void;
  onBookAnother: () => void;
}

export function PaymentCheckoutView({
  bookingResult,
  onViewMyConsultations,
  onBookAnother,
}: PaymentCheckoutViewProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
      <div className="flex items-center gap-3 text-emerald-600">
        <svg
          className="w-8 h-8 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Đã Khởi Tạo Đơn Tư Vấn Thành Công!
          </h2>
          <p className="text-slate-500 text-sm">
            Mã hóa đơn:{" "}
            <span className="font-semibold text-blue-600">
              {bookingResult.invoice.invoiceCode}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <strong>Lưu ý quan trọng (Thanh toán 100% giữ slot):</strong>
          <p className="mt-1">
            Vui lòng hoàn tất chuyển khoản trong vòng <strong>15 phút</strong> để
            xác nhận lịch tư vấn trực tuyến. Hệ thống tự động gửi thông báo
            nhắc nhở trước <strong>10 phút</strong> đến giờ hẹn.
          </p>
        </div>
      </div>

      {/* Thông tin VietQR Checkout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quét Mã VietQR Chuyển Khoản Nhanh
          </span>
          {bookingResult.payment?.qrImageUrl ? (
            <img
              src={bookingResult.payment.qrImageUrl}
              alt="VietQR Payment"
              className="w-64 h-64 object-contain rounded-lg border shadow-sm bg-white p-2"
            />
          ) : (
            <div className="w-64 h-64 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-sm">
              Đang tạo mã QR...
            </div>
          )}
          <span className="text-xs text-slate-500 mt-2">
            Hỗ trợ tất cả ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, VPBank...)
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 border-b pb-2">
            Thông tin Chuyển Khoản Trực Tiếp
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-dashed">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-semibold text-slate-800">
                {bookingResult.payment?.bankName || "MBBank"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed">
              <span className="text-slate-500">Số tài khoản:</span>
              <span className="font-mono font-bold text-blue-600">
                {bookingResult.payment?.bankAccountNo || "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <span className="font-semibold text-slate-800">
                {bookingResult.payment?.bankAccountName || "PHONG KHAM NHA KHOA SMART DENTAL"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed">
              <span className="text-slate-500">Số tiền (100%):</span>
              <span className="font-bold text-emerald-600 text-base">
                {formatCurrency(bookingResult.invoice.finalAmount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed bg-blue-50 p-2.5 rounded-lg">
              <span className="text-blue-700 font-medium">Nội dung CK:</span>
              <span className="font-mono font-bold text-blue-800">
                {bookingResult.payment?.transferContent}
              </span>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={onViewMyConsultations}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-semibold transition-all text-center"
            >
              Xem Lịch Tư Vấn Của Tôi
            </button>
            <button
              onClick={onBookAnother}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all"
            >
              Đặt Lịch Khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
