"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  MagnifyingGlass,
  SpinnerGap,
  Warning,
  VideoCamera,
  Clock,
  ArrowRight,
  XCircle,
  PaperPlaneTilt,
  CheckCircle,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { Header } from "@/src/components/layout/header";
import { ROUTES } from "@/src/constants/routes";
import {
  getDoctorIdFromCookie,
  getDoctorInfoFromCookie,
} from "@/src/lib/doctor/session";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";
import { useAppDialog } from "@/src/providers/app-dialog-provider";

type ConsultStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type Consultation = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  scheduledAt: string;
  durationMinutes: number;
  status: ConsultStatus;
  fee: number;
  isPaid: boolean;
  notes: string | null;
};

type FilterKey = "today" | "upcoming" | "done" | "all";

const STATUS_CFG: Record<
  ConsultStatus,
  { label: string; color: string }
> = {
  SCHEDULED: {
    label: "Sắp tới",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  IN_PROGRESS: {
    label: "Đang diễn ra",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-600 border-red-200",
  },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "done", label: "Đã xong" },
  { key: "all", label: "Tất cả" },
];

function cleanSearchText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFee(n: number) {
  return `${n.toLocaleString("vi-VN")}đ`;
}

function matchesFilter(item: Consultation, filter: FilterKey) {
  const at = new Date(item.scheduledAt);
  const today0 = startOfDay();
  const today1 = endOfDay();

  if (filter === "all") return true;
  if (filter === "today") return at >= today0 && at <= today1;
  if (filter === "upcoming") {
    return (
      (item.status === "SCHEDULED" || item.status === "IN_PROGRESS") &&
      at >= today0
    );
  }
  return item.status === "COMPLETED" || item.status === "CANCELLED";
}

function primaryAction(item: Consultation) {
  if (item.status === "SCHEDULED") {
    return { label: "Chuẩn bị & vào phòng", href: `${ROUTES.DOCTOR.CONSULTATIONS}/${item.id}` };
  }
  if (item.status === "IN_PROGRESS") {
    return { label: "Tiếp tục gọi", href: `${ROUTES.DOCTOR.CONSULTATIONS}/${item.id}` };
  }
  return { label: "Xem lại", href: `${ROUTES.DOCTOR.CONSULTATIONS}/${item.id}` };
}

