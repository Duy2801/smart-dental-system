"use client";

import { useState } from "react";
import {
  ChatCircleDots,
  CheckCircle,
  Info,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";

type PatientAiSummary = {
  patientId: string;
  patientName: string;
  bulletPoints: string[];
  questionsToAsk: string[];
  riskFlags: string[];
  disclaimer: string;
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
  const [summary, setSummary] = useState<PatientAiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSummarize = Boolean(patientId || consultationId);

  async function summarize() {
    if (!canSummarize) return;

    setLoading(true);
    setError(null);
    setSummary(null);
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
          disabled={loading || !canSummarize}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
            !compact && "sm:self-auto",
          )}
        >
          <Sparkle size={13} weight="fill" />
          {loading
            ? "Đang tổng hợp..."
            : error
              ? "Thử lại"
              : summary
                ? "Tạo lại"
                : "Tạo hồ sơ AI"}
        </button>
      </div>

      <div aria-live="polite">
        {loading && (
          <div
            className="space-y-3 border-t border-border p-4"
            aria-label="Đang tạo hồ sơ AI"
          >
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <WarningCircle
              size={16}
              className="mt-0.5 shrink-0"
              weight="fill"
            />
            <p>{error}</p>
          </div>
        )}

        {!loading && summary && (
          <div className="space-y-4 border-t border-border p-4">
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
          </div>
        )}
      </div>
    </section>
  );
}
