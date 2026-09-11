"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle,
  Copy,
  FirstAid,
  Info,
  PaperPlaneTilt,
  Printer,
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

export type AftercareCurrentForm = {
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  followUpDate?: string;
};

type AftercareDraftProps = {
  medicalRecordId: string;
  patientName?: string;
  currentForm?: AftercareCurrentForm;
  isDirty?: boolean;
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
          : "rounded-xl border border-border bg-slate-50 p-4"
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
                : "flex gap-2 text-xs leading-relaxed text-slate-700"
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

export function AftercareDraft({
  medicalRecordId,
  patientName,
  currentForm,
  isDirty,
}: AftercareDraftProps) {
  const { showConfirm } = useAppDialog();
  const [draft, setDraft] = useState<AftercareResponse | null>(null);
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [lastSentNotification, setLastSentNotification] = useState<{
    sentAt: string | null;
    content: string;
    channel: string;
  } | null>(null);
  const [patientContact, setPatientContact] = useState<{
    hasAccount: boolean;
    email: string | null;
  } | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingInitial(true);
    apiClient
      .get<{
        latestNotification: {
          id: string;
          content: string;
          sentAt: string | null;
          channel: string;
        } | null;
        patientContact: {
          hasAccount: boolean;
          email: string | null;
        };
      }>(`/ai/doctor/latest-aftercare/${medicalRecordId}`)
      .then((res) => {
        if (cancelled) return;
        setPatientContact(res.data.patientContact);
        if (res.data.latestNotification) {
          setLastSentNotification(res.data.latestNotification);
          setContent((prev) => prev || res.data.latestNotification!.content);
        }
      })
      .catch(() => {
        // Non-critical, ignore error
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });

    return () => {
      cancelled = true;
    };
  }, [medicalRecordId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    setSentMessage(null);
    try {
      const res = await apiClient.post<AftercareResponse>(
        "/ai/doctor/generate-aftercare",
        {
          medicalRecordId,
          chiefComplaint: currentForm?.chiefComplaint,
          diagnosis: currentForm?.diagnosis,
          treatmentNotes: currentForm?.treatmentNotes,
          followUpDate: currentForm?.followUpDate,
        },
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

  function printDraft() {
    if (!content.trim()) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hướng dẫn sau điều trị - ${patientName || "Bệnh nhân"}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 20px; color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
            .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
            .content { white-space: pre-wrap; font-size: 14px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>🦷 SMART DENTAL - HƯỚNG DẪN CHĂM SÓC SAU ĐIỀU TRỊ</h1>
          <div class="meta">
            Bệnh nhân: <strong>${patientName || "Quý khách"}</strong> &bull; Ngày in: ${new Date().toLocaleDateString("vi-VN")}
          </div>
          <div class="content">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          <div class="footer">Hotline CSKH & Cấp cứu nha khoa 24/7: 1900 8888 &bull; Smart Dental Clinic</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function send() {
    if (!content.trim() || sending) return;

    let targetDesc = "Nội dung bạn đã duyệt sẽ được gửi cho bệnh nhân.";
    if (patientContact?.email) {
      targetDesc = `Nội dung sẽ được gửi qua email (${patientContact.email})${patientContact.hasAccount ? " và thông báo ứng dụng" : ""} của bệnh nhân.`;
    } else if (patientContact?.hasAccount) {
      targetDesc = "Nội dung sẽ được gửi qua thông báo ứng dụng của bệnh nhân.";
    }

    const confirmed = await showConfirm({
      title: "Gửi hướng dẫn sau điều trị?",
      description: targetDesc,
      confirmLabel: "Gửi hướng dẫn",
    });
    if (!confirmed) return;

    setSending(true);
    setError(null);
    setSentMessage(null);
    try {
      const res = await apiClient.post<{
        sent: boolean;
        message: string;
        channels: string[];
      }>(
        "/ai/doctor/send-aftercare",
        { medicalRecordId, content: content.trim() },
        { timeout: 60_000 },
      );
      setSentMessage(res.data.message || "Đã gửi hướng dẫn thành công.");
      setLastSentNotification({
        sentAt: new Date().toISOString(),
        content: content.trim(),
        channel: (res.data.channels || []).join(", "),
      });
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
            <FirstAid size={20} weight="duotone" className="text-brand" />
            Hướng dẫn sau điều trị
            {patientContact?.email && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Email: {patientContact.email}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI soạn từ hồ sơ và phác đồ đã lưu. Bác sĩ kiểm tra và tinh chỉnh
            trước khi gửi.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isDirty && (
            <span className="hidden items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 md:inline-flex">
              <Info size={13} />
              Có thay đổi lâm sàng chưa lưu
            </span>
          )}
          <button
            type="button"
            onClick={() => void generate()}
            disabled={generating}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <SpinnerGap size={14} className="animate-spin" />
            ) : (
              <Sparkle size={14} weight="fill" />
            )}
            {generating
              ? "Đang tạo..."
              : draft || content
                ? "Tạo lại với AI"
                : "Tạo hướng dẫn"}
          </button>
        </div>
      </div>

      {lastSentNotification && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-600" />
          <div className="flex-1">
            <span>
              Đã gửi hướng dẫn cho bệnh nhân vào lúc{" "}
              {new Date(lastSentNotification.sentAt || "").toLocaleString("vi-VN")}{" "}
              (kênh {lastSentNotification.channel || "Thông báo"}).
            </span>
          </div>
        </div>
      )}

      {patientContact && !patientContact.hasAccount && !patientContact.email && (
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs text-blue-900 shadow-2xs">
          <Info size={18} weight="fill" className="shrink-0 text-blue-600" />
          <span>
            Bệnh nhân này chưa có tài khoản ứng dụng hoặc email. Bác sĩ có thể bấm{" "}
            <strong>&ldquo;Sao chép&rdquo;</strong> để gửi qua Zalo/SMS hoặc bấm{" "}
            <strong>&ldquo;In ra giấy&rdquo;</strong> trao cho bệnh nhân.
          </span>
        </div>
      )}

      {sentMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check size={16} weight="bold" className="shrink-0 text-emerald-600" />
          {sentMessage}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <Warning size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!draft && !content && !generating && !loadingInitial && (
        <div className="rounded-2xl border border-dashed border-border bg-slate-50/60 px-5 py-12 text-center">
          <FirstAid size={40} className="mx-auto text-brand" weight="duotone" />
          <p className="mt-3 text-base font-bold text-slate-800">
            Chưa có bản hướng dẫn
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bấm <strong>&ldquo;Tạo hướng dẫn&rdquo;</strong> để AI tự động tổng hợp dặn dò chăm sóc, lịch uống thuốc và dấu hiệu cảnh báo.
          </p>
        </div>
      )}

      {(draft || content) && (
        <>
          {draft && (
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
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {draft.followUp || "Chưa có lịch tái khám trong hồ sơ."}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="aftercare-content"
                className="text-xs font-bold uppercase tracking-wider text-brand-dark"
              >
                Nội dung gửi bệnh nhân
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {content.length}/12.000 ký tự
              </span>
            </div>
            <textarea
              id="aftercare-content"
              rows={10}
              maxLength={12_000}
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setSentMessage(null);
              }}
              className="w-full resize-y rounded-xl border border-border bg-white p-4 font-sans text-sm leading-relaxed text-slate-800 shadow-2xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Nhập nội dung dặn dò chi tiết cho bệnh nhân..."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {draft?.disclaimer ||
                "Bác sĩ chịu trách nhiệm kiểm tra chuyên môn trước khi gửi cho bệnh nhân."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={printDraft}
                disabled={!content.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-brand hover:text-brand disabled:opacity-40 cursor-pointer"
                title="In hướng dẫn ra giấy"
              >
                <Printer size={14} />
                In ra giấy
              </button>
              <button
                type="button"
                onClick={() => void copyDraft()}
                disabled={!content.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-brand hover:text-brand disabled:opacity-40 cursor-pointer"
              >
                {copied ? (
                  <Check size={14} weight="bold" className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
              <button
                type="button"
                onClick={() => void send()}
                disabled={!content.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={14} weight="fill" />
                )}
                {sending ? "Đang gửi..." : "Duyệt và gửi"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
