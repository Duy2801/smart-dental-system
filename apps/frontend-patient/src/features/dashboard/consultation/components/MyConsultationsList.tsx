"use client";

import { useEffect, useState } from "react";
import {
  useCancelConsultationMutation,
  useMyConsultationsQuery,
} from "../hooks/useConsultationQueries";
import type { PatientConsultationItem } from "../types";
import { ConsultationPaymentModal } from "./ConsultationPaymentModal";
import { VideoConsultationRoomModal } from "./VideoConsultationRoomModal";
import { RefundRequestModal } from "./RefundRequestModal";
import { ConsultationDetailModal } from "./ConsultationDetailModal";

interface MyConsultationsListProps {
  onBookNew: () => void;
}

export function MyConsultationsList({ onBookNew }: MyConsultationsListProps) {
  const {
    data: myConsultations = [],
    isLoading,
    refetch,
  } = useMyConsultationsQuery();
  const cancelMutation = useCancelConsultationMutation();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  const [selectedForPayment, setSelectedForPayment] =
    useState<PatientConsultationItem | null>(null);
  const [selectedForVideoRoom, setSelectedForVideoRoom] =
    useState<PatientConsultationItem | null>(null);
  const [selectedForRefund, setSelectedForRefund] =
    useState<PatientConsultationItem | null>(null);
  const [selectedForDetail, setSelectedForDetail] =
    useState<PatientConsultationItem | null>(null);

  // Force re-render every 30s to update countdowns / join button status
  const [, setClock] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClock((c) => c + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelClick = (item: PatientConsultationItem) => {
    if (item.isPaid) {
      // Đơn đã thanh toán -> Mở Modal nhập ngân hàng / QR code nhận tiền hoàn
      setSelectedForRefund(item);
    } else {
      // Đơn chưa thanh toán -> Hủy ngay trực tiếp
      void handleCancelUnpaidBooking(item.id);
    }
  };

  const handleCancelUnpaidBooking = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn tư vấn chưa thanh toán này?")) {
      return;
    }

    setCancellingId(id);
    setCancelNotice(null);

    try {
      await cancelMutation.mutateAsync(id);
      setCancelNotice("Đã hủy đơn tư vấn thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Hủy không thành công.";
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const formatCountdownText = (msRemaining: number) => {
    if (msRemaining <= 0) return "Sẵn sàng";
    const minutesTotal = Math.floor(msRemaining / (1000 * 60));
    if (minutesTotal >= 60) {
      const hours = Math.floor(minutesTotal / 60);
      const mins = minutesTotal % 60;
      return `Còn ${hours}h ${mins}m`;
    }
    return `Còn ${minutesTotal}m`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-slate-800">
          Danh Sách Buổi Tư Vấn Trực Tuyến Của Tôi
        </h2>
        <button
          onClick={() => void refetch()}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Làm mới
        </button>
      </div>

      {cancelNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium">
          {cancelNotice}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-44 bg-slate-200 rounded-md" />
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-4 w-64 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      ) : myConsultations.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <p>Bạn chưa có buổi tư vấn trực tuyến nào.</p>
          <button
            onClick={onBookNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Đặt Lịch Tư Vấn Ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myConsultations.map((item) => {
            const dateObj = new Date(item.scheduledAt);
            const durationMs = (item.durationMinutes || 30) * 60 * 1000;
            const endDateObj = new Date(dateObj.getTime() + durationMs);

            const startTimeStr = new Intl.DateTimeFormat("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(dateObj);

            const endTimeStr = new Intl.DateTimeFormat("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(endDateObj);

            const dateOnlyStr = new Intl.DateTimeFormat("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(dateObj);

            const dateStr = `${startTimeStr} - ${endTimeStr} - ${dateOnlyStr}`;

            const isActive = item.status === "IN_PROGRESS";
            const isScheduled = item.status === "SCHEDULED";
            const isCancelled = item.status === "CANCELLED";
            const isCompleted = item.status === "COMPLETED";

            const now = Date.now();
            const schedTime = dateObj.getTime();
            const endTime = schedTime + durationMs;
            const fiveMinsBefore = schedTime - 5 * 60 * 1000;

            const isWithinTimeWindow =
              now >= fiveMinsBefore && now <= endTime + 15 * 60 * 1000;

            const canJoinRoom =
              item.isPaid &&
              !isCancelled &&
              !isCompleted &&
              (isActive || isWithinTimeWindow || Boolean(item.meetingUrl));

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800 text-base">
                      {item.doctorName || "Bác sĩ Chuyên khoa"}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {item.durationMinutes} phút
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isCancelled
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : isCompleted
                          ? "bg-slate-200 text-slate-700"
                          : item.isPaid
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isCancelled
                        ? "Đã hủy"
                        : isCompleted
                        ? "Đã hoàn thành"
                        : item.isPaid
                        ? "Đã thanh toán 100%"
                        : "Chờ thanh toán"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Thời gian hẹn: <strong className="text-slate-700">{dateStr}</strong>
                  </p>

                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 italic max-w-xl">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                  {/* Nút Xem Chi Tiết cho TẤT CẢ trạng thái */}
                  <button
                    type="button"
                    onClick={() => setSelectedForDetail(item)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>Xem Chi Tiết</span>
                  </button>

                  {canJoinRoom ? (
                    <button
                      onClick={() => setSelectedForVideoRoom(item)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all animate-pulse flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Vào Video Call
                    </button>
                  ) : isScheduled ? (
                    <div className="flex items-center gap-2">
                      {!item.isPaid ? (
                        <button
                          onClick={() => setSelectedForPayment(item)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            />
                          </svg>
                          Thanh Toán QR
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3.5 py-2 bg-slate-100 text-slate-500 font-semibold rounded-xl text-xs border border-slate-200 cursor-not-allowed"
                        >
                          Mở phòng trước 5p ({formatCountdownText(fiveMinsBefore - now)})
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelClick(item)}
                        disabled={cancellingId === item.id}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        {cancellingId === item.id ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xem Chi Tiết Đơn */}
      {selectedForDetail && (
        <ConsultationDetailModal
          consultation={selectedForDetail}
          onClose={() => setSelectedForDetail(null)}
          onOpenRefundModal={() => setSelectedForRefund(selectedForDetail)}
          onOpenPaymentModal={() => setSelectedForPayment(selectedForDetail)}
          onOpenVideoRoomModal={() => setSelectedForVideoRoom(selectedForDetail)}
        />
      )}

      {selectedForPayment && (
        <ConsultationPaymentModal
          consultation={selectedForPayment}
          onClose={() => setSelectedForPayment(null)}
          onPaymentSuccess={() => void refetch()}
        />
      )}

      {selectedForVideoRoom && (
        <VideoConsultationRoomModal
          consultation={selectedForVideoRoom}
          onClose={() => setSelectedForVideoRoom(null)}
        />
      )}

      {selectedForRefund && (
        <RefundRequestModal
          consultation={selectedForRefund}
          onClose={() => setSelectedForRefund(null)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
}
