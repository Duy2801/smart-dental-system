"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const confirmedRef = useRef(false);
  const dataRef = useRef<PaymentData | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  onPaymentSuccessRef.current = onPaymentSuccess;

  const fetchPaymentInfo = useCallback(async (silent = false) => {
    if (!silent && !dataRef.current) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await getConsultationPaymentInfo(consultation.id);
      if (res.isPaid) {
        if (!confirmedRef.current) {
          confirmedRef.current = true;
          onPaymentSuccessRef.current();
          onCloseRef.current();
        }
        return;
      }

      // Chỉ cập nhật state khi chưa có data hoặc thông tin thanh toán thực sự thay đổi
      // Giúp ngăn chặn hiện tượng re-render / load lại liên tục
      if (!dataRef.current) {
        dataRef.current = res;
        setData(res);
        setError(null);
      } else if (
        dataRef.current.payment?.id !== res.payment?.id ||
        dataRef.current.payment?.transferContent !== res.payment?.transferContent
      ) {
        dataRef.current = res;
        setData(res);
      }
    } catch (err: unknown) {
      if (!silent && !dataRef.current) {
        const msg =
          err instanceof Error ? err.message : "Không thể lấy thông tin thanh toán.";
        setError(msg);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [consultation.id]);

  useEffect(() => {
    void fetchPaymentInfo(false);
    const interval = setInterval(() => void fetchPaymentInfo(true), 4000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchPaymentInfo]);

  // Khóa thanh cuộn trang web nền khi mở Modal thanh toán (loại bỏ thanh kéo cuộn trang web)
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Thanh Toán Lịch Tư Vấn Trực Tuyến
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {consultation.doctorName || "Bác sĩ Chuyên khoa"} • {consultation.durationMinutes} phút
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Loading / Error state */}
        {isLoading ? (
          <div className="py-14 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium">Đang tạo mã QR VietQR...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium text-center space-y-3 my-4">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void fetchPaymentInfo(false)}
              className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : data?.payment ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Cột trái: QR Code & Thông tin tóm tắt lịch hẹn */}
            <div className="md:col-span-5 flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
                Quét mã VietQR chuyển khoản
              </span>
              {data.payment.qrImageUrl ? (
                <img
                  src={data.payment.qrImageUrl}
                  alt="VietQR Payment"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl border border-slate-200 shadow-xs bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                  Không có hình ảnh QR
                </div>
              )}
              <span className="text-[11px] text-slate-500 mt-2 text-center leading-snug">
                Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank...) để quét mã
              </span>

              {/* Thông tin tóm tắt bên dưới QR */}
              <div className="w-full mt-3 pt-2.5 border-t border-slate-200 text-[11px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Thời gian:</span>
                  <strong className="text-slate-800 font-semibold">{formattedDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Mã hóa đơn:</span>
                  <strong className="text-blue-600 font-mono font-semibold">
                    {data.invoice?.invoiceCode}
                  </strong>
                </div>
              </div>
            </div>

            {/* Cột phải: Chi tiết tài khoản ngân hàng, Nội dung chuyển khoản & Lưu ý */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">
                    {data.payment.bankName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {data.payment.bankAccountNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(data.payment!.bankAccountNo, "accountNo")}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                    >
                      {copiedField === "accountNo" ? "Đã chép!" : "Chép STK"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {data.payment.bankAccountName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500">Phí tư vấn (100%):</span>
                  <span className="font-bold text-emerald-600 text-base">
                    {formatCurrency(data.payment.amount)}
                  </span>
                </div>

                {/* Nội dung chuyển khoản (bắt buộc) */}
                <div className="flex justify-between items-center py-2.5 bg-amber-50 px-3.5 rounded-xl border border-amber-200 mt-2">
                  <div>
                    <span className="text-amber-800 font-semibold block text-[11px]">
                      Nội dung chuyển khoản (bắt buộc):
                    </span>
                    <span className="font-mono font-extrabold text-amber-900 text-sm sm:text-base">
                      {data.payment.transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(data.payment!.transferContent, "content")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    {copiedField === "content" ? "Đã chép!" : "Sao chép"}
                  </button>
                </div>
              </div>

              {/* Hộp ghi chú */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 leading-relaxed">
                💡 <strong>Lưu ý:</strong> Sau khi hoàn tất chuyển khoản thành công trên ứng dụng ngân hàng, hệ thống sẽ tự động đối soát và xác nhận lịch tư vấn trong giây lát.
              </div>

              {/* Footer thanh toán: Bỏ nút "Tôi Đã Chuyển Khoản", bổ sung trạng thái đối soát tự động và nút "Đóng" */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Hệ thống tự động xác nhận sau khi nhận tiền
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
