"use client";

import { useEffect, useState } from "react";
import {
  ChatCircleDots,
  CheckCircle,
  Info,
  Sparkle,
  WarningCircle,
  ThumbsUp,
  XCircle,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";

type PatientAiSummary = {
  id: string;
  patientId: string;
  patientName: string;
  bulletPoints: string[];
  questionsToAsk: string[];
  riskFlags: string[];
  disclaimer: string;
  createdAt: string;
  createdByName: string;
  sources: Array<{ key: string; label: string; available: boolean }>;
  provider: string | null;
  model: string | null;
  feedback: "HELPFUL" | "INACCURATE" | "MISSED_RISK" | null;
  feedbackNote: string | null;
};

type PatientAiBriefProps = {
  patientId?: string | null;
  consultationId?: string | null;
  patientName?: string;
  className?: string;
  compact?: boolean;
};

export function PatientAiBrief({
  patientId,
  consultationId,
  patientName,
  className,
  compact = false,
}: PatientAiBriefProps) {
  const canSummarize = Boolean(patientId || consultationId);
  const [summary, setSummary] = useState<PatientAiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(canSummarize);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<
    "INACCURATE" | "MISSED_RISK" | null
  >(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    if (!canSummarize) return;

    let cancelled = false;
    void apiClient
      .get<PatientAiSummary | null>("/ai/doctor/summarize-patient/latest", {
        params: consultationId ? { consultationId } : { patientId },
      })
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải hồ sơ AI đã lưu.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canSummarize, consultationId, patientId]);

  async function summarize() {
    if (!canSummarize) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<PatientAiSummary>(
        "/ai/doctor/summarize-patient",
        consultationId ? { consultationId } : { patientId },
        { timeout: 60_000 },
      );
      setSummary({
        ...res.data,
        bulletPoints: res.data.bulletPoints ?? [],
        questionsToAsk: res.data.questionsToAsk ?? [],
        riskFlags: res.data.riskFlags ?? [],
      });
    } catch {
      setError("Không thể tạo hồ sơ AI. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function review(
    feedback: "HELPFUL" | "INACCURATE" | "MISSED_RISK",
    note?: string,
  ) {
    if (!summary || reviewing) return;
    setReviewing(true);
    setError(null);
    try {
      const res = await apiClient.patch<PatientAiSummary>(
        `/ai/doctor/patient-brief/${summary.id}/review`,
        { feedback, note: note?.trim() || undefined },
      );
      setSummary(res.data);
      setPendingFeedback(null);
      setReviewNote("");
    } catch {
      setError("Không thể lưu đánh giá. Vui lòng thử lại.");
    } finally {
      setReviewing(false);
    }
  }

  const sections = summary
    ? [
        {
          label: "Tóm tắt lâm sàng",
          items: summary.bulletPoints,
          icon: CheckCircle,
          color: "text-brand",
          border: "border-brand/40",
        },
        {
          label: "Câu hỏi cần hỏi",
          items: summary.questionsToAsk,
          icon: ChatCircleDots,
          color: "text-brand-dark",
          border: "border-border",
        },
        {
          label: "Cờ rủi ro",
          items: summary.riskFlags,
          icon: WarningCircle,
          color: "text-amber-700",
          border: "border-amber-300",
        },
      ].filter((section) => section.items.length > 0)
    : [];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white",
        className,
      )}
      aria-label="Hồ sơ AI trước ca khám"
    >
      <div
        className={cn(
          "flex flex-col gap-3 p-4",
          !compact && "sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <Sparkle size={18} weight="fill" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-brand-dark">
              Hồ sơ AI trước ca khám
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {summary?.patientName || patientName
                ? `Tổng hợp dữ liệu của ${summary?.patientName || patientName}.`
                : "Tổng hợp bệnh án, thuốc, kế hoạch và lịch tái khám."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={summarize}
          disabled={loading || loadingSaved || !canSummarize}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
            !compact && "sm:self-auto",
          )}
        >
          <Sparkle size={13} weight="fill" />
          {loadingSaved
            ? "Đang tải..."
            : loading
              ? "Đang tổng hợp..."
              : error
                ? "Thử lại"
                : summary
                  ? "Tạo lại"
                  : "Tạo hồ sơ AI"}
        </button>
      </div>

      <div aria-live="polite">
        {(loading || loadingSaved) && (
          <div
            className="space-y-3 border-t border-border p-4"
            aria-label="Đang tạo hồ sơ AI"
          >
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        )}

        {!loading && !loadingSaved && error && (
          <div className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <WarningCircle
              size={16}
              className="mt-0.5 shrink-0"
              weight="fill"
            />
            <p>{error}</p>
          </div>
        )}

        {!loading && !loadingSaved && summary && (
          <div className="space-y-4 border-t border-border p-4">
            <p className="text-[11px] text-muted-foreground">
              Tạo bởi{" "}
              <span className="font-semibold text-slate-600">
                {summary.createdByName}
              </span>
              {" · "}
              <time dateTime={summary.createdAt}>
                {new Date(summary.createdAt).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </time>
            </p>
            {summary.sources?.some((source) => source.available) && (
              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-600">
                  Dữ liệu đã đối chiếu
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.sources
                    .filter((source) => source.available)
                    .map((source) => (
                      <span
                        key={source.key}
                        className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                      >
                        {source.label}
                      </span>
                    ))}
                </div>
                {(summary.provider || summary.model) && (
                  <p className="mt-2 font-mono text-[10px] text-slate-400">
                    {summary.provider || "AI"}
                    {summary.model ? ` · ${summary.model}` : ""}
                  </p>
                )}
              </div>
            )}
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có đủ dữ liệu lâm sàng để tạo hồ sơ trước khám.
              </p>
            ) : (
              sections.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.label}
                    className={cn("border-l-2 pl-3", section.border)}
                  >
                    <p
                      className={cn(
                        "mb-2 text-xs font-semibold",
                        section.color,
                      )}
                    >
                      {section.label}
                    </p>
                    <ul className="space-y-2">
                      {section.items.map((item, index) => (
                        <li
                          key={`${section.label}-${index}`}
                          className="flex items-start gap-2 text-sm leading-relaxed text-slate-700"
                        >
                          <Icon
                            size={15}
                            className={cn("mt-0.5 shrink-0", section.color)}
                            weight="duotone"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}

            <p className="flex items-start gap-2 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                {summary.disclaimer ||
                  "AI chỉ hỗ trợ tổng hợp thông tin. Bác sĩ cần kiểm tra dữ liệu trước khi đưa ra quyết định lâm sàng."}
              </span>
            </p>
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-semibold text-slate-600">
                Kết quả này có chính xác và hữu ích không?
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    value: "HELPFUL" as const,
                    label: "Hữu ích",
                    icon: ThumbsUp,
                  },
                  {
                    value: "INACCURATE" as const,
                    label: "Không chính xác",
                    icon: XCircle,
                  },
                  {
                    value: "MISSED_RISK" as const,
                    label: "Bỏ sót rủi ro",
                    icon: WarningCircle,
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const active = summary.feedback === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={reviewing}
                      onClick={() => {
                        if (option.value === "HELPFUL") {
                          void review(option.value);
                          return;
                        }
                        setPendingFeedback(option.value);
                        setReviewNote(
                          summary.feedback === option.value
                            ? summary.feedbackNote || ""
                            : "",
                        );
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-colors disabled:opacity-50",
                        active
                          ? "border-brand bg-brand-light text-brand-dark"
                          : "border-border text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <Icon size={13} weight={active ? "fill" : "regular"} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {pendingFeedback && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <label
                    htmlFor={`ai-brief-note-${summary.id}`}
                    className="mb-1.5 block text-[11px] font-semibold text-slate-700"
                  >
                    {pendingFeedback === "MISSED_RISK"
                      ? "AI đã bỏ sót rủi ro nào?"
                      : "Thông tin nào chưa chính xác?"}
                  </label>
                  <textarea
                    id={`ai-brief-note-${summary.id}`}
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    autoFocus
                    placeholder="Mô tả ngắn để cải thiện kết quả AI..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFeedback(null);
                        setReviewNote("");
                      }}
                      className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={reviewing || !reviewNote.trim()}
                      onClick={() => void review(pendingFeedback, reviewNote)}
                      className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reviewing ? "Đang lưu..." : "Lưu phản hồi"}
                    </button>
                  </div>
                </div>
              )}
              {summary.feedbackNote && (
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  Ghi chú: {summary.feedbackNote}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
