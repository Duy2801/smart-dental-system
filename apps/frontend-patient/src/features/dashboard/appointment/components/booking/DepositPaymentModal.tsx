"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/axios";
import { toast } from "@/features/dashboard/common/toast";
import { useQueryClient } from "@tanstack/react-query";
import { appointmentQueryKeys } from "../../hooks/useAppointmentQueries";

type DepositPaymentModalProps = {
  isOpen: boolean;
  invoiceId: string;
  depositAmount: number;
  serviceName?: string;
  doctorName?: string;
  scheduledTime?: string;
  onClose: () => void;
  onSuccess: () => void;
};

type PaymentDetails = {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  amount: number;
  transferContent: string;
  bankAccountNo: string;
  bankAccountName: string;
  bankBin: string;
  bankName: string;
  qrImageUrl: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
};

export function DepositPaymentModal({
  isOpen,
  invoiceId,
  depositAmount,
  serviceName,
  doctorName,
  scheduledTime,
  onClose,
  onSuccess,
}: DepositPaymentModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize payment & generate VietQR
  const fetchOrInitPayment = useCallback(async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      const res = await apiClient.post("/payments", {
        invoiceId,
        method: "BANK_TRANSFER",
      });
      setPaymentData(res.data as PaymentDetails);
    } catch (err: any) {
      toast.error(
        "Lỗi khởi tạo thanh toán",
        err?.response?.data?.message || "Không thể tạo mã QR thanh toán cọc.",
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (isOpen && invoiceId) {
      setIsSuccess(false);
      setTimeLeft(15 * 60);
      fetchOrInitPayment();
    }
  }, [isOpen, invoiceId, fetchOrInitPayment]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSuccess]);

  // Poll status every 3 seconds
  const checkPaymentStatus = useCallback(async () => {
    if (!invoiceId || isSuccess) return;
    try {
      setIsChecking(true);
      const res = await apiClient.get(`/payments/invoice/${invoiceId}`);
      const data = res.data as { status?: string; invoiceStatus?: string };
      if (data?.status === "SUCCESS" || data?.invoiceStatus === "PAID") {
        setIsSuccess(true);
        toast.success(
          "Thanh toán cọc thành công!",
          "Lịch hẹn của bạn đã được xác nhận giữ chỗ thành công.",
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: ["patient", "appointment-options"] }),
        ]);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      // Ignore polling transient errors
    } finally {
      setIsChecking(false);
    }
  }, [invoiceId, isSuccess, queryClient, onSuccess, onClose]);

  useEffect(() => {
    if (!isOpen || isSuccess) return;
    const interval = setInterval(checkPaymentStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen, isSuccess, checkPaymentStatus]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success("Đã sao chép", `${fieldName} đã được chép vào bộ nhớ tạm.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTimer = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0863c5] to-[#064fa1] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Thanh Toán Đặt Cọc 30%</h3>
                <p className="text-xs text-blue-100/90 font-medium">
                  Giữ chỗ ưu tiên lịch khám nha khoa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-2xl font-black text-slate-900">
              Đã Xác Nhận Đặt Cọc!
            </h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Hệ thống đã nhận được tiền cọc 30%. Lịch hẹn của bạn đã được xác nhận chính thức.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Đang tạo mã VietQR thanh toán cọc...</p>
          </div>
        ) : paymentData ? (
          <div className="p-6 space-y-5">
            {/* Timer Banner */}
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-2.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="font-semibold">Thời gian khóa slot còn lại:</span>
              </div>
              <span className="font-mono text-sm font-black text-amber-700">{formattedTimer}</span>
            </div>

            {/* QR Code & Transfer Information */}
            <div className="grid gap-4 sm:grid-cols-2 items-center">
              {/* VietQR Image */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {paymentData.qrImageUrl ? (
                  <img
                    src={paymentData.qrImageUrl}
                    alt="VietQR Payment"
                    className="h-44 w-44 object-contain rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="h-44 w-44 grid place-items-center text-xs text-slate-400">
                    Không tạo được QR
                  </div>
                )}
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mã VietQR tự động
                </span>
              </div>

              {/* Bank Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngân hàng</span>
                  <p className="font-bold text-slate-900 text-sm">{paymentData.bankName || "MBBank"}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số tài khoản</span>
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">{paymentData.bankAccountNo}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.bankAccountNo, "Số tài khoản")}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      {copiedField === "Số tài khoản" ? "Đã chép" : "Chép"}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số tiền đặt cọc (30%)</span>
                  <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-3 py-1.5 mt-0.5">
                    <span className="font-mono font-extrabold text-blue-700 text-base">
                      {paymentData.amount.toLocaleString("vi-VN")} đ
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(paymentData.amount), "Số tiền")}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      {copiedField === "Số tiền" ? "Đã chép" : "Chép"}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nội dung chuyển khoản</span>
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-800 text-xs truncate max-w-[150px]">
                      {paymentData.transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.transferContent, "Nội dung")}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      {copiedField === "Nội dung" ? "Đã chép" : "Chép"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Summary Note */}
            {(serviceName || doctorName || scheduledTime) && (
              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 border border-slate-100 space-y-1">
                {serviceName && <div><span className="font-semibold text-slate-700">Dịch vụ:</span> {serviceName}</div>}
                {doctorName && <div><span className="font-semibold text-slate-700">Bác sĩ:</span> {doctorName}</div>}
                {scheduledTime && <div><span className="font-semibold text-slate-700">Thời gian:</span> {scheduledTime}</div>}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={checkPaymentStatus}
                disabled={isChecking}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0863c5] text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#064fa1] disabled:opacity-50"
              >
                {isChecking ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  "Tôi đã chuyển khoản"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
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
