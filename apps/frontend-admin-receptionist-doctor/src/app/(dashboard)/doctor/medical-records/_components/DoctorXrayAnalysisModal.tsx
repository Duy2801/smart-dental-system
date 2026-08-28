"use client";

import { useState } from "react";
import {
  X,
  Sparkle,
  Eye,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
  Info,
  ShieldCheck,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

export type DentalFinding = {
  fdiToothNumber: number;
  findingType: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
};

export type AnalyzeXrayResult = {
  isRadiograph: boolean;
  status: "INVALID_IMAGE" | "MODEL_UNAVAILABLE" | "HEALTHY" | "PATHOLOGY_DETECTED" | "ANALYSIS_FAILED";
  errorStatus?: "INVALID_IMAGE" | "MODEL_UNAVAILABLE" | "ANALYSIS_FAILED" | null;
  findings: DentalFinding[];
  totalFindings: number;
  summary: string;
  diagnosisSuggestion: string | null;
  treatmentRecommendations: string[];
  annotatedImageUrl: string | null;
  disclaimer: string;
  analysisId: string;
  modelVersion: string;
  analyzedAt: string;
};

export function canApplyXrayResult(result: AnalyzeXrayResult | null): boolean {
  return (
    result?.isRadiograph === true &&
    (result.status === "HEALTHY" || result.status === "PATHOLOGY_DETECTED")
  );
}

type Props = {
  imageId: string;
  imageUrl: string;
  imageCaption?: string | null;
  patientId?: string;
  patientName?: string;
  onClose: () => void;
  onApplyToRecord?: (diagnosis: string, treatmentNotes: string) => void;
};

const SEVERITY_BADGE = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

export function DoctorXrayAnalysisModal({
  imageId,
  imageUrl,
  imageCaption,
  patientId,
  patientName,
  onClose,
  onApplyToRecord,
}: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<"annotated" | "original">("annotated");
  const [result, setResult] = useState<AnalyzeXrayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await apiClient.post<AnalyzeXrayResult>(
        "/ai/doctor/analyze-xray",
        {
          imageId,
          clinicalNoteHint: imageCaption || undefined,
        },
        { timeout: 60000 }
      );
      const payload = res.data;
      setResult(payload);
      if (payload.annotatedImageUrl) {
        setViewMode("annotated");
      }
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message || "Không thể phân tích ảnh X-quang."
          : "Lỗi kết nối máy chủ AI.";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result || !canApplyXrayResult(result)) return;
    const diag = result.diagnosisSuggestion || result.summary;
    const recs = result.treatmentRecommendations.join("\n- ");
    const treatmentNotes = recs
      ? `Phác đồ đề xuất từ X-quang AI:\n- ${recs}`
      : result.summary;

    onApplyToRecord?.(diag, treatmentNotes);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const displayImage =
    viewMode === "annotated" && result?.annotatedImageUrl
      ? result.annotatedImageUrl
      : imageUrl;
  const canApply = canApplyXrayResult(result);
  const hasBlockedResult =
    result?.status === "INVALID_IMAGE" || result?.status === "MODEL_UNAVAILABLE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/65 p-3 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="xray-analysis-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_90px_-30px_rgba(0,39,141,0.55)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 bg-brand-light/35 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand shadow-xs ring-1 ring-brand/15">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h2 id="xray-analysis-title" className="text-base font-bold tracking-tight text-brand-dark">
                Phân tích Phim X-quang Nha khoa bằng AI
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {patientName ? `Bệnh nhân: ${patientName} | ` : ""}
                {imageCaption || "Phim X-quang Panorama/Cận chóp"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white hover:text-brand-dark active:scale-[0.96]"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="grid flex-1 gap-5 overflow-y-auto bg-slate-50/35 p-4 sm:p-6 md:grid-cols-12">
          {/* Left: Image Viewer (7 cols) */}
          <div className="flex flex-col gap-3 md:col-span-7">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Khung hiển thị hình ảnh
              </span>
              {result && (
                <div className="inline-flex rounded-xl border border-border bg-white p-1 text-xs font-medium shadow-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("annotated")}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      viewMode === "annotated"
                        ? "bg-brand-light font-bold text-brand-dark"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Vùng răng AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("original")}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      viewMode === "original"
                        ? "bg-brand-light font-bold text-brand-dark"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ảnh gốc
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Phim X-quang"
                className="max-h-[460px] w-full rounded-lg object-contain"
              />

              {!result && !analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 p-4 text-center backdrop-blur-xs">
                  <p className="mb-3 text-sm font-medium text-white">
                    Sẵn sàng phân tích tự động 32 răng FDI và phát hiện bệnh lý
                  </p>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-dark active:scale-[0.98]"
                  >
                    <Sparkle size={16} weight="fill" /> Bắt đầu phân tích AI
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 p-4 text-center text-white backdrop-blur-xs">
                  <SpinnerGap size={36} className="animate-spin text-brand" />
                  <p className="mt-3 text-sm font-semibold">
                    Dental Vision AI đang phân tích...
                  </p>
                  <p className="text-xs text-slate-300">
                    Định vị cung răng FDI và kiểm tra tổn thương y khoa
                  </p>
                </div>
              )}
            </div>

            {result && result.findings.length > 0 && (
              <p className="flex items-start gap-1.5 rounded-xl border border-brand/15 bg-brand-light/40 px-3 py-2 text-[11px] leading-relaxed text-brand-dark">
                <Info size={14} className="mt-0.5 shrink-0 text-brand" />
                Khung AI biểu thị vùng răng cần bác sĩ kiểm tra, không phải đường biên chính xác của tổn thương.
              </p>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <WarningCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right: Analysis Details (5 cols) */}
          <div className="flex flex-col gap-4 md:col-span-5">
            {!result ? (
              <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-brand/25 bg-white p-6 text-center text-muted-foreground">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-light text-brand"><Info size={25} /></span>
                <p className="text-sm font-semibold text-brand-dark">
                  Chưa có dữ liệu phân tích
                </p>
                <p className="text-xs">
                  Bấm &quot;Bắt đầu phân tích AI&quot; để nhận diện răng và phát hiện tổn thương.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 overflow-y-auto pr-1">
                {/* Clinical Summary */}
                {hasBlockedResult ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                      <WarningCircle size={14} className="text-amber-600" />
                      {result.status === "MODEL_UNAVAILABLE"
                        ? "Model AI chưa sẵn sàng"
                        : "Ảnh không hợp lệ"}
                    </div>
                    <p className="text-xs leading-relaxed text-amber-800">
                      {result.summary}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-amber-700">
                      Kết quả này không thể được chèn vào bệnh án.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand/15 bg-brand-light/35 p-4">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <Eye size={14} className="text-brand" /> Tóm tắt lâm sàng
                    </div>
                    <p className="text-xs leading-relaxed text-slate-800">
                      {result.summary}
                    </p>
                  </div>
                )}

                {/* Findings Table */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Răng phát hiện tổn thương ({result.findings.length})
                    </span>
                  </div>
                  {hasBlockedResult ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                      Chưa có kết quả phân tích hợp lệ.
                    </p>
                  ) : result.findings.length === 0 ? (
                    <p className="rounded-lg border border-border bg-slate-50 p-3 text-xs text-slate-500">
                      Không phát hiện bất thường rõ rệt trên phim.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-[160px] overflow-y-auto">
                      {result.findings.map((f, idx) => {
                        const sevClass =
                          SEVERITY_BADGE[
                            f.severity as keyof typeof SEVERITY_BADGE
                          ] || "bg-slate-50 text-slate-700 border-border";
                        return (
                          <li
                            key={`${f.fdiToothNumber}-${idx}`}
                            className="flex items-center justify-between rounded-xl border border-border/80 bg-white p-2.5 text-xs shadow-xs transition-colors hover:border-brand/25"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-xs font-bold text-brand">
                                #{f.fdiToothNumber}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {f.findingType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                {(f.confidence * 100).toFixed(0)}%
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${sevClass}`}
                              >
                                {f.severity === "UNASSESSED" ? "Chưa đánh giá" : f.severity}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Diagnosis & Recommendations */}
                {result.diagnosisSuggestion && (
                  <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5">
                    <p className="text-[11px] font-bold uppercase text-brand-dark">
                      Chẩn đoán đề xuất
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-800">
                      {result.diagnosisSuggestion}
                    </p>
                  </div>
                )}

                {result.treatmentRecommendations.length > 0 && (
                  <div className="rounded-xl border border-border bg-slate-50 p-3.5">
                    <p className="text-[11px] font-bold uppercase text-slate-700">
                      Hướng điều trị gợi ý
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                      {result.treatmentRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-brand">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>{result.disclaimer}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98]"
          >
            Đóng
          </button>

          {canApply && onApplyToRecord && (
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md active:scale-[0.98] disabled:opacity-75"
            >
              <CheckCircle size={16} weight="bold" />
              {applied ? "Đã thêm vào bản nháp!" : "Thêm vào bản nháp bệnh án"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
