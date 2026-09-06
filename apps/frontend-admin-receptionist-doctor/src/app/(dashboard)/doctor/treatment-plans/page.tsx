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
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  CaretDown,
  CurrencyCircleDollar,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { getDoctorInfoFromCookie } from "@/src/lib/doctor/session";

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
  totalEstimatedCost?: number | null;
  createdAt: string;
};

function cleanSearchText(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatCurrency(n?: number | null) {
  if (n == null || n <= 0) return null;
  return n.toLocaleString("vi-VN") + " đ";
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

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const doc = getDoctorInfoFromCookie();
    if (doc?.doctorId) {
      setDoctorId(doc.doctorId);
    } else {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
    }
  }, []);

  const loadPlans = () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    apiClient
      .get<Plan[]>(`/treatment-plans?doctorId=${doctorId}`)
      .then((res) => setPlans(res.data))
      .catch((err: any) => {
        const msg = err.response?.data?.message || "Không thể tải danh sách kế hoạch điều trị.";
        setError(Array.isArray(msg) ? msg[0] : msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (doctorId) {
      loadPlans();
    }
  }, [doctorId]);

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

  const filtered = useMemo(() => {
    let data = plans;
    if (search.trim()) {
      const q = cleanSearchText(search.trim());
      data = data.filter(
        (p) =>
          cleanSearchText(p.title).includes(q) ||
          cleanSearchText(p.patientName).includes(q) ||
          cleanSearchText(p.patientCode).includes(q) ||
          (p.description ? cleanSearchText(p.description).includes(q) : false),
      );
    }
    if (filterStatus) {
      data = data.filter((p) => p.status === filterStatus);
    }
    return data;
  }, [plans, search, filterStatus]);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/treatment-plans/${deleteTarget.id}`);
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setToast({
        message: `✓ Đã xóa kế hoạch điều trị "${deleteTarget.title}"`,
        type: "success",
      });
      setTimeout(() => setToast(null), 4000);
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Xóa kế hoạch thất bại. Vui lòng thử lại.";
      setToast({
        message: Array.isArray(msg) ? msg[0] : msg,
        type: "error",
      });
      setTimeout(() => setToast(null), 4000);
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
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <div className="flex items-center gap-2.5">
              <Warning size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            {doctorId && (
              <button
                onClick={loadPlans}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 underline hover:text-red-900 cursor-pointer"
              >
                <ArrowClockwise size={13} />
                Thử lại
              </button>
            )}
          </div>
        )}

        {/* Search + filter bar */}
        {!loading && !error && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên kế hoạch, bệnh nhân, mã BN..."
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-brand cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-56 sm:shrink-0">
              <Funnel
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PlanStatus | "")}
                className={cn(
                  "w-full appearance-none rounded-xl border border-border bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer",
                  filterStatus && "border-brand/40 bg-brand-50/20 font-medium text-brand-dark"
                )}
              >
                <option value="">Tất cả trạng thái</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusMap[s].label}
                  </option>
                ))}
              </select>
              {filterStatus ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFilterStatus("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-100 hover:text-red-600 z-10 cursor-pointer"
                  title="Bỏ chọn trạng thái"
                >
                  <X size={13} weight="bold" />
                </button>
              ) : (
                <CaretDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
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
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <p>
                Hiển thị{" "}
                <strong className="text-brand-dark">{paginatedPlans.length}</strong> /{" "}
                {filtered.length} kế hoạch
                {filtered.length !== plans.length && ` (lọc từ ${plans.length})`}
              </p>
              {hasFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-brand hover:underline cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {paginatedPlans.map((plan) => {
                const pct = plan.progressPercent;
                const s = statusMap[plan.status] ?? statusMap.PLANNED;
                return (
                  <div
                    key={plan.id}
                    className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                  >
                    {/* Action buttons */}
                    <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/doctor/treatment-plans/${plan.id}/edit`)
                        }
                        title="Sửa kế hoạch"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-brand/10 hover:text-brand cursor-pointer"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(plan)}
                        title="Xóa kế hoạch"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash size={14} />
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

                    {/* Status badge & Cost badge */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                          s.color,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                      {plan.totalEstimatedCost != null && plan.totalEstimatedCost > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CurrencyCircleDollar size={13} weight="bold" />
                          {formatCurrency(plan.totalEstimatedCost)}
                        </span>
                      )}
                    </div>

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
                            type="button"
                            onClick={() => handleSendEmail(plan)}
                            disabled={sendingId === plan.id}
                            title="Gửi phác đồ điều trị và dự toán chi phí qua email cho bệnh nhân"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 cursor-pointer"
                          >
                            <PaperPlaneTilt
                              size={12}
                              weight="bold"
                              className={sendingId === plan.id ? "animate-spin" : ""}
                            />
                            <span>{sendingId === plan.id ? "Đang gửi..." : "Gửi email"}</span>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Trang <span className="font-semibold text-brand-dark">{page}</span> /{" "}
                  <span className="font-semibold text-brand-dark">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <CaretLeft size={14} /> Trước
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Sau <CaretRight size={14} />
                  </button>
                </div>
              </div>
            )}
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
