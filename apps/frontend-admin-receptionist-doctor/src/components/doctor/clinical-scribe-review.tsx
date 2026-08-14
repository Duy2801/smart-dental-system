"use client";

import { useState } from "react";
import {
  ArrowRight,
  NotePencil,
  Sparkle,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";

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
  const [notes, setNotes] = useState(initialNotes.slice(0, 20_000));
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDraft() {
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await apiClient.post<DraftResponse>(
        "/ai/doctor/draft-medical-record",
        {
          patientId,
          chiefComplaint: current.chiefComplaint.trim() || undefined,
          serviceName: serviceName || undefined,
          transcript: notes.trim() || undefined,
        },
        { timeout: 60_000 },
      );
      setDraft(res.data);
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

  return (
    <section className="rounded-xl border border-brand/20 bg-brand-light/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
            <NotePencil size={18} weight="duotone" />
            Trợ lý ghi chép lâm sàng
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Dán ghi chú ngắn hoặc transcript. Bác sĩ chọn từng gợi ý trước khi
            lưu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generateDraft()}
          disabled={
            loading || (!notes.trim() && !current.chiefComplaint.trim())
          }
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <Sparkle size={14} weight="fill" />
          )}
          {loading ? "Đang soạn" : "Tạo bản nháp"}
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        <label
          htmlFor="clinical-scribe-source"
          className="text-xs font-semibold text-brand-dark"
        >
          Ghi chú nguồn
        </label>
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
          placeholder="Ví dụ: đau răng 46 ba ngày, đau tăng về đêm, thử lạnh dương tính..."
          className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
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
          <div className="border-t border-brand/15 pt-3">
            <p className="text-xs font-semibold text-brand-dark">
              Đối chiếu trước khi áp dụng
            </p>
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
                  className="rounded-lg border border-border bg-white p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">
                      {field.label}
                    </p>
                    {unchanged ? (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Không thay đổi
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApply({ [field.key]: value })}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
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
