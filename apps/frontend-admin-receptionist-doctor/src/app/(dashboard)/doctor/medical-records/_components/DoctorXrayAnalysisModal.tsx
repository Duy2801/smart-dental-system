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
  findings: DentalFinding[];
  totalFindings: number;
  summary: string;
  diagnosisSuggestion: string | null;
  treatmentRecommendations: string[];
  annotatedImageUrl: string | null;
  disclaimer: string;
};

type Props = {
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
          imageUrl,
          patientId,
          clinicalNoteHint: imageCaption || undefined,
        },
        { timeout: 60000 }
      );
      const payload: AnalyzeXrayResult =
        (res as any)?.data?.data ?? (res as any)?.data ?? res;
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
    if (!result) return;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Phân tích Phim X-quang Nha khoa bằng AI
              </h2>
              <p className="text-xs text-muted-foreground">
                {patientName ? `Bệnh nhân: ${patientName} | ` : ""}
                {imageCaption || "Phim X-quang Panorama/Cận chóp"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-12">
          {/* Left: Image Viewer (7 cols) */}
          <div className="flex flex-col gap-3 md:col-span-7">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Khung hiển thị hình ảnh
              </span>
              {result && (
                <div className="inline-flex rounded-lg border border-border bg-slate-100 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setViewMode("annotated")}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      viewMode === "annotated"
                        ? "bg-white font-bold text-brand shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    AI Khoanh vùng
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("original")}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      viewMode === "original"
                        ? "bg-white font-bold text-brand shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ảnh gốc
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-slate-950 p-2">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-dark"
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
              <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                <Info size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  Chưa có dữ liệu phân tích
                </p>
                <p className="text-xs">
                  Bấm &quot;Bắt đầu phân tích AI&quot; để nhận diện răng và phát hiện tổn thương.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 overflow-y-auto pr-1">
                {/* Clinical Summary */}
                {result.summary?.includes("CẢNH BÁO Y KHOA") ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-900">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
                      <WarningCircle size={14} className="text-red-600" /> Cảnh Báo Y Khoa
                    </div>
                    <p className="text-xs leading-relaxed text-red-800">
                      {result.summary}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-slate-50 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <Eye size={14} className="text-brand" /> Tóm tắt hình ảnh
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
                  {result.findings.length === 0 ? (
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
                            className="flex items-center justify-between rounded-lg border border-border bg-white p-2.5 text-xs"
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
                              <span className="text-[11px] text-muted-foreground">
                                {(f.confidence * 100).toFixed(0)}%
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${sevClass}`}
                              >
                                {f.severity}
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
        <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đóng
          </button>

          {result && onApplyToRecord && (
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-75"
            >
              <CheckCircle size={16} weight="bold" />
              {applied ? "Đã chèn vào bệnh án!" : "Chèn kết quả vào Bệnh án"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