function apiErrorMessage(err: unknown, fallback: string) {
  if (!axios.isAxiosError(err)) return fallback;
  const raw = err.response?.data?.message;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

export default function DoctorConsultationsPage() {
  const { showAlert, showConfirm } = useAppDialog();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleSendReminder = async (item: Consultation) => {
    setSendingId(item.id);
    try {
      await apiClient.post(`/video-consultations/${item.id}/send-reminder`);
      setToast({
        message: `✓ Đã gửi Link phòng Video Call & Lời nhắc qua Gmail & App cho ${item.patientName}!`,
        type: "success",
      });
      setTimeout(() => setToast(null), 4500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể gửi email lời nhắc phòng tư vấn.";
      setToast({
        message: Array.isArray(msg) ? msg[0] : msg,
        type: "error",
      });
      setTimeout(() => setToast(null), 4500);
    } finally {
      setSendingId(null);
    }
  };

  useEffect(() => {
    const doctorInfo = getDoctorInfoFromCookie();
    const id = doctorInfo?.doctorId ?? getDoctorIdFromCookie();
    setDoctorId(id);
    if (!id) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
    }
    setReady(true);
  }, []);

  const load = () => {
    if (!doctorId) return;
    setLoading(true);
    apiClient
      .get<Consultation[]>(`/video-consultations?doctorId=${doctorId}`)
      .then((res) => {
        setItems(res.data ?? []);
        setError(null);
      })
      .catch((err) =>
        setError(apiErrorMessage(err, "Không thể tải danh sách tư vấn trực tuyến.")),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (doctorId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const filtered = useMemo(() => {
    const q = cleanSearchText(search);
    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!q) return true;
      return (
        cleanSearchText(item.patientName).includes(q) ||
        cleanSearchText(item.patientCode).includes(q)
      );
    });
  }, [items, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleFilterSelect = (key: FilterKey) => {
    setFilter(key);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCancel = async (id: string, patientName: string) => {
    const confirmed = await showConfirm({
      title: "Hủy buổi tư vấn?",
      description: `Buổi tư vấn với ${patientName} sẽ bị hủy và không thể hoàn tác. Tiền phí đã thanh toán sẽ được hoàn lại 100%.`,
      confirmLabel: "Hủy buổi tư vấn",
      tone: "danger",
    });
    if (!confirmed) return;
    setCancellingId(id);
    try {
      await apiClient.patch(`/video-consultations/${id}/cancel`);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "CANCELLED" as const } : item,
        ),
      );
      setToast({
        message: `Đã hủy buổi tư vấn với ${patientName} thành công.`,
        type: "success",
      });
      setTimeout(() => setToast(null), 4500);
    } catch (err) {
      await showAlert({
        title: "Không thể hủy buổi tư vấn",
        description: apiErrorMessage(err, "Không thể hủy buổi tư vấn."),
        tone: "danger",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <Header
        title="Tư vấn trực tuyến"
        description="Gọi video với bệnh nhân và xem trước hội thoại Chatbot AI."
      />

      {!ready ? (
        <div className="flex justify-center py-20">
          <SpinnerGap size={28} className="animate-spin text-brand" />
        </div>
      ) : (
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Tìm theo tên BN, mã BN..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterSelect(f.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  filter === f.key
                    ? "bg-brand text-white"
                    : "bg-white text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted/40",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <div className="flex items-center gap-3">
              <Warning size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
            >
              <ArrowClockwise size={13} weight="bold" />
              Thử lại
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-20">
              <SpinnerGap size={28} className="animate-spin text-brand" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <VideoCamera size={40} className="text-slate-300" weight="duotone" />
              <p className="text-sm font-medium text-slate-500">
                Không có buổi tư vấn nào phù hợp.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {paginatedItems.map((item) => {
                const cfg = STATUS_CFG[item.status];
                const action = primaryAction(item);
                const canCancel =
                  item.status === "SCHEDULED" || item.status === "IN_PROGRESS";
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-brand-dark">
                          {item.patientName}
                        </p>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                          {item.patientCode}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            cfg.color,
                          )}
                        >
                          {cfg.label}
                        </span>
                        {!item.isPaid && item.status !== "CANCELLED" ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            Chưa TT
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatWhen(item.scheduledAt)}
                        </span>
                        <span>{item.durationMinutes} phút</span>
                        <span>
                          {formatFee(item.fee)}
                          {item.isPaid ? " · Đã thanh toán" : " · Chưa thanh toán"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {item.status !== "CANCELLED" && item.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => handleSendReminder(item)}
                          disabled={sendingId === item.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                          title="Gửi link phòng Video Call & Lời nhắc qua Gmail + App cho bệnh nhân"
                        >
                          <PaperPlaneTilt
                            size={14}
                            weight="bold"
                            className={sendingId === item.id ? "animate-spin" : ""}
                          />
                          {sendingId === item.id ? "Đang gửi..." : "Gửi link phòng"}
                        </button>
                      )}
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(item.id, item.patientName)}
                          disabled={cancellingId === item.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                        >
                          <XCircle size={14} />
                          {cancellingId === item.id ? "Đang hủy..." : "Hủy"}
                        </button>
                      ) : null}
                      <Link
                        href={action.href}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
                      >
                        {action.label}
                        <ArrowRight size={14} weight="bold" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* PAGINATION CONTROLS */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between border-t border-border/70 px-5 py-3.5 bg-slate-50/50">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <span className="font-semibold text-slate-700">{(page - 1) * pageSize + 1}</span> -{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(page * pageSize, filtered.length)}
                  </span>{" "}
                  trên tổng số <span className="font-semibold text-slate-700">{filtered.length}</span> buổi tư vấn
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Trang trước"
                  >
                    <CaretLeft size={14} weight="bold" />
                  </button>
                  <span className="px-2.5 text-xs font-medium text-slate-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Trang sau"
                  >
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
      )}

      {/* FLOATING SUCCESS / ERROR TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-xl backdrop-blur-xs animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-[10px] ${
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
