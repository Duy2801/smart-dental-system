"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import {
  Plus,
  ArrowUpRight,
  ClipboardText,
  SpinnerGap,
  Warning,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  Funnel,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type PlanStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const statusMap: Record<PlanStatus, { label: string; color: string; dot: string }> = {
  PLANNED: {
    label: "Chưa bắt đầu",
    color: "bg-slate-100 text-slate-600 ring-slate-600/20",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "Đang tiến hành",
    color: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "bg-green-50 text-green-700 ring-green-600/20",
    dot: "bg-green-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-400",
  },
};

const ALL_STATUSES: PlanStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

type Plan = {
  id: string;
  title: string;
  description: string | null;
  status: PlanStatus;
  patientId: string;
  patientName: string;
  patientCode: string;
  startDate: string | null;
  expectedEndDate: string | null;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  createdAt: string;
};

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

function formatDate(iso: string | null) {
  if (!iso) return "?";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function DeleteModal({
  plan,
  onConfirm,
  onCancel,
  deleting,
}: {
  plan: Plan;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark">Xóa kế hoạch điều trị?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Kế hoạch <strong>"{plan.title}"</strong> của bệnh nhân{" "}
              <strong>{plan.patientName}</strong> sẽ bị xóa vĩnh viễn cùng tất
              cả các bước điều trị.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <SpinnerGap size={14} className="animate-spin" />}
            Xóa kế hoạch
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TreatmentPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PlanStatus | "">("");

  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const doctorId = getUserInfo().doctorId;

  const handleSendEmail = async (plan: Plan) => {
    setSendingId(plan.id);
    try {
      await apiClient.post(`/treatment-plans/${plan.id}/send-email`);
      setToast({
        message: `✓ Đã gửi Phác đồ điều trị & Dự toán chi phí qua Gmail cho ${plan.patientName}!`,
        type: "success",
      });
      setTimeout(() => setToast(null), 4500);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Không thể gửi email phác đồ điều trị.";
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
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }
    apiClient
      .get<Plan[]>(`/treatment-plans?doctorId=${doctorId}`)
      .then((res) => setPlans(res.data))
      .catch(() => setError("Không thể tải danh sách kế hoạch điều trị."))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const filtered = useMemo(() => {
    let data = plans;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.patientName.toLowerCase().includes(q) ||
          p.patientCode.toLowerCase().includes(q),
      );
    }
    if (filterStatus) {
      data = data.filter((p) => p.status === filterStatus);
    }
    return data;
  }, [plans, search, filterStatus]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/treatment-plans/${deleteTarget.id}`);
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Xóa kế hoạch thất bại. Vui lòng thử lại.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => { setSearch(""); setFilterStatus(""); };
  const hasFilter = search.trim() || filterStatus;

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          plan={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <Header
        title="Kế hoạch điều trị"
        description="Theo dõi lộ trình và tiến độ điều trị của bệnh nhân"
      >
        <Link
          href="/doctor/treatment-plans/new"
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          Tạo kế hoạch mới
        </Link>
      </Header>

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Search + filter bar */}
        {!loading && !error && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên kế hoạch, bệnh nhân, mã BN..."
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Funnel size={15} className="shrink-0 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PlanStatus | "")}
                className="rounded-xl border border-border bg-white py-2.5 pl-3 pr-7 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="">Tất cả trạng thái</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusMap[s].label}</option>
                ))}
              </select>
              {hasFilter && (
                <button
                  onClick={clearFilters}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  title="Xóa bộ lọc"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
            <SpinnerGap size={28} className="animate-spin text-brand" />
          </div>
        ) : !error && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
            <ClipboardText size={48} className="mb-4 text-slate-300" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              {plans.length === 0
                ? "Chưa có kế hoạch điều trị nào"
                : "Không tìm thấy kế hoạch phù hợp"}
            </p>
            {plans.length === 0 ? (
              <Link
                href="/doctor/treatment-plans/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Tạo kế hoạch mới
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-brand hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : !error ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Hiển thị{" "}
              <strong className="text-brand-dark">{filtered.length}</strong> /{" "}
              {plans.length} kế hoạch
            </p>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((plan) => {
                const pct = plan.progressPercent;
                const s = statusMap[plan.status] ?? statusMap.PLANNED;
                return (
                  <div
                    key={plan.id}
                    className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                  >
                    {/* Action buttons */}
                    <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleSendEmail(plan)}
                        disabled={sendingId === plan.id}
                        title="Gửi Phác đồ điều trị & Dự toán chi phí qua Gmail cho bệnh nhân"
                        className="flex h-7 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                      >
                        <PaperPlaneTilt
                          size={12}
                          weight="bold"
                          className={sendingId === plan.id ? "animate-spin" : ""}
                        />
                        {sendingId === plan.id ? "Đang gửi..." : "Gửi Gmail"}
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/doctor/treatment-plans/${plan.id}/edit`)
                        }
                        title="Sửa kế hoạch"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand cursor-pointer"
                      >
                        <PencilSimple size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(plan)}
                        title="Xóa kế hoạch"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash size={13} />
                      </button>
                    </div>

                    <div className="mb-4 flex items-start justify-between pr-14">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{plan.id.slice(-6).toUpperCase()}
                        </span>
                        <h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">
                          {plan.title}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Link
                            href={`/doctor/patients/${plan.patientId}`}
                            className="text-sm text-muted-foreground transition-colors hover:text-brand"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {plan.patientName}
                          </Link>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {plan.patientCode}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        "mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                        s.color,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </span>

                    <div className="mt-auto space-y-4">
                      {plan.totalSteps > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tiến độ</span>
                            <span className="font-semibold text-brand-dark">
                              {plan.completedSteps}/{plan.totalSteps} bước ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                pct === 100 ? "bg-green-500" : "bg-brand",
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
                        <span>
                          {formatDate(plan.startDate)} → {formatDate(plan.expectedEndDate)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSendEmail(plan)}
                            disabled={sendingId === plan.id}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <PaperPlaneTilt size={11} weight="bold" />
                            Gửi email
                          </button>
                          <Link
                            href={`/doctor/treatment-plans/${plan.id}`}
                            className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                          >
                            Chi tiết <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

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
