"use client";

import { useRef, useState } from "react";
import { ArrowCounterClockwise, Sparkle, WarningCircle } from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import { AdminButton } from "./admin-button";

export type AdminAiContentKind = "service" | "treatment_method" | "promotion";

export type AdminAiContentInput = {
  kind: AdminAiContentKind;
  name: string;
  category?: string;
  serviceName?: string;
  promotionContext?: string;
};

export type AdminAiContentSuggestion = {
  shortDescription: string;
  description: string;
  pricingNote: string;
  highlights: Array<{ title: string; description: string; icon: string }>;
  durationMinutes: number | null;
  disclaimer: string;
};

export function suggestAdminContent(input: AdminAiContentInput) {
  return apiClient
    .post<AdminAiContentSuggestion>("/ai/content/suggest", input, { timeout: 60_000 })
    .then((res) => res.data);
}

/**
 * Gọi AI soạn nội dung cho form và cho phép hoàn tác về giá trị trước khi áp dụng.
 * `capture` chụp lại các trường sẽ bị ghi đè, `restore` trả chúng về như cũ.
 */
export function useAdminAiAssist<Snapshot>({
  capture,
  restore,
}: {
  capture: () => Snapshot;
  restore: (snapshot: Snapshot) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const snapshotRef = useRef<Snapshot | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const generate = async (
    input: AdminAiContentInput,
    apply: (suggestion: AdminAiContentSuggestion) => void,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const suggestion = await suggestAdminContent(input);
      // Chỉ chụp lại ở lần đầu để "Hoàn tác" luôn quay về nội dung người dùng tự nhập
      if (!snapshotRef.current) snapshotRef.current = capture();
      apply(suggestion);
      setHasResult(true);
      setCanUndo(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "AI chưa soạn được nội dung, vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const undo = () => {
    if (!snapshotRef.current) return;
    restore(snapshotRef.current);
    snapshotRef.current = null;
    setCanUndo(false);
    setHasResult(false);
  };

  return { loading, error, hasResult, canUndo, generate, undo };
}

type AdminAiAssistBarProps = {
  /** Mô tả ngắn những trường AI sẽ điền */
  description: string;
  disabled?: boolean;
  disabledHint?: string;
  loading: boolean;
  hasResult: boolean;
  canUndo: boolean;
  error: string | null;
  onGenerate: () => void;
  onUndo: () => void;
};

export function AdminAiAssistBar({
  description,
  disabled,
  disabledHint,
  loading,
  hasResult,
  canUndo,
  error,
  onGenerate,
  onUndo,
}: AdminAiAssistBarProps) {
  return (
    <div className="rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50 to-sky-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-violet-600 shadow-2xs ring-1 ring-violet-100">
            <Sparkle size={16} weight="fill" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800">Trợ lý AI soạn nội dung</p>
            <p className="text-xs leading-relaxed text-slate-500">
              {disabled && disabledHint ? disabledHint : description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canUndo ? (
            <AdminButton variant="secondary" size="sm" onClick={onUndo} disabled={loading}>
              <ArrowCounterClockwise size={14} weight="bold" />
              Hoàn tác
            </AdminButton>
          ) : null}
          <AdminButton
            variant="plain"
            size="sm"
            loading={loading}
            disabled={disabled}
            onClick={onGenerate}
            title={disabled ? disabledHint : undefined}
            className="bg-violet-600 text-white shadow-sm shadow-violet-600/25 hover:bg-violet-700"
          >
            {loading ? null : <Sparkle size={14} weight="fill" />}
            {loading ? "AI đang soạn..." : hasResult ? "Soạn lại" : "AI soạn nội dung"}
          </AdminButton>
        </div>
      </div>
      {hasResult && !error ? (
        <p className="mt-2 text-[11px] text-violet-700">
          Nội dung do AI gợi ý — hãy đọc lại và chỉnh sửa trước khi lưu.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <WarningCircle size={14} weight="fill" className="shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
