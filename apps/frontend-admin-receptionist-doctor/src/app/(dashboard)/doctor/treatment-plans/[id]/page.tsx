"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  PencilSimple,
  SpinnerGap,
  Warning,
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  ClockCountdown,
  CurrencyCircleDollar,
  Tooth,
  CalendarBlank,
  CaretDown,
  ArrowUpRight,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type PlanStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type StepStatus = "PLANNED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const planStatusMap: Record<PlanStatus, { label: string; color: string; dot: string }> = {
  PLANNED: { label: "Chưa bắt đầu", color: "bg-slate-100 text-slate-600 ring-slate-600/20", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "Đang tiến hành", color: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-50 text-green-700 ring-green-600/20", dot: "bg-green-500" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-400" },
};

const stepStatusMap: Record<StepStatus, { label: string; icon: React.ReactNode; ring: string; bg: string; text: string }> = {
  PLANNED: {
    label: "Chưa bắt đầu",
    icon: <Circle size={18} className="text-slate-400" />,
    ring: "ring-slate-200", bg: "bg-slate-50", text: "text-slate-600",
  },
  SCHEDULED: {
    label: "Đã lên lịch",
    icon: <ClockCountdown size={18} className="text-blue-400" />,
    ring: "ring-blue-200", bg: "bg-blue-50", text: "text-blue-700",
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    icon: <Clock size={18} className="text-amber-500" />,
    ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-700",
  },
  COMPLETED: {
    label: "Hoàn thành",
    icon: <CheckCircle size={18} weight="fill" className="text-green-500" />,
    ring: "ring-green-200", bg: "bg-green-50", text: "text-green-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    icon: <XCircle size={18} weight="fill" className="text-red-400" />,
    ring: "ring-red-200", bg: "bg-red-50", text: "text-red-600",
  },
};

