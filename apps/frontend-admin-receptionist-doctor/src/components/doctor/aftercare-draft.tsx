"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  FirstAid,
  PaperPlaneTilt,
  Sparkle,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";
import { useAppDialog } from "@/src/providers/app-dialog-provider";

type AftercareResponse = {
  instructions: string[];
  warningSigns: string[];
  medicationSchedule: string[];
  followUp: string | null;
  draftText: string;
  disclaimer: string;
};

type AftercareDraftProps = {
  medicalRecordId: string;
};

function apiError(err: unknown, fallback: string) {
  if (!axios.isAxiosError(err)) return fallback;
  const message = err.response?.data?.message;
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }
  return typeof message === "string" && message.trim() ? message : fallback;
}

function GuidanceGroup({
  title,
  items,
  tone = "brand",
}: {
  title: string;
  items: string[];
  tone?: "brand" | "warning";
}) {
  if (!items.length) return null;
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-xl border border-amber-200 bg-amber-50 p-4"
          : "rounded-xl border border-border bg-muted p-4"
      }
    >
      <p
        className={
          tone === "warning"
            ? "text-xs font-bold text-amber-900"
            : "text-xs font-bold text-brand-dark"
        }
      >
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={
              tone === "warning"
                ? "flex gap-2 text-xs leading-relaxed text-amber-900"
                : "flex gap-2 text-xs leading-relaxed text-foreground"
            }
          >
            <Check size={13} className="mt-0.5 shrink-0" weight="bold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AftercareDraft({ medicalRecordId }: AftercareDraftProps) {
  const { showConfirm } = useAppDialog();
  const [draft, setDraft] = useState<AftercareResponse | null>(null);
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    setSent(false);
    try {
      const res = await apiClient.post<AftercareResponse>(
        "/ai/doctor/generate-aftercare",
        { medicalRecordId },
        { timeout: 60_000 },
      );
      setDraft(res.data);
      setContent((res.data.draftText ?? "").slice(0, 12_000));
    } catch (err) {
      setError(apiError(err, "Không thể tạo hướng dẫn sau điều trị."));
    } finally {
      setGenerating(false);
    }
  }

  async function copyDraft() {
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

  async function send() {
    if (!content.trim() || sending || sent) return;
    const confirmed = await showConfirm({
      title: "Gửi hướng dẫn sau điều trị?",
      description: "Nội dung bạn đã duyệt sẽ được gửi cho bệnh nhân.",
      confirmLabel: "Gửi hướng dẫn",
    });
    if (!confirmed) return;
    setSending(true);
    setError(null);
    try {
      await apiClient.post(
        "/ai/doctor/send-aftercare",
        { medicalRecordId, content: content.trim() },
        { timeout: 60_000 },
      );
      setSent(true);
    } catch (err) {
      setError(apiError(err, "Không thể gửi hướng dẫn cho bệnh nhân."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5" aria-live="polite">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-brand-dark">
            <FirstAid size={20} weight="duotone" />
            Hướng dẫn sau điều trị
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI soạn từ bệnh án và phác đồ đã lưu. Bác sĩ chỉnh sửa trước khi
            gửi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={generating}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
        >
          {generating ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <Sparkle size={14} weight="fill" />
          )}
          {generating ? "Đang tạo" : draft ? "Tạo lại" : "Tạo hướng dẫn"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <Warning size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {!draft && !generating && (
        <div className="rounded-xl border border-dashed border-border bg-muted px-5 py-10 text-center">
          <FirstAid size={32} className="mx-auto text-brand" weight="duotone" />
          <p className="mt-2 text-sm font-semibold text-brand-dark">
            Chưa có bản hướng dẫn
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lưu bệnh án và đơn thuốc trước khi tạo nội dung cho bệnh nhân.
          </p>
        </div>
      )}

      {draft && (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <GuidanceGroup
              title="Chăm sóc tại nhà"
              items={draft.instructions}
            />
            <GuidanceGroup
              title="Lịch dùng thuốc"
              items={draft.medicationSchedule}
            />
            <GuidanceGroup
              title="Dấu hiệu cần liên hệ sớm"
              items={draft.warningSigns}
              tone="warning"
            />
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold text-brand-dark">Tái khám</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {draft.followUp || "Chưa có lịch tái khám trong hồ sơ."}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="aftercare-content"
              className="text-xs font-bold text-brand-dark"
            >
              Nội dung gửi bệnh nhân
            </label>
            <textarea
              id="aftercare-content"
              rows={10}
              maxLength={12_000}
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setSent(false);
              }}
              className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {draft.disclaimer ||
                "Bác sĩ chịu trách nhiệm kiểm tra nội dung trước khi gửi."}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void copyDraft()}
                disabled={!content.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-brand-dark hover:border-brand disabled:opacity-50"
              >
                {copied ? (
                  <Check size={14} weight="bold" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
              <button
                type="button"
                onClick={() => void send()}
                disabled={!content.trim() || sending || sent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
              >
                {sending ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : sent ? (
                  <Check size={14} weight="bold" />
                ) : (
                  <PaperPlaneTilt size={14} weight="fill" />
                )}
                {sending ? "Đang gửi" : sent ? "Đã gửi" : "Duyệt và gửi"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
