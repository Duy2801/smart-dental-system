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
} from "@phosphor-icons/react";
import { Header } from "@/src/components/layout/header";
import { ROUTES } from "@/src/constants/routes";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";

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

function getUserInfo(): { doctorId: string | null } {
  if (typeof document === "undefined") return { doctorId: null };
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return { doctorId: null };
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return { doctorId: null };
  }
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
  const doctorId = getUserInfo().doctorId;
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(!!doctorId);
  const [error, setError] = useState<string | null>(
    !doctorId ? "Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại." : null,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!q) return true;
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.patientCode.toLowerCase().includes(q)
      );
    });
  }, [items, filter, search]);

  const handleCancel = async (id: string, patientName: string) => {
    if (!confirm(`Hủy buổi tư vấn với ${patientName}?`)) return;
    setCancellingId(id);
    try {
      await apiClient.patch(`/video-consultations/${id}/cancel`);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "CANCELLED" as const } : item,
        ),
      );
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể hủy buổi tư vấn."));
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
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
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
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
            <ul className="divide-y divide-border/60">
              {filtered.map((item) => {
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
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(item.id, item.patientName)}
                          disabled={cancellingId === item.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
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
          )}
        </div>
      </div>
    </>
  );
}
