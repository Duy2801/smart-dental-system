"use client";

import { useState } from "react";
import {
  ArrowRight,
  CaretDown,
  CaretUp,
  Check,
  NotePencil,
  Sparkle,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";
import { useAppDialog } from "@/src/providers/app-dialog-provider";

type ClinicalField = "chiefComplaint" | "diagnosis" | "treatmentNotes";

type ClinicalValues = Record<ClinicalField, string>;

type ClinicalScribeReviewProps = {
  patientId: string;
  serviceName?: string | null;
  current: ClinicalValues;
  initialNotes?: string;
  onApply: (values: Partial<ClinicalValues>) => void;
};

type DraftResponse = {
  chiefComplaint: string | null;
  diagnosisDraft: string | null;
  treatmentNotesDraft: string | null;
  disclaimer: string;
};

const fields: Array<{
  key: ClinicalField;
  label: string;
  draftKey: keyof Pick<
    DraftResponse,
    "chiefComplaint" | "diagnosisDraft" | "treatmentNotesDraft"
  >;
}> = [
  { key: "chiefComplaint", label: "Lý do khám", draftKey: "chiefComplaint" },
  { key: "diagnosis", label: "Chẩn đoán nháp", draftKey: "diagnosisDraft" },
  {
    key: "treatmentNotes",
    label: "Ghi chú điều trị",
    draftKey: "treatmentNotesDraft",
  },
];

function apiError(err: unknown) {
  if (!axios.isAxiosError(err)) return "Không thể tạo bản nháp AI.";
  if (
    err.code === "ECONNABORTED" ||
    err.message?.toLowerCase().includes("timeout")
  ) {
    return "Yêu cầu xử lý AI quá thời gian chờ (timeout). Vui lòng thử lại với ghi chú ngắn hơn hoặc thử lại sau.";
  }
  if (err.response?.status === 403) {
    return "Bạn không có quyền truy cập thông tin của bệnh nhân này.";
  }
  if (err.response?.status === 503) {
    const rawMsg = err.response?.data?.message;
    return typeof rawMsg === "string" && rawMsg.trim()
      ? rawMsg
      : "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.";
  }
  const message = err.response?.data?.message;
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }
  return typeof message === "string" && message.trim()
    ? message
    : "Không thể tạo bản nháp AI. Vui lòng thử lại.";
}

