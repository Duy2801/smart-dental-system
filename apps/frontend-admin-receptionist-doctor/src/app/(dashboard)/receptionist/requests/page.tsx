"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, MagnifyingGlass, SpinnerGap, XCircle } from "@phosphor-icons/react";
import { Header } from "@/src/components/layout/header";
import { useAppDialog } from "@/src/providers/app-dialog-provider";
import apiClient from "@/src/lib/api/client";

type RefundStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
type RefundRequest = {
  id: string;
  refundCode: string;
  status: RefundStatus;
  createdAt: string;
  requestedAmount: number | string;
  refundPercent: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  reason?: string | null;
  rejectReason?: string | null;
  patient: { patientCode?: string; user: { fullName: string; phone?: string } };
  appointment?: { service?: { name?: string } } | null;
  videoConsultation?: unknown;
};

const statusLabel: Record<RefundStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Đã hoàn tiền",
  REJECTED: "Đã từ chối",
};

const formatMoney = (value: number | string) =>
  `${Number(value).toLocaleString("vi-VN")} ₫`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));

export default function ReceptionistRequestsPage() {
  const { showAlert, showConfirm } = useAppDialog();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RefundStatus>("ALL");
  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get<RefundRequest[]>("/refund-requests");
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch {
      setRequests([]);
      setError("Không tải được danh sách yêu cầu hoàn tiền. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests();
  }, [loadRequests]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    return requests.filter((request) => {
      if (status !== "ALL" && request.status !== status) return false;
      if (!needle) return true;
      return [request.refundCode, request.patient.user.fullName, request.patient.patientCode]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("vi").includes(needle));
    });
  }, [query, requests, status]);

  const closeAction = () => {
    setAction(null);
    setRejectReason("");
    setProofImageUrl(undefined);
  };

  const processRequest = async () => {
    if (!selected || !action) return;
    if (action === "reject" && !rejectReason.trim()) {
      await showAlert({ title: "Thiếu lý do", description: "Vui lòng nhập lý do từ chối.", tone: "info" });
      return;
    }
    const approved = await showConfirm({
      title: action === "approve" ? "Xác nhận hoàn tiền" : "Xác nhận từ chối",
      description: action === "approve"
        ? `Xác nhận đã chuyển ${formatMoney(selected.requestedAmount)} cho bệnh nhân?`
        : `Từ chối yêu cầu ${selected.refundCode}?`,
      confirmLabel: action === "approve" ? "Xác nhận hoàn tiền" : "Xác nhận từ chối",
      tone: action === "approve" ? "success" : "danger",
    });
    if (!approved) return;

    setSubmitting(true);
    try {
      await apiClient.patch(`/refund-requests/${selected.id}/process`, action === "approve"
        ? { status: "COMPLETED", proofImageUrl }
        : { status: "REJECTED", rejectReason: rejectReason.trim(), proofImageUrl });
      closeAction();
      setSelected(null);
      await loadRequests();
      await showAlert({ title: "Đã cập nhật", description: action === "approve" ? "Đã ghi nhận hoàn tiền." : "Đã từ chối yêu cầu.", tone: "success" });
    } catch {
      await showAlert({ title: "Không thể cập nhật", description: "Yêu cầu có thể đã được xử lý hoặc dữ liệu không còn hợp lệ.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const readProof = (file?: File) => {
    if (!file) return setProofImageUrl(undefined);
    if (file.size > 5 * 1024 * 1024) {
      void showAlert({ title: "Tệp quá lớn", description: "Ảnh minh chứng không được vượt quá 5 MB.", tone: "info" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofImageUrl(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Yêu cầu hoàn tiền" description="Theo dõi và xử lý các yêu cầu hoàn phí thực tế" />
      <main className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Tìm yêu cầu</span>
            <MagnifyingGlass className="absolute left-3 top-3 text-slate-400" size={20} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã yêu cầu, bệnh nhân..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" />
          </label>
          <select aria-label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {loading && <div className="flex justify-center p-12"><SpinnerGap className="animate-spin text-blue-600" size={30} /></div>}
        {!loading && error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error} <button onClick={loadRequests} className="ml-2 underline">Thử lại</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">Không có yêu cầu hoàn tiền</div>}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {filtered.map((request) => (
                <button key={request.id} type="button" onClick={() => setSelected(request)} aria-label={`Xem ${request.refundCode} của ${request.patient.user.fullName}`} className="grid w-full gap-3 p-4 text-left transition hover:bg-slate-50 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div><div className="font-semibold text-slate-900">{request.patient.user.fullName}</div><div className="text-sm text-slate-500">{request.refundCode} · {request.patient.patientCode || "Chưa có mã BN"}</div></div>
                  <div className="sm:text-right"><div className="font-semibold text-slate-900">{formatMoney(request.requestedAmount)}</div><div className="text-xs text-slate-500">{formatDate(request.createdAt)}</div></div>
                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{statusLabel[request.status]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {selected && !action && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation" onMouseDown={() => setSelected(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="refund-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3"><div><h2 id="refund-title" className="text-xl font-bold text-slate-900">{selected.refundCode}</h2><p className="text-sm text-slate-500">{statusLabel[selected.status]}</p></div><button aria-label="Đóng" onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100">×</button></div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Bệnh nhân</dt><dd className="font-medium">{selected.patient.user.fullName}</dd></div>
              <div><dt className="text-slate-500">Số tiền</dt><dd className="font-semibold text-blue-700">{formatMoney(selected.requestedAmount)}</dd></div>
              <div><dt className="text-slate-500">Ngân hàng</dt><dd>{selected.bankName}</dd></div>
              <div><dt className="text-slate-500">Số tài khoản</dt><dd>{selected.accountNumber}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Chủ tài khoản</dt><dd>{selected.accountHolder}</dd></div>
              {selected.reason && <div className="col-span-2"><dt className="text-slate-500">Lý do</dt><dd>{selected.reason}</dd></div>}
              {selected.rejectReason && <div className="col-span-2"><dt className="text-slate-500">Lý do từ chối</dt><dd className="text-red-700">{selected.rejectReason}</dd></div>}
            </dl>
            {(selected.status === "PENDING" || selected.status === "PROCESSING") && <div className="mt-6 flex justify-end gap-2"><button onClick={() => setAction("reject")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-red-700"><XCircle />Từ chối</button><button onClick={() => setAction("approve")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"><CheckCircle />Duyệt hoàn tiền</button></div>}
          </section>
        </div>
      )}

      {selected && action && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="action-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="action-title" className="text-lg font-bold">{action === "approve" ? "Xác nhận hoàn tiền" : "Từ chối yêu cầu"}</h2>
            <p className="mt-2 text-sm text-slate-600">{selected.refundCode} · {formatMoney(selected.requestedAmount)}</p>
            {action === "reject" && <textarea aria-label="Lý do từ chối" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Nhập lý do từ chối" maxLength={1000} className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 p-3" />}
            {action === "approve" && <label className="mt-4 block text-sm text-slate-700">Ảnh minh chứng chuyển khoản (không bắt buộc)<input type="file" accept="image/*" onChange={(event) => readProof(event.target.files?.[0])} className="mt-2 block w-full text-sm" /></label>}
            <div className="mt-6 flex justify-end gap-2"><button disabled={submitting} onClick={closeAction} className="rounded-xl border border-slate-200 px-4 py-2">Hủy</button><button disabled={submitting} onClick={processRequest} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white ${action === "approve" ? "bg-blue-600" : "bg-red-600"}`}>{submitting && <SpinnerGap className="animate-spin" />} {action === "approve" ? "Xác nhận hoàn tiền" : "Xác nhận từ chối"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
