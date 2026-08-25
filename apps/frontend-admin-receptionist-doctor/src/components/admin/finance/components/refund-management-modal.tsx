"use client";

import { useEffect, useRef, useState } from "react";
import apiClient from "@/src/lib/api/client";
import { formatVND } from "../finance-utils";

interface RefundRequestItem {
  id: string;
  refundCode: string;
  patientId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeUrl?: string | null;
  requestedAmount: number;
  refundPercent: number;
  reason?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  rejectReason?: string | null;
  proofImageUrl?: string | null;
  createdAt: string;
  patient?: {
    patientCode?: string;
    user?: {
      fullName?: string;
      phone?: string;
      email?: string;
    };
  };
  videoConsultation?: {
    scheduledAt?: string;
    fee?: number;
    doctor?: {
      user?: {
        fullName?: string;
      };
    };
  };
  processor?: {
    fullName?: string;
  };
}

interface RefundManagementModalProps {
  onClose: () => void;
}

export function RefundManagementModal({ onClose }: RefundManagementModalProps) {
  const [requests, setRequests] = useState<RefundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [processingItem, setProcessingItem] = useState<RefundRequestItem | null>(null);
  const [actionType, setActionType] = useState<"COMPLETE" | "REJECT">("COMPLETE");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const proofFileInputRef = useRef<HTMLInputElement>(null);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<RefundRequestItem[]>("/refund-requests");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch refund requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRefundRequests();
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Dung lượng tệp ảnh không được vượt quá 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingItem) return;

    if (actionType === "REJECT" && !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối hoàn tiền.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.patch(`/refund-requests/${processingItem.id}/process`, {
        status: actionType === "COMPLETE" ? "COMPLETED" : "REJECTED",
        proofImageUrl: proofImageUrl.trim() || undefined,
        rejectReason: rejectReason.trim() || undefined,
      });

      alert(
        actionType === "COMPLETE"
          ? "Đã xác nhận chuyển khoản hoàn tiền thành công!"
          : "Đã từ chối yêu cầu hoàn tiền."
      );
      setProcessingItem(null);
      setProofImageUrl("");
      setRejectReason("");
      void fetchRefundRequests();
    } catch (err) {
      alert("Xử lý thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Header - Cố định top */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Quản Lý Yêu Cầu Hoàn Tiền (Lễ Tân / Kế Toán)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm tra thông tin tài khoản bệnh nhân và xác nhận chuyển khoản hoàn tiền khi hủy đơn.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center transition-colors text-sm shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0 overflow-x-auto">
          {["ALL", "PENDING", "COMPLETED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL"
                ? "Tất cả"
                : st === "PENDING"
                ? "Chờ chuyển khoản (PENDING)"
                : st === "COMPLETED"
                ? "Đã chuyển khoản (COMPLETED)"
                : "Đã từ chối (REJECTED)"}
            </button>
          ))}
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Đang tải danh sách yêu cầu hoàn tiền...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              Không có yêu cầu hoàn tiền nào trong danh sách.
            </div>
          ) : (
            filtered.map((item) => {
              const isPending = item.status === "PENDING";
              const isCompleted = item.status === "COMPLETED";
              const isRejected = item.status === "REJECTED";

              // Build VietQR Quick Link for Receptionist scanning
              const qrScanUrl = `https://img.vietqr.io/image/${item.bankName.split(" ")[0]}-${item.accountNumber}-compact.png?amount=${item.requestedAmount}&addInfo=${item.refundCode}&accountName=${encodeURIComponent(item.accountHolder)}`;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-sm">
                        {item.refundCode}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {item.patient?.user?.fullName || "Bệnh nhân"} ({item.patient?.user?.phone || "—"})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Ngày tạo: {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">Hoàn lại ({item.refundPercent}%):</p>
                        <p className="text-base font-extrabold text-rose-600 font-mono">
                          {formatVND(Number(item.requestedAmount))}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isPending
                            ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {isPending
                          ? "Chờ Lễ tân chuyển khoản"
                          : isCompleted
                          ? "Đã chuyển khoản xong"
                          : "Đã từ chối"}
                      </span>
                    </div>
                  </div>

                  {/* Body Info & QR */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Bank Info */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Thông tin tài khoản nhận tiền
                      </p>
                      <p>
                        Ngân hàng: <strong>{item.bankName}</strong>
                      </p>
                      <p>
                        Số TK: <strong className="font-mono text-blue-600 text-sm">{item.accountNumber}</strong>
                      </p>
                      <p>
                        Chủ TK: <strong className="uppercase">{item.accountHolder}</strong>
                      </p>
                      {item.reason && (
                        <p className="text-slate-500 italic mt-1 pt-1 border-t border-slate-100">
                          "Lý do: {item.reason}"
                        </p>
                      )}
                    </div>

                    {/* QR Code Quick Scan */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center gap-3">
                      <img
                        src={item.qrCodeUrl || qrScanUrl}
                        alt="Mã QR Chuyển tiền"
                        className="w-24 h-24 object-contain rounded-lg border p-1 bg-white shadow-xs"
                      />
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-[11px]">Quét mã VietQR</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Dùng App Ngân hàng quét để nhận diện STK + Tên + Số tiền tự động 100%.
                        </p>
                      </div>
                    </div>

                    {/* Actions / Proof */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Trạng thái & Chứng từ
                        </p>
                        {isCompleted && (
                          <div className="mt-1 space-y-1 text-slate-600">
                            <p className="text-emerald-700 font-semibold">✓ Đã xác nhận hoàn tiền</p>
                            {item.processor?.fullName && (
                              <p className="text-[11px]">Người duyệt: {item.processor.fullName}</p>
                            )}
                            {item.proofImageUrl && (
                              <a
                                href={item.proofImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline font-semibold text-[11px]"
                              >
                                Xem ảnh Bill chuyển khoản
                              </a>
                            )}
                          </div>
                        )}

                        {isRejected && (
                          <div className="mt-1 text-rose-700 font-semibold space-y-1">
                            <p>✕ Đã từ chối yêu cầu</p>
                            {item.rejectReason && <p className="text-[11px] font-normal">Lý do: {item.rejectReason}</p>}
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setProcessingItem(item);
                              setActionType("COMPLETE");
                            }}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all text-center shadow-xs cursor-pointer"
                          >
                            Xác Nhận Đã Chuyển
                          </button>
                          <button
                            onClick={() => {
                              setProcessingItem(item);
                              setActionType("REJECT");
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Từ Chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Process Confirmation Sub-Modal */}
        {processingItem && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === "COMPLETE"
                  ? `Xác nhận đã chuyển tiền cho đơn ${processingItem.refundCode}`
                  : `Từ chối yêu cầu hoàn tiền ${processingItem.refundCode}`}
              </h3>

              <p className="text-xs text-slate-600">
                Số tiền: <strong>{formatVND(Number(processingItem.requestedAmount))}</strong> | Ngân hàng:{" "}
                <strong>{processingItem.bankName} - {processingItem.accountNumber}</strong> ({processingItem.accountHolder})
              </p>

              <form onSubmit={handleProcessSubmit} className="space-y-3 text-xs">
                {actionType === "COMPLETE" ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ảnh chứng từ chuyển khoản (Bill ngân hàng)
                    </label>
                    <input
                      type="file"
                      ref={proofFileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleProofFileChange}
                      className="hidden"
                      id="proof-file-input"
                    />

                    {!proofImageUrl ? (
                      <label
                        htmlFor="proof-file-input"
                        className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-all space-y-1"
                      >
                        <span className="text-xs font-semibold text-slate-700">
                          Bấm để chọn tệp ảnh Bill chuyển khoản
                        </span>
                        <span className="text-[10px] text-slate-400">Hỗ trợ PNG, JPG, WebP (Tối đa 5MB)</span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-2 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={proofImageUrl}
                            alt="Bill Preview"
                            className="w-10 h-10 object-contain rounded border bg-white p-0.5 shrink-0"
                          />
                          <span className="text-xs font-semibold text-emerald-700 truncate">
                            ✓ Đã chọn ảnh Bill
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProofImageUrl("")}
                          className="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded"
                        >
                          Đổi ảnh
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lý do từ chối (*)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nhập lý do từ chối hoàn tiền cho bệnh nhân..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProcessingItem(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                      actionType === "COMPLETE"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {submitting ? "Đang lưu..." : "Xác Nhận"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