export function ClinicalScribeReview({
  patientId,
  serviceName,
  current,
  initialNotes = "",
  onApply,
}: ClinicalScribeReviewProps) {
  const { showConfirm } = useAppDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes.slice(0, 20_000));
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Yêu cầu tối thiểu 5 ký tự trong ô ghi chú nguồn
  const canGenerate = notes.trim().length >= 5;

  async function generateDraft() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    setIsOpen(true);
    try {
      const res = await apiClient.post<DraftResponse>(
        "/ai/doctor/draft-medical-record",
        {
          patientId: patientId?.trim() || undefined,
          chiefComplaint: current.chiefComplaint.trim() || undefined,
          serviceName: serviceName || undefined,
          transcript: notes.trim() || undefined,
        },
        { timeout: 90_000 },
      );
      const payload = (res as any)?.data ?? res;
      setDraft(payload);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  function suggestion(field: (typeof fields)[number]) {
    return draft?.[field.draftKey]?.trim() ?? "";
  }

  const hasSuggestions =
    draft !== null && fields.some((field) => Boolean(suggestion(field)));

  // Kiểm tra xem tất cả các trường đề xuất đã khớp với form hiện tại hay chưa
  const allApplied =
    hasSuggestions &&
    fields.every((field) => {
      const value = suggestion(field);
      return !value || value === current[field.key].trim();
    });

  async function handleApplyField(
    fieldKey: ClinicalField,
    val: string,
    fieldLabel: string,
  ) {
    const currentValue = current[fieldKey].trim();
    if (currentValue && currentValue !== val) {
      const ok = await showConfirm({
        title: "Xác nhận ghi đè nội dung",
        description: `Mục "${fieldLabel}" hiện đã có dữ liệu. Bạn có chắc chắn muốn thay thế bằng đề xuất của AI không?`,
        confirmLabel: "Thay thế",
        cancelLabel: "Giữ lại",
        tone: "danger",
      });
      if (!ok) return;
    }
    onApply({ [fieldKey]: val });
  }

  async function handleApplyAll() {
    const overwrittenFields = fields.filter((f) => {
      const val = suggestion(f);
      const cur = current[f.key].trim();
      return val && cur && cur !== val;
    });

    if (overwrittenFields.length > 0) {
      const names = overwrittenFields.map((f) => `"${f.label}"`).join(", ");
      const ok = await showConfirm({
        title: "Xác nhận ghi đè các mục đã có",
        description: `Các mục ${names} hiện đã có dữ liệu. Áp dụng toàn bộ sẽ thay thế các mục này bằng bản nháp AI. Bạn có muốn tiếp tục?`,
        confirmLabel: "Áp dụng tất cả",
        cancelLabel: "Hủy",
        tone: "danger",
      });
      if (!ok) return;
    }

    const changes: Partial<ClinicalValues> = {};
    fields.forEach((f) => {
      const val = suggestion(f);
      if (val) changes[f.key] = val;
    });
    onApply(changes);
  }

  const expanded = isOpen || loading || draft !== null;

  if (!expanded) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-light/30 px-4 py-2.5 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <NotePencil size={18} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-dark">
                Trợ lý ghi chép lâm sàng (AI Scribe)
              </span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                AI hỗ trợ
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Soạn nhanh Lý do khám, Chẩn đoán & Ghi chú điều trị từ transcript hoặc ghi chú thô.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand shadow-xs transition-all hover:bg-brand-light hover:text-brand-dark active:scale-[0.98]"
        >
          <Sparkle size={13} weight="fill" />
          Mở trợ lý AI
          <CaretDown size={13} weight="bold" />
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-brand/20 bg-brand-light/40 p-4 transition-all">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
            <NotePencil size={18} weight="duotone" />
            Trợ lý ghi chép lâm sàng
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
              AI Scribe
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Dán ghi chú ngắn hoặc transcript lời thoại. Bác sĩ chọn từng gợi ý trước khi lưu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void generateDraft()}
            disabled={loading || !canGenerate}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <SpinnerGap size={14} className="animate-spin" />
            ) : (
              <Sparkle size={14} weight="fill" />
            )}
            {loading ? "Đang soạn..." : "Tạo bản nháp"}
          </button>
          {!loading && !draft && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              title="Thu gọn khung trợ lý"
            >
              <CaretUp size={14} weight="bold" />
              Thu gọn
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="clinical-scribe-source"
            className="text-xs font-semibold text-brand-dark"
          >
            Ghi chú nguồn
          </label>
          {current.treatmentNotes?.trim() && !notes.trim() && (
            <button
              type="button"
              onClick={() => setNotes(current.treatmentNotes.trim())}
              className="text-[11px] font-medium text-brand hover:underline"
            >
              📋 Lấy từ ghi chú điều trị hiện tại
            </button>
          )}
        </div>
        <textarea
          id="clinical-scribe-source"
          rows={3}
          maxLength={20_000}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setDraft(null);
          }}
          disabled={loading}
          placeholder="Nhập hoặc dán transcript cuộc hội thoại khám, ghi âm hoặc ghi chú triệu chứng thô của bác sĩ tại đây (tối thiểu 5 ký tự)..."
          className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {notes.length > 0 && !canGenerate && (
          <p className="text-[11px] text-amber-700">
            ⚠️ Vui lòng nhập tối thiểu 5 ký tự để tạo bản nháp AI.
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          <Warning size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {draft && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand/15 pt-3">
            <p className="text-xs font-bold text-brand-dark">
              Đối chiếu trước khi áp dụng
            </p>
            {hasSuggestions && (
              <button
                type="button"
                onClick={() => void handleApplyAll()}
                disabled={allApplied}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={13} weight="bold" />
                {allApplied ? "Đã áp dụng tất cả" : "Áp dụng tất cả"}
              </button>
            )}
          </div>

          {!hasSuggestions ? (
            <p className="rounded-lg border border-border bg-white px-3 py-4 text-xs text-muted-foreground">
              AI chưa tạo được trường dữ liệu nào từ ghi chú này. Hãy bổ sung
              thông tin lâm sàng rồi thử lại.
            </p>
          ) : (
            fields.map((field) => {
              const value = suggestion(field);
              if (!value) return null;
              const unchanged = value === current[field.key].trim();
              return (
                <div
                  key={field.key}
                  className="rounded-lg border border-border bg-white p-3 shadow-2xs"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">
                      {field.label}
                    </p>
                    {unchanged ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Check size={12} weight="bold" /> Đã áp dụng
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplyField(field.key, value, field.label)
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-dark"
                      >
                        Áp dụng <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                        Hiện tại
                      </p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                        {current[field.key].trim() || "Chưa có nội dung"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-brand-light px-3 py-2">
                      <p className="mb-1 text-[10px] font-semibold text-brand-dark/70">
                        AI đề xuất
                      </p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-brand-dark">
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {draft.disclaimer ||
              "Bản nháp AI cần được bác sĩ kiểm tra và xác nhận trước khi lưu."}
          </p>
        </div>
      )}
    </section>
  );
}
