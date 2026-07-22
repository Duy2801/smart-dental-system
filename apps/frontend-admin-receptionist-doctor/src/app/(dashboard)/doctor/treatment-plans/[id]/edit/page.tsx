"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  FloppyDisk,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  SpinnerGap,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type StepStatus = "PLANNED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

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
  status: string;
  patientName: string;
  patientCode: string;
  startDate: string | null;
  expectedEndDate: string | null;
  steps: PlanStep[];
};

type StepForm = {
  key: number;
  title: string;
  description: string;
  targetTooth: string;
  estimatedCost: string;
  expectedDate: string;
};

function toInputDate(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function EditTreatmentPlanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Plan fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [patientLabel, setPatientLabel] = useState("");

  // Steps
  const [steps, setSteps] = useState<StepForm[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiClient
      .get<PlanDetail>(`/treatment-plans/${id}`)
      .then((res) => {
        const p = res.data;
        setTitle(p.title);
        setDescription(p.description ?? "");
        setStartDate(toInputDate(p.startDate));
        setExpectedEndDate(toInputDate(p.expectedEndDate));
        setPatientLabel(`${p.patientName} — ${p.patientCode}`);
        setSteps(
          p.steps.map((s, i) => ({
            key: i + 1,
            title: s.title,
            description: s.description ?? "",
            targetTooth: s.targetTooth ?? "",
            estimatedCost: s.estimatedCost != null ? String(s.estimatedCost) : "",
            expectedDate: toInputDate(s.expectedDate),
          })),
        );
      })
      .catch(() => setFetchError("Không thể tải thông tin kế hoạch."))
      .finally(() => setLoading(false));
  }, [id]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { key: Date.now(), title: "", description: "", targetTooth: "", estimatedCost: "", expectedDate: "" },
    ]);
  };

  const removeStep = (key: number) => {
    if (steps.length > 1) setSteps((prev) => prev.filter((s) => s.key !== key));
  };

  const updateStep = (key: number, field: keyof Omit<StepForm, "key">, value: string) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === steps.length - 1) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setSaveError("Vui lòng nhập tên kế hoạch."); return; }
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) { setSaveError("Vui lòng thêm ít nhất một bước điều trị."); return; }
    setSubmitting(true);
    setSaveError(null);
    try {
      await apiClient.patch(`/treatment-plans/${id}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        expectedEndDate: expectedEndDate || undefined,
        steps: validSteps.map((s) => ({
          title: s.title.trim(),
          description: s.description.trim() || undefined,
          targetTooth: s.targetTooth.trim() || undefined,
          estimatedCost: s.estimatedCost ? Number(s.estimatedCost) : undefined,
          expectedDate: s.expectedDate || undefined,
        })),
      });
      setSuccess(true);
      setTimeout(() => router.push(`/doctor/treatment-plans/${id}`), 1400);
    } catch {
      setSaveError("Lưu kế hoạch thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} className="shrink-0" />
          {fetchError}
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

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Breadcrumb + title */}
        <div className="mb-6 space-y-4">
          <Link
            href={`/doctor/treatment-plans/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Quay lại chi tiết
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">Sửa kế hoạch điều trị</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bệnh nhân: <strong>{patientLabel}</strong>
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || success}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <SpinnerGap size={15} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={15} weight="fill" />
              ) : (
                <FloppyDisk size={15} weight="bold" />
              )}
              {success ? "Đã lưu!" : submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {saveError}
          </div>
        )}

        <div className="space-y-8">

          {/* 1. Thông tin tổng quát */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-base font-semibold text-brand-dark">
              1. Thông tin tổng quát
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">
                  Tên kế hoạch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Niềng răng mắc cài kim loại..."
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm font-medium text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">Ngày kết thúc dự kiến</label>
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Mô tả tổng quát</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch niềng răng mắc cài kim loại..."
                  className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* 2. Steps builder */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border bg-slate-50/50 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-brand-dark">2. Các bước điều trị</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lưu thay đổi sẽ tạo lại tất cả các bước (trạng thái bước sẽ được đặt về PLANNED).
                </p>
              </div>
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                {steps.filter((s) => s.title.trim()).length} bước
              </span>
            </div>

            <div className="p-6 md:p-8">
              <div className="relative ml-3 space-y-8 border-l-2 border-muted pb-4 md:ml-4">
                {steps.map((step, index) => (
                  <div key={step.key} className="group relative pl-8">
                    {/* Timeline dot */}
                    <div className="absolute -left-2.75 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-white">
                      <span className="text-[9px] font-bold text-white">{index + 1}</span>
                    </div>

                    <div className="rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
                      {/* Step header */}
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark">
                          Bước {index + 1}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className={cn(
                              "rounded p-1 text-muted-foreground transition-opacity hover:bg-muted",
                              index === 0 ? "pointer-events-none opacity-0" : "opacity-0 group-hover:opacity-100",
                            )}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === steps.length - 1}
                            className={cn(
                              "rounded p-1 text-muted-foreground transition-opacity hover:bg-muted",
                              index === steps.length - 1 ? "pointer-events-none opacity-0" : "opacity-0 group-hover:opacity-100",
                            )}
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => removeStep(step.key)}
                            disabled={steps.length === 1}
                            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 disabled:hidden"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-12">
                        <div className="space-y-1.5 md:col-span-6">
                          <label className="text-xs font-semibold text-slate-900">
                            Tên bước <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(step.key, "title", e.target.value)}
                            placeholder="Ví dụ: Cắm trụ Implant"
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-xs font-semibold text-slate-900">Vị trí răng</label>
                          <input
                            type="text"
                            value={step.targetTooth}
                            onChange={(e) => updateStep(step.key, "targetTooth", e.target.value)}
                            placeholder="R46, R47"
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 font-mono text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-xs font-semibold text-slate-900">Ngày dự kiến</label>
                          <input
                            type="date"
                            value={step.expectedDate}
                            onChange={(e) => updateStep(step.key, "expectedDate", e.target.value)}
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-6">
                          <label className="text-xs font-semibold text-slate-900">Mô tả bước</label>
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => updateStep(step.key, "description", e.target.value)}
                            placeholder="Mô tả ngắn..."
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-6">
                          <label className="text-xs font-semibold text-slate-900">Chi phí ước tính (VNĐ)</label>
                          <input
                            type="number"
                            value={step.estimatedCost}
                            onChange={(e) => updateStep(step.key, "estimatedCost", e.target.value)}
                            placeholder="5000000"
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="relative pl-8 pt-2">
                  <button
                    onClick={addStep}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-all hover:border-brand hover:bg-brand/5 hover:text-brand active:scale-[0.99]"
                  >
                    <Plus size={18} weight="bold" />
                    Thêm bước điều trị mới
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-4 shadow-sm">
            <Link
              href={`/doctor/treatment-plans/${id}`}
              className="text-sm text-muted-foreground hover:text-brand"
            >
              Hủy thay đổi
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting || success}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <SpinnerGap size={15} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={15} weight="fill" />
              ) : (
                <FloppyDisk size={15} weight="bold" />
              )}
              {success ? "Đã lưu!" : submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