// Thứ tự chuyển trạng thái cho phép
const STEP_STATUS_FLOW: StepStatus[] = ["PLANNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

type PlanStep = {
  id: string;
  stepOrder: number;
  title: string;
  description: string | null;
  targetTooth: string | null;
  status: StepStatus;
  estimatedCost: number | null;
  expectedDate: string | null;
  completedAt: string | null;
};

type PlanDetail = {
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
  steps: PlanStep[];
  createdAt: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatCurrency(n: number | null) {
  if (n == null) return null;
  return n.toLocaleString("vi-VN") + " đ";
}

const PLAN_STATUSES: PlanStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function TreatmentPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // inline status select for plan
  const [planStatusChanging, setPlanStatusChanging] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // per-step status loading
  const [stepLoading, setStepLoading] = useState<Record<string, boolean>>({});

  // expanded step detail
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<PlanDetail>(`/treatment-plans/${id}`)
      .then((res) => setPlan(res.data))
      .catch(() => setFetchError("Không thể tải thông tin kế hoạch điều trị."))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlanStatusChange = async (newStatus: PlanStatus) => {
    if (!plan || newStatus === plan.status) return;
    setPlanStatusChanging(true);
    setActionError(null);
    try {
      const res = await apiClient.patch<PlanDetail>(`/treatment-plans/${id}`, {
        status: newStatus,
      });
      setPlan(res.data);
    } catch {
      setActionError("Không thể cập nhật trạng thái kế hoạch.");
    } finally {
      setPlanStatusChanging(false);
    }
  };

  const handleStepStatus = async (step: PlanStep, newStatus: StepStatus) => {
    if (!plan || newStatus === step.status) return;
    setStepLoading((prev) => ({ ...prev, [step.id]: true }));
    setActionError(null);
    try {
      const res = await apiClient.patch<PlanStep>(
        `/treatment-plans/${id}/steps/${step.id}`,
        { status: newStatus },
      );
      // Cập nhật plan local
      setPlan((prev) => {
        if (!prev) return prev;
        const newSteps = prev.steps.map((s) =>
          s.id === step.id ? { ...s, ...res.data } : s,
        );
        const completed = newSteps.filter((s) => s.status === "COMPLETED").length;
        const total = newSteps.length;
        return {
          ...prev,
          steps: newSteps,
          completedSteps: completed,
          progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });
    } catch {
      setActionError("Không thể cập nhật trạng thái bước điều trị.");
    } finally {
      setStepLoading((prev) => ({ ...prev, [step.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (fetchError || !plan) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} className="shrink-0" />
          {fetchError ?? "Không tìm thấy kế hoạch điều trị."}
        </div>
        <Link
          href="/doctor/treatment-plans"
          className="mt-4 inline-flex items-center gap-2 text-sm text-brand hover:underline"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const ps = planStatusMap[plan.status] ?? planStatusMap.PLANNED;

  return (
    <div className="bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/doctor/treatment-plans"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Kế hoạch điều trị
          </Link>
        </div>

        {actionError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {actionError}
          </div>
        )}

        {/* Header card */}
        <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="font-mono text-xs text-muted-foreground">
                #{plan.id.slice(-8).toUpperCase()}
              </span>
              <h1 className="mt-1 text-2xl font-bold text-brand-dark">{plan.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link
                  href={`/doctor/patients/${plan.patientId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:underline"
                >
                  {plan.patientName}
                  <ArrowUpRight size={12} />
                </Link>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {plan.patientCode}
                </span>
              </div>
              {plan.description && (
                <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => router.push(`/doctor/treatment-plans/${id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <PencilSimple size={14} />
                Sửa
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bắt đầu</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(plan.startDate)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dự kiến xong</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(plan.expectedEndDate)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tiến độ</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {plan.completedSteps}/{plan.totalSteps} bước ({plan.progressPercent}%)
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</p>
              <div className="mt-1 relative">
                <select
                  value={plan.status}
                  onChange={(e) => handlePlanStatusChange(e.target.value as PlanStatus)}
                  disabled={planStatusChanging}
                  className={cn(
                    "w-full appearance-none rounded-lg py-1 pl-2 pr-6 text-xs font-semibold ring-1 ring-inset outline-none transition-colors",
                    ps.color,
                    "disabled:opacity-70",
                  )}
                >
                  {PLAN_STATUSES.map((s) => (
                    <option key={s} value={s}>{planStatusMap[s].label}</option>
                  ))}
                </select>
                {planStatusChanging ? (
                  <SpinnerGap size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 animate-spin" />
                ) : (
                  <CaretDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60" />
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {plan.totalSteps > 0 && (
            <div className="mt-5">
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    plan.progressPercent === 100 ? "bg-green-500" : "bg-brand",
                  )}
                  style={{ width: `${plan.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Steps timeline */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-slate-50/40 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-brand-dark">Các bước điều trị</h2>
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
              {plan.steps.length} bước
            </span>
          </div>

          {plan.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">Kế hoạch chưa có bước nào.</p>
              <button
                onClick={() => router.push(`/doctor/treatment-plans/${id}/edit`)}
                className="mt-3 text-sm text-brand hover:underline"
              >
                Thêm bước ngay
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {plan.steps.map((step) => {
                const ss = stepStatusMap[step.status] ?? stepStatusMap.PLANNED;
                const isExpanded = expandedStep === step.id;
                const isLoading = stepLoading[step.id];

                return (
                  <div key={step.id} className="group">
                    {/* Step header */}
                    <div
                      className="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/60"
                      onClick={() => setExpandedStep((p) => p === step.id ? null : step.id)}
                    >
                      {/* Step icon */}
                      <div className="shrink-0">
                        {isLoading ? (
                          <SpinnerGap size={18} className="animate-spin text-brand" />
                        ) : (
                          ss.icon
                        )}
                      </div>

                      {/* Step info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                            B{step.stepOrder}
                          </span>
                          <p className="truncate font-medium text-slate-900">{step.title}</p>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {step.targetTooth && (
                            <span className="flex items-center gap-1">
                              <Tooth size={11} />
                              {step.targetTooth}
                            </span>
                          )}
                          {step.expectedDate && (
                            <span className="flex items-center gap-1">
                              <CalendarBlank size={11} />
                              {formatDate(step.expectedDate)}
                            </span>
                          )}
                          {step.estimatedCost != null && (
                            <span className="flex items-center gap-1">
                              <CurrencyCircleDollar size={11} />
                              {formatCurrency(step.estimatedCost)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status select */}
                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={step.status}
                          disabled={isLoading}
                          onChange={(e) =>
                            handleStepStatus(step, e.target.value as StepStatus)
                          }
                          className={cn(
                            "appearance-none rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset outline-none transition-colors cursor-pointer",
                            ss.bg, ss.text, ss.ring,
                            "disabled:opacity-60",
                          )}
                        >
                          {STEP_STATUS_FLOW.map((s) => (
                            <option key={s} value={s}>{stepStatusMap[s].label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Expand caret */}
                      <CaretDown
                        size={14}
                        className={cn(
                          "shrink-0 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-border/40 bg-slate-50/40 px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                          {step.description && (
                            <div className="sm:col-span-2 lg:col-span-4">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mô tả</p>
                              <p className="mt-1 text-slate-700">{step.description}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vị trí răng</p>
                            <p className="mt-1 font-mono font-semibold text-slate-800">{step.targetTooth ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chi phí ước tính</p>
                            <p className="mt-1 font-semibold text-slate-800">{formatCurrency(step.estimatedCost) ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ngày dự kiến</p>
                            <p className="mt-1 text-slate-700">{formatDate(step.expectedDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hoàn thành lúc</p>
                            <p className="mt-1 text-slate-700">{formatDate(step.completedAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Tạo lúc {formatDate(plan.createdAt)}
        </p>
      </div>
    </div>
  );
}
