"use client";

import { useEffect } from "react";
import type { PatientConsultationItem } from "../types";

interface ConsultationDetailModalProps {
  consultation: PatientConsultationItem;
  onClose: () => void;
  onOpenRefundModal?: () => void;
  onOpenPaymentModal?: () => void;
  onOpenVideoRoomModal?: () => void;
}

export function ConsultationDetailModal({
  consultation,
  onClose,
  onOpenRefundModal,
  onOpenPaymentModal,
  onOpenVideoRoomModal,
}: ConsultationDetailModalProps) {
  // Khóa thanh cuộn trang web khi mở Modal xem chi tiết
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

  const dateObj = new Date(consultation.scheduledAt);
  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);

  const createdDateStr = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(consultation.createdAt));

  const isCancelled = consultation.status === "CANCELLED";
  const isCompleted = consultation.status === "COMPLETED";
  const isInProgress = consultation.status === "IN_PROGRESS";
  const isScheduled = consultation.status === "SCHEDULED";

  const refund = consultation.refundRequest;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Header Modal Cố Định */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCancelled
                    ? "bg-rose-500"
                    : isCompleted
                    ? "bg-slate-400"
                    : isInProgress
                    ? "bg-emerald-500 animate-ping"
                    : "bg-blue-500"
                }`}
              />
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isCancelled
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : isCompleted
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : isInProgress
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {isCancelled
                  ? "Đã Hủy Lịch"
                  : isCompleted
                  ? "Đã Hoàn Thành"
                  : isInProgress
                  ? "Đang Diễn Ra"
                  : "Chờ Tư Vấn"}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mt-1">
              Chi Tiết Lịch Tư Vấn Trực Tuyến
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Mã lịch: <strong className="text-slate-600">{consultation.id}</strong>
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

        {/* Body Nội Dung Có Thanh Cuộn Mượt */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Card 1: Thông tin cuộc hẹn & Bác sĩ */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border border-blue-200">
                {consultation.doctorAvatarUrl ? (
                  <img
                    src={consultation.doctorAvatarUrl}
                    alt={consultation.doctorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "👨‍⚕️"
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {consultation.doctorName || "Bác sĩ Chuyên Khoa"}
                </h4>
                <p className="text-[11px] text-blue-600 font-semibold">
                  {consultation.doctorSpecialization || "Nha khoa Tổng quát"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Thời gian khám:</span>
                <p className="font-bold text-slate-800 text-xs">{dateStr}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Thời lượng gói:</span>
                <p className="font-bold text-slate-800 text-xs">
                  {consultation.durationMinutes} Phút tư vấn
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Phí dịch vụ:</span>
                <p className="font-extrabold text-emerald-700 font-mono text-sm">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(consultation.fee || 0)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Trạng thái thanh toán:</span>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                      consultation.isPaid
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {consultation.isPaid ? "✓ Đã thanh toán 100%" : "⏳ Chưa thanh toán"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[11px] text-slate-400 font-medium">Thời điểm đặt đơn:</span>
                <p className="font-medium text-slate-600 text-xs">{createdDateStr}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Ghi chú triệu chứng của Bệnh nhân */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
              <span>💬</span> Triệu chứng / Lý do đặt tư vấn của bạn:
            </span>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic font-medium leading-relaxed">
              {consultation.notes ? `"${consultation.notes}"` : "Không có ghi chú thêm khi đặt."}
            </p>
          </div>

          {/* Card 3: TRẠNG THÁI = CANCELLED (Chi tiết Hoàn tiền nếu có) */}
          {isCancelled && (
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                  <span>🚫</span> Thông tin hủy đơn & Hoàn tiền
                </span>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                  Đã Hủy Đơn
                </span>
              </div>

              {refund ? (
                <div className="bg-white p-3.5 rounded-xl border border-rose-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-500">Mã yêu cầu hoàn tiền:</span>
                    <span className="font-mono font-bold text-slate-800">{refund.refundCode}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Ngân hàng nhận:</span>
                      <strong className="text-slate-800">{refund.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Số tài khoản / Thẻ:</span>
                      <strong className="text-slate-800 font-mono">{refund.accountNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Chủ tài khoản:</span>
                      <strong className="text-slate-800 uppercase">{refund.accountHolder}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Số tiền hoàn dự kiến:</span>
                      <strong className="text-rose-600 font-mono font-extrabold text-sm">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(refund.requestedAmount)}
                      </strong>
                    </div>
                  </div>

                  {refund.reason && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border">
                      Lý do gửi hoàn tiền: "{refund.reason}"
                    </p>
                  )}

                  {/* Trạng thái duyệt của Lễ tân */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Trạng thái hoàn tiền:</span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs ${
                        refund.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : refund.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {refund.status === "COMPLETED"
                        ? "✓ Lễ tân đã chuyển khoản thành công"
                        : refund.status === "REJECTED"
                        ? "✕ Đã từ chối yêu cầu"
                        : "⏳ Đang chờ Lễ tân xử lý chuyển khoản"}
                    </span>
                  </div>

                  {/* Bill chứng từ nếu hoàn tiền thành công */}
                  {refund.status === "COMPLETED" && refund.proofImageUrl && (
                    <div className="pt-2 space-y-1">
                      <span className="font-bold text-slate-700 block">
                        🧾 Bill chứng từ chuyển khoản từ Lễ tân:
                      </span>
                      <img
                        src={refund.proofImageUrl}
                        alt="Bill chuyển khoản"
                        className="max-h-48 rounded-xl border object-contain bg-slate-50"
                      />
                    </div>
                  )}

                  {refund.status === "REJECTED" && refund.rejectReason && (
                    <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg text-xs border border-rose-200">
                      <strong>Lý do từ chối:</strong> {refund.rejectReason}
                    </div>
                  )}
                </div>
              ) : consultation.isPaid ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <span className="text-amber-800 font-medium text-xs">
                    Bạn chưa gửi yêu cầu hoàn tiền cho đơn đã thanh toán này.
                  </span>
                  {onOpenRefundModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRefundModal();
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs text-xs cursor-pointer"
                    >
                      Gửi Yêu Cầu Hoàn Tiền
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Đơn chưa được thanh toán nên không có phát sinh giao dịch hoàn tiền.
                </p>
              )}
            </div>
          )}

          {/* Card 4: TRẠNG THÁI = COMPLETED (Hoàn thành cuộc gọi) */}
          {isCompleted && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <span>✅</span> Kết quả buổi tư vấn trực tuyến
              </span>
              <p className="text-emerald-800 text-xs font-medium leading-relaxed">
                Buổi tư vấn trực tuyến với bác sĩ đã hoàn tất thành công. Nếu bạn cần thăm khám trực tiếp tại nha khoa, hãy liên hệ hotline để đặt lịch hẹn khám tại phòng khám.
              </p>
            </div>
          )}
        </div>

        {/* Footer Cố Định */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {!consultation.isPaid && isScheduled && onOpenPaymentModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
              >
                Thanh Toán Ngay
              </button>
            )}

            {(isInProgress || isScheduled) && consultation.isPaid && onOpenVideoRoomModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVideoRoomModal();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
              >
                Vào Phòng Video Call
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
