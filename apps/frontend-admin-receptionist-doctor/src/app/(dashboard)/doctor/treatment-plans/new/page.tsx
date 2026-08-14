"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  Plus,
  Trash,
  Check,
  ArrowUp,
  ArrowDown,
  SpinnerGap,
  Warning,
  CheckCircle,
  Lightning,
  Sparkle,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";

type Patient = {
  id: string;
  patientCode: string;
  fullName: string;
};

type Step = {
  key: number;
  title: string;
  targetTooth: string;
  estimatedCost: string;
  expectedDate: string;
  description: string;
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

function NewTreatmentPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initPatientId = searchParams.get("patientId") ?? "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(initPatientId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { key: 1, title: "", targetTooth: "", estimatedCost: "", expectedDate: "", description: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const doctorId = getUserInfo().doctorId;

  useEffect(() => {
    if (!doctorId) return;
    apiClient
      .get<Patient[]>(`/patients?doctorId=${doctorId}`)
      .then((res) => setPatients(res.data))
      .catch(() => setError("Không thể tải danh sách bệnh nhân."));
  }, [doctorId]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { key: Date.now(), title: "", targetTooth: "", estimatedCost: "", expectedDate: "", description: "" },
    ]);
  };

  const removeStep = (key: number) => {
    if (steps.length > 1) {
      setSteps((prev) => prev.filter((s) => s.key !== key));
    }
  };

  const updateStep = (key: number, field: keyof Omit<Step, "key">, value: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)),
    );
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

  const handleAiDraft = async () => {
    if (!patientId) {
      setError("Chọn bệnh nhân trước khi dùng Nháp AI.");
      return;
    }
    setAiLoading(true);
    setError(null);
    setAiNote(null);
    try {
      const res = await apiClient.post<{
        title: string | null;
        description: string | null;
        startDate: string | null;
        expectedEndDate: string | null;
        steps: Array<{
          title: string;
          description: string | null;
          targetTooth: string | null;
          estimatedCost: number | null;
          expectedDate: string | null;
          durationHint: string | null;
        }>;
        disclaimer: string;
      }>(
        "/ai/doctor/draft-treatment-plan",
        {
          patientId,
          doctorNotesHint: title.trim() || description.trim() || undefined,
        },
        { timeout: 60_000 },
      );
      const draftSteps = res.data.steps ?? [];
      if (draftSteps.length === 0) {
        setError("AI chưa gợi ý được bước điều trị. Thử lại hoặc nhập tay.");
        return;
      }
      if (res.data.title?.trim()) setTitle(res.data.title.trim());
      if (res.data.description?.trim()) setDescription(res.data.description.trim());
      if (res.data.startDate) setStartDate(res.data.startDate.slice(0, 10));
      if (res.data.expectedEndDate) {
        setExpectedEndDate(res.data.expectedEndDate.slice(0, 10));
      }
      setSteps(
        draftSteps.map((s, i) => {
          const hint = s.durationHint?.trim();
          const desc = [s.description?.trim(), hint ? `Thời lượng: ${hint}` : ""]
            .filter(Boolean)
            .join("\n");
          return {
            key: Date.now() + i,
            title: s.title ?? "",
            targetTooth: s.targetTooth ?? "",
            estimatedCost:
              s.estimatedCost != null && !Number.isNaN(Number(s.estimatedCost))
                ? String(s.estimatedCost)
                : "",
            expectedDate: s.expectedDate
              ? String(s.expectedDate).slice(0, 10)
              : "",
            description: desc,
          };
        }),
      );
      setAiNote(
        res.data.disclaimer ||
          "Bản nháp AI. Chỉnh sửa rồi bấm Lưu kế hoạch.",
      );
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;
      setError(
        typeof msg === "string" && msg.trim()
          ? msg
          : "Không tạo được nháp kế hoạch. Kiểm tra AI service.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      return;
    }
    if (!patientId) {
      setError("Vui lòng chọn bệnh nhân.");
      return;
    }
    if (!title.trim()) {
      setError("Vui lòng nhập tên kế hoạch.");
      return;
    }
    if (startDate && expectedEndDate && startDate > expectedEndDate) {
      setError("Ngày kết thúc dự kiến phải sau ngày bắt đầu.");
      return;
    }
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) {
      setError("Vui lòng thêm ít nhất một bước điều trị.");
      return;
    }
    const badCost = validSteps.find(
      (s) => s.estimatedCost && Number(s.estimatedCost) < 0,
    );
    if (badCost) {
      setError("Chi phí ước tính không được âm.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/treatment-plans?doctorId=${doctorId}`, {
        patientId,
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
      setTimeout(() => router.push("/doctor/treatment-plans"), 1500);
    } catch {
      setError("Tạo kế hoạch thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 space-y-4">
          <Link
            href="/doctor/treatment-plans"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">
                Lập kế hoạch điều trị
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Xây dựng lộ trình các bước điều trị theo trình tự.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={aiLoading || submitting || success || !patientId}
                className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-light/50 px-4 py-2.5 text-sm font-medium text-brand-dark transition-all hover:bg-brand-light disabled:opacity-60"
              >
                {aiLoading ? (
                  <SpinnerGap size={15} className="animate-spin" />
                ) : (
                  <Sparkle size={15} weight="fill" />
                )}
                {aiLoading ? "Đang soạn…" : "Nháp AI"}
              </button>
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
                <Lightning size={15} weight="fill" />
              )}
              {success ? "Đã tạo!" : submitting ? "Đang lưu..." : "Lưu kế hoạch"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {aiNote && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {aiNote}
          </div>
        )}

        <div className="space-y-8">
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

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">
                  Bệnh nhân <span className="text-red-500">*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm font-medium text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} - {p.patientCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Ngày kết thúc dự kiến
                </label>
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">
                  Mô tả tổng quát
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch niềng răng mắc cài kim loại, dự kiến nhổ 4 răng..."
                  className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border bg-slate-50/50 p-6">
              <h2 className="text-base font-semibold text-brand-dark">
                2. Trình xây dựng giai đoạn
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lập danh sách các bước điều trị theo trình tự thời gian.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="relative ml-3 space-y-8 border-l-2 border-muted pb-4 md:ml-4">
                {steps.map((step, index) => (
                  <div key={step.key} className="group relative pl-8">
                    <div className="absolute -left-[11px] top-4 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-white">
                      <Check size={11} className="text-transparent" weight="bold" />
                    </div>

                    <div className="rounded-xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand/30 hover:shadow-md">
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
                              index === 0 ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100",
                            )}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === steps.length - 1}
                            className={cn(
                              "rounded p-1 text-muted-foreground transition-opacity hover:bg-muted",
                              index === steps.length - 1 ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100",
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
                          <label className="text-xs font-semibold text-slate-900">
                            Vị trí răng
                          </label>
                          <input
                            type="text"
                            value={step.targetTooth}
                            onChange={(e) => updateStep(step.key, "targetTooth", e.target.value)}
                            placeholder="R46, R47"
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 font-mono text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-xs font-semibold text-slate-900">
                            Ngày dự kiến
                          </label>
                          <input
                            type="date"
                            value={step.expectedDate}
                            onChange={(e) => updateStep(step.key, "expectedDate", e.target.value)}
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-6">
                          <label className="text-xs font-semibold text-slate-900">
                            Mô tả bước
                          </label>
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => updateStep(step.key, "description", e.target.value)}
                            placeholder="Mô tả ngắn..."
                            className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-6">
                          <label className="text-xs font-semibold text-slate-900">
                            Chi phí ước tính (VNĐ)
                          </label>
                          <input
                            type="number"
                            min={0}
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
        </div>
      </div>
    </div>
  );
}

export default function NewTreatmentPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      }
    >
      <NewTreatmentPlanContent />
    </Suspense>
  );
}
