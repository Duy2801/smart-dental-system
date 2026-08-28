"use client";

import { useEffect, useRef, useState } from "react";
import apiClient from "@/lib/axios";
import type { PatientConsultationItem } from "../types";

interface RefundRequestModalProps {
  consultation: PatientConsultationItem;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_BANKS = [
  "MBBank (Ngân hàng Quân Đội)",
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "VPBank",
  "BIDV",
  "Agribank",
  "ACB (Ngân hàng Á Châu)",
  "Sacombank",
  "TPBank",
  "VietinBank",
  "VIB",
  "HDBank",
  "MoMo Wallet",
  "ZaloPay Wallet",
  "Ngân hàng khác",
];

export function RefundRequestModal({
  consultation,
  onClose,
  onSuccess,
}: RefundRequestModalProps) {
  // Option Choice: "BANK_ACCOUNT" (Nhập số TK) hoặc "VIETQR_IMAGE" (Tải ảnh Mã QR)
  const [method, setMethod] = useState<"BANK_ACCOUNT" | "VIETQR_IMAGE">("BANK_ACCOUNT");

  const [bankName, setBankName] = useState("MBBank (Ngân hàng Quân Đội)");
  const [customBank, setCustomBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrFileName, setQrFileName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isBankOpen, setIsBankOpen] = useState(false);

  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedBankInfo, setSubmittedBankInfo] = useState<{
    bankName: string;
    accountNumber: string;
  } | null>(null);

  // Khóa thanh cuộn trình duyệt (cả html & body) khi mở Form Modal
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleClickOutside = (e: MouseEvent) => {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(e.target as Node)
      ) {
        setIsBankOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const schedTime = new Date(consultation.scheduledAt).getTime();
  const hoursUntil = (schedTime - Date.now()) / (1000 * 60 * 60);

  let refundPercent = 0;
  let policyText = "";
  if (hoursUntil > 24) {
    refundPercent = 100;
    policyText = "Hủy trước >24 tiếng: Hoàn 100% phí tư vấn";
  } else if (hoursUntil >= 4) {
    refundPercent = 50;
    policyText = "Hủy trước 4h - 24h: Hoàn 50% phí tư vấn";
  } else {
    refundPercent = 0;
    policyText = "Hủy dưới 4h: Không đủ điều kiện hoàn tiền";
  }

  const feeNum = Number(consultation.fee || 0);
  const expectedRefundAmount = Math.round((feeNum * refundPercent) / 100);

  // Xử lý chọn tệp ảnh QR từ thiết bị
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Dung lượng tệp ảnh không được vượt quá 5MB.");
      return;
    }

    setQrFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCodeUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setQrCodeUrl("");
    setQrFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refundPercent === 0) {
      setErrorMsg("Đơn tư vấn hủy sát giờ (<4 tiếng) nên không thuộc diện áp dụng hoàn tiền.");
      return;
    }

    let finalBankName = "";
    let finalAccountNumber = "";
    let finalAccountHolder = "";

    if (method === "BANK_ACCOUNT") {
      finalBankName = bankName === "Ngân hàng khác" ? customBank.trim() : bankName;
      finalAccountNumber = accountNumber.trim();
      finalAccountHolder = accountHolder.trim().toUpperCase();

      if (!finalBankName) {
        setErrorMsg("Vui lòng chọn hoặc nhập tên ngân hàng.");
        return;
      }
      if (!finalAccountNumber) {
        setErrorMsg("Vui lòng nhập số tài khoản ngân hàng.");
        return;
      }
      if (!finalAccountHolder) {
        setErrorMsg("Vui lòng nhập tên chủ tài khoản.");
        return;
      }
    } else {
      // Phương thức 2: Tải Mã VietQR
      if (!qrCodeUrl) {
        setErrorMsg("Vui lòng tải lên tệp ảnh Mã QR Ngân Hàng của bạn.");
        return;
      }
      finalBankName = "Thanh toán qua Mã VietQR";
      finalAccountNumber = "Quét Mã QR Đính Kèm";
      finalAccountHolder = accountHolder.trim().toUpperCase() || "CHỦ TÀI KHOẢN VIETQR";
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient.post("/refund-requests", {
        videoConsultationId: consultation.id,
        bankName: finalBankName,
        accountNumber: finalAccountNumber,
        accountHolder: finalAccountHolder,
        qrCodeUrl: qrCodeUrl.trim() || undefined,
        reason: reason.trim() || undefined,
      });

      setSubmittedBankInfo({
        bankName: finalBankName,
        accountNumber: finalAccountNumber,
      });
      setSubmittedSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Gửi yêu cầu hoàn tiền không thành công.";
      setErrorMsg(msg || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner border border-emerald-200">
            ✓
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-800">
              Gửi Yêu Cầu Hoàn Tiền Thành Công!
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Bộ phận Lễ tân đã ghi nhận thông tin và sẽ tiến hành kiểm tra & chuyển khoản cho bạn trong thời gian sớm nhất.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Số tiền hoàn dự kiến:</span>
              <strong className="text-rose-600 font-mono font-extrabold text-sm">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(expectedRefundAmount)}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Nhận qua:</span>
              <strong className="text-slate-800 font-semibold">{submittedBankInfo?.bankName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Số tài khoản:</span>
              <strong className="text-slate-800 font-mono font-bold">{submittedBankInfo?.accountNumber}</strong>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Trạng thái xử lý:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                ⏳ Đang chờ Lễ tân xác nhận
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all text-xs cursor-pointer"
          >
            Hoàn Tất & Xem Danh Sách Hẹn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Header - Cố định top */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Hủy Đơn & Hoàn Tiền
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
              Nhận tiền hoàn qua chuyển khoản
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Bác sĩ: <span className="font-semibold text-slate-700">{consultation.doctorName}</span> • Phí:{" "}
              <strong className="text-emerald-700 font-mono">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(feeNum)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center transition-colors text-sm shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="refund-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {/* Card Chính sách hoàn tiền */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <span>🛡️</span> Chính sách hủy đơn & hoàn tiền
              </span>
              <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-md font-bold text-[10px]">
                {refundPercent}% Hoàn
              </span>
            </div>
            <p className="text-amber-800 font-medium text-[11px] leading-relaxed">{policyText}</p>
            <div className="pt-1.5 border-t border-amber-200/60 flex justify-between items-center text-xs font-bold text-amber-950">
              <span>Số tiền hoàn thực nhận:</span>
              <span className="text-rose-600 text-base font-mono font-extrabold">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(expectedRefundAmount)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Switch chọn 1 trong 2 phương thức */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">
              Chọn phương thức nhận tiền <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setMethod("BANK_ACCOUNT");
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  method === "BANK_ACCOUNT"
                    ? "bg-white text-rose-600 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🏦</span>
                <span>1. Nhập Số Tài Khoản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("VIETQR_IMAGE");
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  method === "VIETQR_IMAGE"
                    ? "bg-white text-rose-600 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🖼️</span>
                <span>2. Tải Mã VietQR</span>
              </button>
            </div>
          </div>

          {/* PHƯƠNG ÁN 1: Nhập Số Tài Khoản Thủ Công */}
          {method === "BANK_ACCOUNT" && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 animate-in fade-in duration-150">
              {/* Custom Select Ngân hàng */}
              <div className="relative" ref={bankDropdownRef}>
                <label className="block font-bold text-slate-700 mb-1">
                  Ngân Hàng nhận khoản tiền hoàn <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsBankOpen(!isBankOpen)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white flex justify-between items-center hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs text-left"
                >
                  <span className="truncate">{bankName}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${
                      isBankOpen ? "rotate-180 text-rose-500" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown hướng xuống dưới */}
                {isBankOpen && (
                  <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {COMMON_BANKS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setBankName(b);
                          setIsBankOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          bankName === b
                            ? "bg-rose-50 text-rose-700 font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{b}</span>
                        {bankName === b && <span className="text-rose-600 font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {bankName === "Ngân hàng khác" && (
                  <input
                    type="text"
                    placeholder="Nhập tên ngân hàng của bạn..."
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="mt-2 w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-white"
                  />
                )}
              </div>

              {/* Lưới 2 cột cho Số TK và Tên Chủ TK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số Tài Khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0987654321"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Chủ Tài Khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: NGUYEN VAN A"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHƯƠNG ÁN 2: Tải Mã QR Ngân Hàng */}
          {method === "VIETQR_IMAGE" && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 animate-in fade-in duration-150">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tải Tệp Ảnh Mã VietQR Ngân Hàng <span className="text-rose-500">*</span></span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="qr-image-upload-option"
                />

                {!qrCodeUrl ? (
                  <label
                    htmlFor="qr-image-upload-option"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-2xl cursor-pointer bg-white hover:bg-rose-50/40 transition-all space-y-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-rose-700">
                      Bấm vào đây để chọn tệp ảnh Mã QR từ thiết bị
                    </p>
                    <p className="text-[10px] text-slate-400">Hỗ trợ PNG, JPG, WebP (Tối đa 5MB)</p>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={qrCodeUrl}
                        alt="VietQR Preview"
                        className="w-14 h-14 object-contain rounded-xl border bg-white p-1 shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {qrFileName || "Ảnh mã VietQR đã chọn"}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          ✓ Đã sẵn sàng gửi cho Lễ tân
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer border border-rose-200"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tên Chủ Tài Khoản (Trên mã QR)</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYEN VAN A"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-white"
                />
              </div>
            </div>
          )}

          {/* Lý do hủy đơn */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Lý do hủy đơn</span>
              <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ghi rõ lý do bạn cần hủy lịch tư vấn..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs resize-none"
            />
          </div>
        </form>

        {/* Footer - Cố định bottom */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all text-xs cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            form="refund-form"
            disabled={submitting || refundPercent === 0}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? "Đang gửi..." : "Gửi Yêu Cầu Hoàn Tiền"}
          </button>
        </div>
      </div>
    </div>
  );
}
