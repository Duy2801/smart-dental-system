"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  CurrencyCircleDollar,
  Sparkle,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";

type PlanExplanation = {
  overview: string;
  steps: Array<{
    title: string;
    explanation: string;
    estimatedCost: number | null;
    durationHint: string | null;
  }>;
  importantNotes: string[];
  totalEstimatedCost: number | null;
  timeline: string | null;
  draftText: string;
  disclaimer: string;
};

function formatCurrency(value: number | null) {
  return value == null ? null : `${value.toLocaleString("vi-VN")} đ`;
}

function apiError(err: unknown) {
  if (!axios.isAxiosError(err)) return "Không thể tạo bản giải thích.";
  const message = err.response?.data?.message;
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }
  return typeof message === "string" && message.trim()
    ? message
    : "Không thể tạo bản giải thích. Vui lòng thử lại.";
}

export function TreatmentPlanExplanation({ planId }: { planId: string }) {
  const [result, setResult] = useState<PlanExplanation | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<PlanExplanation>(
        "/ai/doctor/explain-treatment-plan",
        { treatmentPlanId: planId },
        { timeout: 60_000 },
      );
      setResult(res.data);
      setContent(res.data.draftText ?? "");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Không thể sao chép. Vui lòng chọn và sao chép nội dung thủ công.",
      );
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-brand-light/40 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold text-brand-dark">
            <Sparkle size={18} weight="fill" className="text-brand" />
            Giải thích kế hoạch cho bệnh nhân
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sử dụng các bước, giá và thời lượng đang lưu trong hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <Sparkle size={14} weight="fill" />
          )}
          {loading ? "Đang giải thích" : result ? "Tạo lại" : "Tạo giải thích"}
        </button>
      </div>

      <div className="p-6" aria-live="polite">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <Warning size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {!result && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Tạo một bản giải thích ngắn gọn để bác sĩ dùng khi trao đổi với bệnh
            nhân.
          </p>
        )}

        {result && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-bold text-brand-dark">Tổng quan</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {result.overview}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:min-w-72">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Tổng chi phí dự kiến
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-bold text-brand-dark">
                    <CurrencyCircleDollar size={15} />
                    {formatCurrency(result.totalEstimatedCost) ||
                      "Chưa xác định"}
                  </p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Thời gian dự kiến
                  </p>
                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {result.timeline || "Chưa xác định"}
                  </p>
                </div>
              </div>
            </div>

            {result.steps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-brand-dark">
                  Các bước được giải thích
                </p>
                <div className="space-y-2">
                  {result.steps.map((step, index) => (
                    <div
                      key={`${step.title}-${index}`}
                      className="grid gap-2 rounded-xl border border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {step.explanation}
                        </p>
                      </div>
                      <div className="flex items-start gap-3 text-xs text-brand-dark md:flex-col md:items-end md:gap-1">
                        {step.estimatedCost != null && (
                          <span className="font-semibold">
                            {formatCurrency(step.estimatedCost)}
                          </span>
                        )}
                        {step.durationHint && <span>{step.durationHint}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.importantNotes.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-900">
                  Điểm cần lưu ý
                </p>
                <ul className="mt-2 space-y-1.5">
                  {result.importantNotes.map((note) => (
                    <li
                      key={note}
                      className="flex gap-2 text-xs text-amber-900"
                    >
                      <Warning size={13} className="mt-0.5 shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="treatment-plan-explanation"
                className="text-xs font-bold text-brand-dark"
              >
                Bản giải thích để bác sĩ duyệt
              </label>
              <textarea
                id="treatment-plan-explanation"
                rows={9}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {result.disclaimer ||
                  "Chi phí và thời gian cần được bác sĩ xác nhận với bệnh nhân."}
              </p>
              <button
                type="button"
                onClick={() => void copy()}
                disabled={!content.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand/30 bg-white px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-light disabled:opacity-50"
              >
                {copied ? (
                  <Check size={14} weight="bold" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Đã sao chép" : "Sao chép bản giải thích"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
