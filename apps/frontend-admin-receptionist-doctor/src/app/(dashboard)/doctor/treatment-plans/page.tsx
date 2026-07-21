"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import {
  Plus,
  ArrowUpRight,
  ClipboardText,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type PlanStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const statusMap: Record<PlanStatus, { label: string; color: string }> = {
  PLANNED: {
    label: "Chưa bắt đầu",
    color: "bg-slate-100 text-slate-600 ring-slate-600/20",
  },
  IN_PROGRESS: {
    label: "Đang tiến hành",
    color: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "bg-green-50 text-green-700 ring-green-600/20",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

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

export default function TreatmentPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doctorId = getUserInfo().doctorId;

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

  return (
    <>
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

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
            <SpinnerGap size={28} className="animate-spin text-brand" />
          </div>
        ) : !error && plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
            <ClipboardText
              size={48}
              className="mb-4 text-slate-300"
              weight="duotone"
            />
            <p className="text-sm text-muted-foreground">
              Chưa có kế hoạch điều trị nào
            </p>
            <Link
              href="/doctor/treatment-plans/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Tạo kế hoạch mới
            </Link>
          </div>
        ) : !error ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const pct = plan.progressPercent;
              const s = statusMap[plan.status] ?? statusMap.PLANNED;
              return (
                <div
                  key={plan.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">
                        #{plan.id.slice(-6).toUpperCase()}
                      </span>
                      <h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">
                        {plan.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Link
                          href={`/doctor/patients/${plan.patientId}`}
                          className="text-sm text-muted-foreground hover:text-brand transition-colors"
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
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                        s.color,
                      )}
                    >
                      {s.label}
                    </span>
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
                      <Link
                        href={`/doctor/treatment-plans/${plan.id}`}
                        className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                      >
                        Chi tiết <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );
}
