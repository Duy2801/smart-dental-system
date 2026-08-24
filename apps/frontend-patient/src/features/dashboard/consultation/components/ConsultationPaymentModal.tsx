"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/helpers";
import { getConsultationPaymentInfo } from "../api";
import type { PatientConsultationItem } from "../types";

interface ConsultationPaymentModalProps {
  consultation: PatientConsultationItem;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

type PaymentData = Awaited<ReturnType<typeof getConsultationPaymentInfo>>;

export function ConsultationPaymentModal({
  consultation,
  onClose,
  onPaymentSuccess,
}: ConsultationPaymentModalProps) {
  const [data, setData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchPaymentInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getConsultationPaymentInfo(consultation.id);
      if (res.isPaid) {
        onPaymentSuccess();
        onClose();
        return;
      }
      setData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể lấy thông tin thanh toán.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPaymentInfo();
  }, [consultation.id]);

  const handleCopy = (text: string, fieldName: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(consultation.scheduledAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Thanh Toán Lịch Tư Vấn Trực Tuyến
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {consultation.doctorName || "Bác sĩ Chuyên khoa"} • {consultation.durationMinutes} phút
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Loading / Error state */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium">Đang tạo mã QR VietQR...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium text-center space-y-3">
            <p>{error}</p>
            <button
              onClick={() => void fetchPaymentInfo()}
              className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700"
            >
              Thử lại
            </button>
          </div>
        ) : data?.payment ? (
          <div className="space-y-5">
            {/* Appointment info bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Thời gian tư vấn:</span>
                <strong className="text-slate-800 font-semibold">{formattedDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Mã hóa đơn:</span>
                <strong className="text-blue-600 font-mono font-semibold">
                  {data.invoice?.invoiceCode}
                </strong>
              </div>
            </div>

            {/* QR Code view */}
            <div className="flex flex-col items-center bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quét mã VietQR chuyển khoản nhanh
              </span>
              {data.payment.qrImageUrl ? (
                <img
                  src={data.payment.qrImageUrl}
                  alt="VietQR Payment"
                  className="w-56 h-56 object-contain rounded-xl border shadow-sm bg-white p-2"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                  Không có hình ảnh QR
                </div>
              )}
              <span className="text-[11px] text-slate-500 mt-2 text-center">
                Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank...) để quét mã
              </span>
            </div>

            {/* Bank detail rows */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-dashed">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800">
                  {data.payment.bankName}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-dashed">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {data.payment.bankAccountNo}
                  </span>
                  <button
                    onClick={() => handleCopy(data.payment!.bankAccountNo, "accountNo")}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    {copiedField === "accountNo" ? "Đã chép!" : "Chép STK"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-dashed">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-semibold text-slate-800">
                  {data.payment.bankAccountName}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-dashed">
                <span className="text-slate-500">Phí tư vấn (100%):</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(data.payment.amount)}
                </span>
              </div>

              {/* Transfer Content highlighted */}
              <div className="flex justify-between items-center py-2 bg-amber-50 px-3 rounded-xl border border-amber-200 mt-2">
                <div>
                  <span className="text-amber-800 font-semibold block text-[11px]">
                    Nội dung chuyển khoản (bắt buộc):
                  </span>
                  <span className="font-mono font-extrabold text-amber-900 text-sm">
                    {data.payment.transferContent}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(data.payment!.transferContent, "content")}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 shadow-2xs"
                >
                  {copiedField === "content" ? "Đã chép!" : "Sao chép"}
                </button>
              </div>
            </div>

            {/* Note alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 leading-relaxed">
              💡 <strong>Lưu ý:</strong> Sau khi hoàn tất chuyển khoản thành công trên ứng dụng ngân hàng, hệ thống sẽ tự động đối soát và xác nhận lịch tư vấn trong giây lát.
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => void fetchPaymentInfo()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md text-center"
              >
                Tôi Đã Chuyển Khoản (Kiểm tra lại)
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
