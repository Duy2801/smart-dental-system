"use client";

import { useState } from "react";
import {
  useCancelConsultationMutation,
  useMyConsultationsQuery,
} from "../hooks/useConsultationQueries";

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

  const handleCancelBooking = async (id: string) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy đơn tư vấn này?\n\nChính sách hoàn tiền:\n- >24 tiếng: Hoàn 100%\n- 4 - 24 tiếng: Hoàn 50%\n- <4 tiếng: Không hoàn tiền",
      )
    ) {
      return;
    }

    setCancellingId(id);
    setCancelNotice(null);

    try {
      const res = await cancelMutation.mutateAsync(id);
      setCancelNotice(
        `Đã hủy thành công! ${res.refundInfo.note} Số tiền hoàn dự kiến: ${new Intl.NumberFormat(
          "vi-VN",
          { style: "currency", currency: "VND" },
        ).format(res.refundInfo.refundAmount)}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Hủy không thành công.";
      alert(msg);
    } finally {
      setCancellingId(null);
    }
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
        <div className="py-12 text-center text-slate-400">
          Đang tải danh sách lịch tư vấn...
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
            const dateStr = new Intl.DateTimeFormat("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(dateObj);

            const isActive = item.status === "IN_PROGRESS";
            const isScheduled = item.status === "SCHEDULED";
            const isCancelled = item.status === "CANCELLED";
            const isCompleted = item.status === "COMPLETED";

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-base">
                      {item.doctorName || "Bác sĩ Chuyên khoa"}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {item.durationMinutes} phút
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isCancelled
                          ? "bg-rose-100 text-rose-700"
                          : isCompleted
                          ? "bg-slate-200 text-slate-700"
                          : item.isPaid
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
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
                    <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {isActive && item.meetingUrl ? (
                    <a
                      href={item.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all text-center animate-pulse"
                    >
                      Vào Phòng Video Call
                    </a>
                  ) : isScheduled ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        disabled
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 text-slate-500 font-semibold rounded-xl text-xs cursor-not-allowed"
                      >
                        Mở phòng trước 5 phút
                      </button>
                      <button
                        onClick={() => handleCancelBooking(item.id)}
                        disabled={cancellingId === item.id}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-semibold rounded-xl text-xs transition-all"
                      >
                        {cancellingId === item.id ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      {isCompleted ? "Đã kết thúc" : "Đã hủy đơn"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
