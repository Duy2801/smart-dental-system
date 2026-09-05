"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Brain,
  Sparkle,
  FileArrowUp,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CircleHalf,
  Sliders,
  ArrowsCounterClockwise,
  Eye,
  EyeSlash,
  Plus,
  Trash,
  CheckCircle,
  Warning,
  Printer,
  FloppyDisk,
  Lightning,
  FirstAid,
  Info,
  X,
  Heartbeat,
  ShieldCheck,
  Check,
  PencilSimple,
  XCircle,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import axios from "axios";
import { getVisibleFindings } from "./dental-xray-analysis-utils";

export interface DentalFinding {
  fdiToothNumber: number;
  findingType: string;
  confidence: number;
  boundingBox: {
    x: number; // percentage (0..100)
    y: number; // percentage (0..100)
    width: number; // percentage (0..100)
    height: number; // percentage (0..100)
  };
  severity: "UNASSESSED" | "LOW" | "MEDIUM" | "HIGH";
  doctorStatus?: "ACCEPTED" | "REJECTED";
  doctorNote?: string;
}

export interface AnalyzeXrayResponse {
  isRadiograph?: boolean;
  status: "INVALID_IMAGE" | "MODEL_UNAVAILABLE" | "HEALTHY" | "PATHOLOGY_DETECTED" | "ANALYSIS_FAILED";
  errorStatus?: "INVALID_IMAGE" | "MODEL_UNAVAILABLE" | "ANALYSIS_FAILED" | null;
  findings: DentalFinding[];
  totalFindings: number;
  summary: string;
  diagnosisSuggestion?: string | null;
  treatmentRecommendations?: string[];
  annotatedImageUrl?: string | null;
  disclaimer: string;
  analysisId: string;
  modelVersion: string;
  analyzedAt: string;
}

export interface PatientXrayItem {
  id?: string;
  url: string;
  title?: string;
  date?: string;
  type?: "xray" | "intraoral" | "other";
}

interface DentalXrayAnalyzerProps {
  patientId?: string;
  patientName?: string;
  patientImages?: PatientXrayItem[];
  onApplyToMedicalRecord?: (findingsSummary: string) => void;
  onApplyToDentalChart?: (findings: DentalFinding[]) => void;
  onRequestUpload?: () => void;
}

const FINDING_CONFIG: Record<
  string,
  { label: string; border: string; bg: string; text: string; badge: string; icon: string }
> = {
  Caries: {
    label: "Sâu răng",
    border: "border-rose-500",
    bg: "bg-rose-500/20",
    text: "text-rose-700 bg-rose-50 border-rose-200",
    badge: "bg-rose-500 text-white",
    icon: "🔴",
  },
  "Periapical radiolucency": {
    label: "Viêm quanh chóp",
    border: "border-purple-500",
    bg: "bg-purple-500/20",
    text: "text-purple-700 bg-purple-50 border-purple-200",
    badge: "bg-purple-600 text-white",
    icon: "🟣",
  },
  Impacted: {
    label: "Răng ngầm / kẹt",
    border: "border-amber-500",
    bg: "bg-amber-500/20",
    text: "text-amber-700 bg-amber-50 border-amber-200",
    badge: "bg-amber-500 text-slate-950",
    icon: "🟠",
  },
  Filling: {
    label: "Vết trám răng",
    border: "border-sky-500",
    bg: "bg-sky-500/20",
    text: "text-sky-700 bg-sky-50 border-sky-200",
    badge: "bg-sky-500 text-white",
    icon: "🔵",
  },
  "Crown / Bridge": {
    label: "Mão / Cầu răng",
    border: "border-amber-600",
    bg: "bg-amber-600/20",
    text: "text-amber-800 bg-amber-50 border-amber-300",
    badge: "bg-amber-600 text-white",
    icon: "🟡",
  },
  "Root canal filling": {
    label: "Chữa tủy (Nội nha)",
    border: "border-indigo-500",
    bg: "bg-indigo-500/20",
    text: "text-indigo-700 bg-indigo-50 border-indigo-200",
    badge: "bg-indigo-500 text-white",
    icon: "🔷",
  },
  Implant: {
    label: "Cấy ghép Implant",
    border: "border-emerald-500",
    bg: "bg-emerald-500/20",
    text: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-500 text-white",
    icon: "🟢",
  },
  "Missing tooth": {
    label: "Răng đã mất",
    border: "border-slate-400",
    bg: "bg-slate-400/20",
    text: "text-slate-700 bg-slate-100 border-slate-300",
    badge: "bg-slate-500 text-white",
    icon: "⚪",
  },
  "Residual root": {
    label: "Chân răng sót",
    border: "border-pink-500",
    bg: "bg-pink-500/20",
    text: "text-pink-700 bg-pink-50 border-pink-200",
    badge: "bg-pink-600 text-white",
    icon: "🌸",
  },
};

export function calculateOralHealthRisk(findings: DentalFinding[]) {
  const activeFindings = findings.filter((f) => f.doctorStatus !== "REJECTED");

  if (!activeFindings || activeFindings.length === 0) {
    return {
      score: null,
      riskLevel: "UNASSESSED" as const,
      riskLabel: "Chưa chấm điểm",
      colorClass: "text-brand-dark bg-brand-light/40 border-brand/20",
      badgeColor: "bg-brand-light text-brand-dark",
      recommendation:
        "Model chưa phát hiện bất thường vượt ngưỡng. Kết quả này không loại trừ bệnh lý; bác sĩ cần tiếp tục đối chiếu lâm sàng.",
      urgentTeeth: [],
    };
  }

  let penalty = 0;
  const urgentTeeth: { fdi: number; reason: string }[] = [];

  activeFindings.forEach((f) => {
    let p = 8;
    const cfg = FINDING_CONFIG[f.findingType];
    const lbl = cfg?.label || f.findingType;

    if (f.findingType === "Periapical radiolucency" || f.findingType === "Residual root") {
      p = 15;
      urgentTeeth.push({ fdi: f.fdiToothNumber, reason: lbl });
    } else if (f.findingType === "Impacted" || (f.findingType === "Caries" && f.severity === "HIGH")) {
      p = 12;
      urgentTeeth.push({ fdi: f.fdiToothNumber, reason: lbl });
    } else if (f.findingType === "Caries") {
      p = 8;
    } else {
      p = 4;
    }

    if (f.severity === "HIGH") p += 4;
    penalty += p;
  });

  const score = Math.max(20, Math.min(100, 100 - penalty));
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let riskLabel = "Rủi ro Thấp (An Toàn)";
  let colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let badgeColor = "bg-emerald-500 text-white";
  let recommendation = "Tình trạng cung hàm tương đối ổn định. Chăm sóc vệ sinh định kỳ.";

  if (score < 50) {
    riskLevel = "HIGH";
    riskLabel = "RỦI RO CAO / Cần can thiệp gấp";
    colorClass = "text-rose-700 bg-rose-50 border-rose-200";
    badgeColor = "bg-rose-600 text-white";
    recommendation = "Cần ưu tiên tiểu phẫu răng khôn mọc kẹt và nội nha viêm quanh chóp tránh tiêu xương.";
  } else if (score < 80) {
    riskLevel = "MEDIUM";
    riskLabel = "RỦI RO VỪA / Cần phác đồ";
    colorClass = "text-amber-700 bg-amber-50 border-amber-200";
    badgeColor = "bg-amber-500 text-slate-950 font-bold";
    recommendation = "Có tổn thương sâu răng tiến triển hoặc thấu quang. Cần làm sạch xoang và trám thẩm mỹ sớm.";
  }

  return { score, riskLevel, riskLabel, colorClass, badgeColor, recommendation, urgentTeeth };
}

export const DentalXrayAnalyzer: React.FC<DentalXrayAnalyzerProps> = ({
  patientId,
  patientName,
  patientImages = [],
  onApplyToMedicalRecord,
  onApplyToDentalChart,
  onRequestUpload,
}) => {
  const effectivePatientImages = patientImages;

  const [imageUrl, setImageUrl] = useState<string>(effectivePatientImages[0]?.url || "");
  const [imageId, setImageId] = useState<string | null>(effectivePatientImages[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeXrayResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"findings" | "diagnosis" | "treatment">("findings");

  // DICOM Viewer Tools
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isInverted, setIsInverted] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showSliders, setShowSliders] = useState(false);
  const [hoveredFinding, setHoveredFinding] = useState<DentalFinding | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({});

  // Manual Annotation Drawing
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFdiNumber, setNewFdiNumber] = useState<number>(48);
  const [newFindingType, setNewFindingType] = useState<string>("Caries");
  const [newSeverity, setNewSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  // Doctor Edit Modal
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFdiNumber, setEditFdiNumber] = useState<number>(48);
  const [editFindingType, setEditFindingType] = useState<string>("Caries");
  const [editSeverity, setEditSeverity] = useState<"UNASSESSED" | "LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editDoctorNote, setEditDoctorNote] = useState<string>("");

  // Actions
  const [applied, setApplied] = useState(false);
  const [chartSynced, setChartSynced] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync image selection
  const handleSelectPatientImage = (image: PatientXrayItem) => {
    setImageUrl(image.url);
    setImageId(image.id ?? null);
    setResult(null);
    setApplied(false);
    setChartSynced(false);
  };

  // Main Analyze Function
  const handleAnalyze = async () => {
    if (!imageId) {
      setUploadError("Ảnh phải được lưu vào bệnh án trước khi phân tích AI.");
      return;
    }

    setLoading(true);
    setApplied(false);
    setChartSynced(false);

    try {
      const res = await apiClient.post<AnalyzeXrayResponse>(
        "/ai/doctor/analyze-xray",
        {
          imageId,
        },
        { timeout: 60000 }
      );

      const payload = res.data;

      const isModelUnavailable = payload?.status === "MODEL_UNAVAILABLE";
      const isInvalid =
        payload?.isRadiograph === false ||
        payload?.status === "INVALID_IMAGE" ||
        (payload?.summary || "").toLowerCase().includes("cảnh báo y khoa") ||
        (payload?.summary || "").toLowerCase().includes("không phải là phim") ||
        (payload?.summary || "").toLowerCase().includes("không phải phim");

      if (isModelUnavailable) {
        setResult({
          analysisId: payload.analysisId,
          modelVersion: payload.modelVersion,
          analyzedAt: payload.analyzedAt,
          isRadiograph: true,
          status: "MODEL_UNAVAILABLE",
          totalFindings: 0,
          disclaimer:
            payload?.disclaimer ||
            "Model phân tích X-quang hiện chưa sẵn sàng. Không sử dụng phản hồi này để đưa ra quyết định lâm sàng.",
          summary: payload?.summary || "Model phân tích X-quang hiện chưa sẵn sàng.",
          findings: [],
          annotatedImageUrl: imageUrl,
        });
      } else if (isInvalid) {
        setResult({
          analysisId: payload.analysisId,
          modelVersion: payload.modelVersion,
          analyzedAt: payload.analyzedAt,
          isRadiograph: false,
          status: "INVALID_IMAGE",
          totalFindings: 0,
          disclaimer: payload?.disclaimer || "Hệ thống tự động phát hiện và chặn các ảnh không phải X-quang răng.",
          summary: payload?.summary || "CẢNH BÁO Y KHOA: Hình ảnh tải lên không phải là phim chụp X-quang răng nha khoa hợp lệ.",
          findings: [],
          annotatedImageUrl: imageUrl,
        });
      } else {
        const rawFindings = (payload?.findings || []).map((f) => ({
          ...f,
          doctorStatus: f.doctorStatus || "ACCEPTED",
        }));

        setResult({
          analysisId: payload.analysisId,
          modelVersion: payload.modelVersion,
          analyzedAt: payload.analyzedAt,
          isRadiograph: true,
          status: payload?.status || (rawFindings.length > 0 ? "PATHOLOGY_DETECTED" : "HEALTHY"),
          findings: rawFindings,
          totalFindings: payload?.totalFindings ?? rawFindings.length,
          summary:
            payload?.summary ||
            (rawFindings.length > 0
              ? `Phát hiện ${rawFindings.length} tổn thương trên phim X-quang.`
              : "Hình ảnh X-quang răng không phát hiện bất thường rõ rệt."),
          diagnosisSuggestion: payload?.diagnosisSuggestion,
          treatmentRecommendations: payload?.treatmentRecommendations || [],
          annotatedImageUrl: payload?.annotatedImageUrl || imageUrl,
          disclaimer: payload?.disclaimer || "Kết quả phân tích X-quang bởi Dental Vision AI (Hybrid Cloud Pipeline).",
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? Array.isArray(err.response.data.message)
            ? err.response.data.message.join(", ")
            : String(err.response.data.message)
          : "Không thể kết nối đến dịch vụ Vision AI. Vui lòng kiểm tra lại dịch vụ.";
      setResult({
        analysisId: "client-error",
        modelVersion: "unknown",
        analyzedAt: new Date().toISOString(),
        status: "ANALYSIS_FAILED",
        totalFindings: 0,
        disclaimer: "Lỗi kết nối hoặc xử lý phân tích hình ảnh.",
        summary: errorMsg,
        findings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // DOCTOR REVIEW WORKFLOW ACTIONS (Accept / Reject / Edit)
  const handleAcceptFinding = (index: number) => {
    if (!result) return;
    const updated = [...result.findings];
    updated[index] = { ...updated[index], doctorStatus: "ACCEPTED" };
    setResult({ ...result, findings: updated });
  };

  const handleRejectFinding = (index: number) => {
    if (!result) return;
    const updated = [...result.findings];
    updated[index] = { ...updated[index], doctorStatus: "REJECTED" };
    setResult({ ...result, findings: updated });
  };

  const handleOpenEditModal = (index: number) => {
    if (!result) return;
    const item = result.findings[index];
    setEditingIndex(index);
    setEditFdiNumber(item.fdiToothNumber);
    setEditFindingType(item.findingType);
    setEditSeverity(item.severity);
    setEditDoctorNote(item.doctorNote || "");
  };

  const handleSaveEditFinding = () => {
    if (!result || editingIndex === null) return;
    const updated = [...result.findings];
    updated[editingIndex] = {
      ...updated[editingIndex],
      fdiToothNumber: editFdiNumber,
      findingType: editFindingType,
      severity: editSeverity,
      doctorNote: editDoctorNote,
      doctorStatus: "ACCEPTED",
    };
    setResult({ ...result, findings: updated });
    setEditingIndex(null);
  };

  // Manual Bounding Box Drawing Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDrawStart({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !drawStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.min(drawStart.x, curX);
    const y = Math.min(drawStart.y, curY);
    const width = Math.abs(curX - drawStart.x);
    const height = Math.abs(curY - drawStart.y);
    setCurrentBox({ x, y, width, height });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingMode || !drawStart || !currentBox) return;
    if (currentBox.width > 2 && currentBox.height > 2) {
      setShowAddModal(true);
    }
    setDrawStart(null);
    setIsDrawingMode(false);
  };

  const handleSaveManualFinding = () => {
    if (!currentBox || !result) return;
    const newFinding: DentalFinding = {
      fdiToothNumber: newFdiNumber,
      findingType: newFindingType,
      confidence: 1.0,
      boundingBox: currentBox,
      severity: newSeverity,
      doctorStatus: "ACCEPTED",
    };
    setResult({
      ...result,
      findings: [newFinding, ...result.findings],
      totalFindings: result.findings.length + 1,
    });
    setShowAddModal(false);
    setCurrentBox(null);
  };

  const handleDeleteFinding = (index: number) => {
    if (!result) return;
    const updated = result.findings.filter((_, idx) => idx !== index);
    setResult({
      ...result,
      findings: updated,
      totalFindings: updated.length,
    });
  };

  const visibleFindings = useMemo(() => {
    return getVisibleFindings(result?.findings || [], selectedTypes);
  }, [result, selectedTypes]);

  const acceptedFindings = useMemo(() => {
    return result?.findings.filter((f) => f.doctorStatus !== "REJECTED") || [];
  }, [result]);

  const riskAssessment = useMemo(() => {
    return calculateOralHealthRisk(result?.findings || []);
  }, [result]);

  const workflowStep = !imageUrl ? 1 : loading || !result ? 2 : 3;

  return (
    <section className="flex flex-col gap-5 overflow-hidden rounded-3xl border border-brand/15 bg-white p-4 shadow-[0_18px_50px_-32px_rgba(0,39,141,0.35)] sm:p-5">
      {/* 1. TOP HEADER & WORKFLOW BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand ring-1 ring-brand/15">
            <Brain size={24} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-brand-dark">
                Dental Vision AI <span className="text-xs font-medium text-muted-foreground">· Hỗ trợ đọc phim X-quang</span>
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <ShieldCheck size={13} weight="fill" /> Bác sĩ kiểm duyệt
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Định vị răng FDI, rà soát tổn thương và chuẩn hóa kết quả trước khi ghi bệnh án.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onRequestUpload} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-brand-dark shadow-xs transition-all hover:border-brand/40 hover:bg-brand-light/40 active:scale-[0.98]">
            <FileArrowUp size={16} className="text-brand" />
            Quản lý ảnh
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !imageId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang quét phim...</span>
              </>
            ) : (
              <>
                <Sparkle size={16} weight="fill" />
                <span>Phân tích X-quang AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div aria-label="Tiến trình phân tích" className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border/80 bg-brand-light/25 p-1">
        {[
          { step: 1, label: "Chọn phim" },
          { step: 2, label: "Phân tích AI" },
          { step: 3, label: "Bác sĩ duyệt" },
        ].map(({ step, label }) => {
          const isActive = workflowStep === step;
          const isComplete = workflowStep > step;
          return (
            <div key={step} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${isActive ? "bg-white text-brand-dark shadow-xs" : isComplete ? "text-emerald-700" : "text-muted-foreground"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${isActive ? "bg-brand text-white" : isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {isComplete ? <Check size={12} weight="bold" /> : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          );
        })}
      </div>

      {uploadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {uploadError}
        </div>
      )}

      {/* 2. ALBUM SELECTOR PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Phim bệnh nhân</span>
        {effectivePatientImages.length === 0 && (
          <span className="text-[11px] font-medium text-slate-400">Bệnh nhân chưa có phim X-quang</span>
        )}
        {effectivePatientImages.map((imgItem, idx) => {
          const isSelected = imageUrl === imgItem.url;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPatientImage(imgItem)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 font-medium transition cursor-pointer ${
                isSelected
                  ? "border-brand/40 bg-brand-light text-brand-dark font-bold shadow-xs ring-1 ring-brand/20"
                  : "border-border bg-white text-slate-600 hover:border-brand/30 hover:bg-brand-light/30"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-brand" : "bg-slate-300"}`} />
              <span>{imgItem.title || `Phim X-quang #${idx + 1}`}</span>
              {imgItem.date && <span className="text-[10px] opacity-60">({imgItem.date})</span>}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE (2-COLUMN PACS WORKSTATION) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* === LEFT COLUMN: DICOM PACS VIEWER (7 COLS) === */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl lg:col-span-7">
          {/* Viewer Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-3.5 py-2 text-white backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
                Kính soi DICOM
              </span>
              <span className="h-3 w-px bg-slate-700" />
              <span className="text-[11px] font-semibold text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              {result && result.findings.length > 0 && (
                <>
                  <span className="h-3 w-px bg-slate-700" />
                  <span className="text-[10px] font-semibold text-slate-300">
                    Vùng răng AI đề nghị kiểm tra
                  </span>
                </>
              )}
            </div>

            {/* Quick Tools */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1.0, z - 0.25))}
                disabled={zoomLevel <= 1.0}
                title="Thu nhỏ"
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <MagnifyingGlassMinus size={16} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
                disabled={zoomLevel >= 3.0}
                title="Phóng to"
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <MagnifyingGlassPlus size={16} />
              </button>

              <span className="h-3 w-px bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => setIsInverted((v) => !v)}
                title="Đảo màu âm bản (Invert PACS)"
                className={`rounded-lg p-1.5 transition cursor-pointer ${
                  isInverted ? "bg-sky-500/20 text-sky-400 ring-1 ring-sky-400" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <CircleHalf size={16} />
              </button>

              <button
                type="button"
                onClick={() => setShowSliders((s) => !s)}
                title="Độ sáng & Độ tương phản"
                className={`rounded-lg p-1.5 transition cursor-pointer ${
                  showSliders || brightness !== 100 || contrast !== 100
                    ? "bg-sky-500/20 text-sky-400 ring-1 ring-sky-400"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Sliders size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1.0);
                  setIsInverted(false);
                  setBrightness(100);
                  setContrast(100);
                  setShowSliders(false);
                }}
                title="Đặt lại kính soi"
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <ArrowsCounterClockwise size={16} />
              </button>

              <span className="h-3 w-px bg-slate-700 mx-1" />

              {/* Manual Annotation Tool */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawingMode((prev) => !prev);
                  setCurrentBox(null);
                }}
                title="Kéo chuột để khoanh vùng thêm tổn thương thủ công"
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  isDrawingMode
                    ? "bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Plus size={14} weight="bold" />
                <span>{isDrawingMode ? "Đang vẽ..." : "Khoanh vùng"}</span>
              </button>
            </div>
          </div>

          {/* Sliders Panel */}
          {showSliders && (
            <div className="flex items-center justify-around border-b border-slate-800 bg-slate-900/95 px-4 py-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span>Độ sáng ({brightness}%):</span>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="h-1 w-24 cursor-pointer accent-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Tương phản ({contrast}%):</span>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="h-1 w-24 cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          )}

          {/* Image Screen */}
          <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden bg-slate-950 p-3">
            <div
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? "invert(100%)" : ""}`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out, filter 0.15s ease-out",
              }}
              className="relative flex items-center justify-center max-w-full"
            >
              <div
                ref={containerRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className={`relative inline-block max-w-full select-none ${isDrawingMode ? "cursor-crosshair" : ""}`}
              >
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Dental Radiograph"
                    draggable={false}
                    className="max-h-[460px] w-auto max-w-full rounded-xl object-contain shadow-2xl block"
                  />
                )}

                {/* Drawing Box */}
                {currentBox && (
                  <div
                    style={{
                      left: `${currentBox.x}%`,
                      top: `${currentBox.y}%`,
                      width: `${currentBox.width}%`,
                      height: `${currentBox.height}%`,
                    }}
                    className="absolute z-30 rounded-sm border-2 border-dashed border-amber-400 bg-amber-400/25 pointer-events-none"
                  />
                )}

                {/* Bounding Boxes */}
                {visibleFindings.map(({ finding: f, originalIndex }) => {
                  const isRejected = f.doctorStatus === "REJECTED";
                  const cfg = FINDING_CONFIG[f.findingType] || {
                    border: "border-sky-400",
                    bg: "bg-sky-400/20",
                    badge: "bg-sky-500 text-white",
                  };
                  const isHovered = hoveredFinding === f;

                  return (
                    <div
                      key={`${f.fdiToothNumber}-${f.findingType}-${originalIndex}`}
                      title={`Vùng răng ${f.fdiToothNumber} AI đề nghị kiểm tra; khung này không phải biên tổn thương.`}
                      onMouseEnter={() => setHoveredFinding(f)}
                      onMouseLeave={() => setHoveredFinding(null)}
                      onClick={() => handleOpenEditModal(originalIndex)}
                      style={{
                        left: `${f.boundingBox.x}%`,
                        top: `${f.boundingBox.y}%`,
                        width: `${f.boundingBox.width}%`,
                        height: `${f.boundingBox.height}%`,
                      }}
                      className={`absolute cursor-pointer rounded-sm border-2 transition-all ${
                        isRejected
                          ? "border-dashed border-slate-500 bg-slate-500/10 opacity-30"
                          : `${cfg.border} ${cfg.bg} ${
                              isHovered ? "z-30 scale-105 ring-4 ring-sky-400 shadow-lg" : "z-10"
                            }`
                      }`}
                    >
                      <div
                        className={`absolute -top-5 left-0 flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-extrabold shadow ${
                          isRejected ? "bg-slate-600 text-slate-300 line-through" : cfg.badge
                        }`}
                      >
                        <span>R{f.fdiToothNumber}</span>
                        {isRejected ? (
                          <span>(Từ chối)</span>
                        ) : (
                          <span className="opacity-80">{Math.round(f.confidence * 100)}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty / Not analyzed Overlay */}
            {!imageUrl && !loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
                <FileArrowUp size={32} className="mb-2 text-sky-400" />
                <p className="text-sm font-bold">Chưa có phim X-quang</p>
                <p className="mt-1 max-w-sm text-xs text-slate-300">
                  Hãy tải và lưu phim trong tab Ảnh trước khi phân tích. Hệ thống không sử dụng ảnh mẫu thay thế.
                </p>
                <button type="button" onClick={onRequestUpload} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white transition-all hover:bg-brand-dark active:scale-[0.98]">
                  <FileArrowUp size={16} />
                  Mở tab Ảnh
                </button>
              </div>
            ) : !result && !loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 p-6 text-center text-white backdrop-blur-[2px]">
                <Lightning size={32} className="mb-2 text-sky-400 animate-pulse" />
                <p className="text-sm font-bold">Sẵn Sàng Phân Tích</p>
                <p className="mt-1 max-w-sm text-xs text-slate-300">
                  Nhấp vào nút <b className="text-sky-400">&quot;Phân tích X-quang AI&quot;</b> ở góc phải trên để tự động định vị 32 răng FDI và phát hiện bệnh lý.
                </p>
              </div>
            ) : null}
          </div>

          {/* Filter Chips Bar */}
          {result && result.findings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lọc:</span>
              {Object.keys(FINDING_CONFIG).map((type) => {
                const count = result.findings.filter((f) => f.findingType === type).length;
                if (count === 0) return null;
                const active = selectedTypes[type] !== false;
                const cfg = FINDING_CONFIG[type];

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedTypes((prev) => ({ ...prev, [type]: !active }))}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      active ? cfg.text : "bg-slate-800 text-slate-500 line-through"
                    }`}
                  >
                    {active ? <Eye size={12} /> : <EyeSlash size={12} />}
                    <span>
                      {cfg.label} ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* === RIGHT COLUMN: CLINICAL DASHBOARD (5 COLS) === */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Card 1: Oral Health Scorecard */}
          {!result ? (
            /* STATE 1: CHƯA PHÂN TÍCH (NEUTRAL SLATE) */
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Heartbeat size={18} weight="bold" className="text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Chỉ Số Sức Khỏe Răng</span>
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  Chờ quét AI
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-400">--%</span>
                <span className="text-xs font-semibold text-slate-500">(Chưa phân tích)</span>
              </div>

              {/* Progress Bar (Empty) */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-0 rounded-full bg-slate-300" />
              </div>

              <p className="mt-2.5 text-[11px] font-medium text-slate-500 leading-relaxed">
                Nhấp vào <b className="text-brand">&quot;Phân tích X-quang AI&quot;</b> để bắt đầu quy trình hỗ trợ đọc phim.
              </p>
            </div>
          ) : result.status === "ANALYSIS_FAILED" ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-900 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Warning size={18} weight="bold" className="text-orange-600" />
                  <span className="text-xs font-black uppercase tracking-wider">Lỗi dịch vụ Vision AI</span>
                </div>
                <button type="button" onClick={handleAnalyze} disabled={loading} className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                  Thử lại
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-orange-800">{result.summary}</p>
              <p className="mt-1 text-[11px] font-semibold text-orange-700">Ảnh chưa được đánh giá; lỗi này không có nghĩa ảnh không phải X-quang.</p>
            </div>
          ) : result.status === "MODEL_UNAVAILABLE" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Warning size={18} weight="bold" className="text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider">Model AI chưa sẵn sàng</span>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  Thử lại
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-800">{result.summary}</p>
              <p className="mt-1 text-[11px] font-semibold text-amber-700">
                Chưa có kết quả phân tích. Không thể tính điểm hoặc ghi dữ liệu vào bệnh án.
              </p>
            </div>
          ) : result.isRadiograph === false || result.status === "INVALID_IMAGE" ? (
            /* STATE 2: ẢNH KHÔNG PHẢI X-QUANG (ROSE ALERT) */
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-xs text-rose-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800">
                  <Warning size={18} weight="bold" className="text-rose-600" />
                  <span className="text-xs font-black uppercase tracking-wider">Chỉ Số Sức Khỏe Răng</span>
                </div>
                <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                  Không khả dụng
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-700">N/A</span>
                <span className="text-xs font-semibold text-rose-600">(Ảnh không phải X-quang)</span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-200">
                <div className="h-full w-0" />
              </div>

              <p className="mt-2.5 text-[11px] font-medium text-rose-700 leading-relaxed">
                ⚠️ Không thể đánh giá điểm sức khỏe do tệp hình ảnh không phải là phim X-quang răng y tế.
              </p>
            </div>
          ) : riskAssessment.score === null ? (
            <div className="rounded-2xl border border-brand/20 bg-brand-light/40 p-4 text-brand-dark shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Heartbeat size={18} weight="bold" className="text-brand" />
                  <span className="text-xs font-black uppercase tracking-wider">Kết quả rà soát AI</span>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-brand-dark ring-1 ring-brand/15">
                  Chưa chấm điểm
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black">Không phát hiện bất thường vượt ngưỡng</span>
              </div>
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-600">
                Kết quả này không đồng nghĩa phim hoàn toàn bình thường và không loại trừ bệnh lý. Bác sĩ cần tiếp tục đối chiếu phim và khám lâm sàng.
              </p>
            </div>
          ) : (
            /* STATE 3: ĐÃ PHÂN TÍCH THÀNH CÔNG */
            <div className={`rounded-2xl border p-4 shadow-xs transition-all ${riskAssessment.colorClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heartbeat size={18} weight="bold" />
                  <span className="text-xs font-black uppercase tracking-wider">Chỉ Số Sức Khỏe Răng</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${riskAssessment.badgeColor}`}>
                  {riskAssessment.riskLabel}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black">{riskAssessment.score}%</span>
                <span className="text-xs font-semibold opacity-75">
                  ({acceptedFindings.length > 0 ? `${acceptedFindings.length} vị trí đã duyệt` : "Không có bệnh lý"})
                </span>
              </div>

              {/* Gauge Progress Bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  style={{ width: `${riskAssessment.score}%` }}
                  className={`h-full rounded-full transition-all duration-700 ${
                    riskAssessment.score >= 80 ? "bg-emerald-500" : riskAssessment.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                />
              </div>

              {/* Urgent Warning */}
              {riskAssessment.urgentTeeth.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-rose-800">Ưu tiên điều trị:</span>
                  {riskAssessment.urgentTeeth.map((u, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-900 border border-rose-300"
                    >
                      R{u.fdi} ({u.reason})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Card 2: Results Tabs (Findings / Diagnosis / Treatment) */}
          <div className="flex flex-1 flex-col rounded-2xl border border-border/80 bg-white p-4 shadow-xs">
            {/* Segmented Control Tabs */}
            <div className="flex rounded-xl bg-brand-light/55 p-1 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("findings")}
                className={`flex-1 rounded-lg py-1.5 text-center transition cursor-pointer ${
                  activeTab === "findings" ? "bg-white text-brand-dark shadow-xs font-extrabold" : "hover:text-brand-dark"
                }`}
              >
                🦷 Răng Bệnh Lý ({result?.findings.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("diagnosis")}
                className={`flex-1 rounded-lg py-1.5 text-center transition cursor-pointer ${
                  activeTab === "diagnosis" ? "bg-white text-brand-dark shadow-xs font-extrabold" : "hover:text-brand-dark"
                }`}
              >
                📋 Chẩn Đoán ICD
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("treatment")}
                className={`flex-1 rounded-lg py-1.5 text-center transition cursor-pointer ${
                  activeTab === "treatment" ? "bg-white text-brand-dark shadow-xs font-extrabold" : "hover:text-brand-dark"
                }`}
              >
                💉 Phác Đồ Đề Xuất
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="mt-3.5 flex-1 overflow-y-auto max-h-[290px] pr-1">
              {!result ? (
                <div className="flex h-44 flex-col items-center justify-center text-center text-slate-400">
                  <Info size={28} className="mb-1 text-slate-300" />
                  <p className="text-xs font-medium">Chưa có dữ liệu phân tích</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Bấm nút &quot;Phân tích X-quang AI&quot; để bắt đầu</p>
                </div>
              ) : result.status === "ANALYSIS_FAILED" ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-900">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                    <Warning size={18} className="shrink-0 text-orange-600" />
                    <span>KHÔNG THỂ KẾT NỐI DỊCH VỤ VISION AI</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-orange-700">{result.summary}</p>
                  <button type="button" onClick={handleAnalyze} disabled={loading} className="mt-3 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                    Thử lại
                  </button>
                </div>
              ) : result.status === "MODEL_UNAVAILABLE" ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <Warning size={18} className="shrink-0 text-amber-600" />
                    <span>MODEL PHÂN TÍCH CHƯA SẴN SÀNG</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-700">{result.summary}</p>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
                  >
                    Thử lại
                  </button>
                </div>
              ) : result.isRadiograph === false || result.status === "INVALID_IMAGE" ? (
                /* RED WARNING CARD FOR INVALID NON-DENTAL IMAGES */
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-800 text-xs">
                    <Warning size={18} className="text-rose-600 shrink-0" />
                    <span>ẢNH KHÔNG PHẢI PHIM X-QUANG RĂNG</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-rose-700">
                    {result.summary}
                  </p>
                </div>
              ) : activeTab === "findings" ? (
                /* TAB 1: FINDINGS LIST WITH DOCTOR ACCEPT / REJECT / EDIT */
                result.findings.length === 0 ? (
                  <div className="flex h-44 flex-col items-center justify-center text-center text-emerald-700 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <CheckCircle size={32} className="mb-1 text-emerald-600" />
                    <p className="text-xs font-bold">Không phát hiện tổn thương bệnh lý</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Cung hàm và cấu trúc răng ổn định 100%.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {result.findings.map((item, idx) => {
                      const isRejected = item.doctorStatus === "REJECTED";
                      const cfg = FINDING_CONFIG[item.findingType] || {
                        label: item.findingType,
                        text: "text-slate-800 bg-white border-slate-200",
                        badge: "bg-slate-600 text-white",
                        icon: "🔍",
                      };
                      const isHovered = hoveredFinding === item;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredFinding(item)}
                          onMouseLeave={() => setHoveredFinding(null)}
                          className={`flex flex-col gap-2 rounded-xl border p-3 transition shadow-2xs ${
                            isRejected
                              ? "bg-slate-100/80 border-slate-200 opacity-60"
                              : isHovered
                              ? "bg-white border-blue-500 ring-2 ring-blue-500/20"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-lg font-extrabold text-xs text-white ${
                                  isRejected ? "bg-slate-500 line-through" : "bg-slate-900"
                                }`}
                              >
                                R{item.fdiToothNumber}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-bold ${isRejected ? "line-through text-slate-500" : "text-slate-900"}`}>
                                    {cfg.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400">({item.findingType})</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-500">Độ tin cậy:</span>
                                  <span className="text-[10px] font-bold text-slate-700">
                                    {(item.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Severity & Review Status Badge */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  isRejected || item.severity === "UNASSESSED"
                                    ? "bg-slate-200 text-slate-600"
                                    : item.severity === "HIGH"
                                    ? "bg-rose-100 text-rose-700"
                                    : item.severity === "MEDIUM"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {item.severity === "UNASSESSED"
                                  ? "Chưa đánh giá"
                                  : item.severity === "HIGH"
                                    ? "Nặng"
                                    : item.severity === "MEDIUM"
                                      ? "Vừa"
                                      : "Nhẹ"}
                              </span>
                            </div>
                          </div>

                          {/* Doctor Clinical Note if any */}
                          {item.doctorNote && (
                            <p className="rounded-lg border border-brand/15 bg-brand-light/45 p-2 text-[11px] italic text-brand-dark">
                              💬 <b>BS ghi chú:</b> {item.doctorNote}
                            </p>
                          )}

                          {/* DOCTOR REVIEW ACTION BUTTONS (ACCEPT / REJECT / EDIT / DELETE) */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                            <div className="flex items-center gap-1">
                              {/* 1. Nút Duyệt / Chấp nhận */}
                              <button
                                type="button"
                                onClick={() => handleAcceptFinding(idx)}
                                title="Bác sĩ xác nhận tổn thương này"
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                  !isRejected
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300"
                                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                              >
                                <Check size={13} weight="bold" />
                                <span>{isRejected ? "Duyệt lại" : "Đã duyệt"}</span>
                              </button>

                              {/* 2. Nút Từ chối / Bác bỏ */}
                              <button
                                type="button"
                                onClick={() => handleRejectFinding(idx)}
                                title="Bác sĩ bác bỏ tổn thương này (Dương tính giả)"
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                  isRejected
                                    ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                                    : "text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                                }`}
                              >
                                <XCircle size={13} weight="bold" />
                                <span>{isRejected ? "Đã từ chối" : "Từ chối"}</span>
                              </button>

                              {/* 3. Nút Chỉnh sửa */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(idx)}
                                title="Chỉnh sửa số răng, chẩn đoán, mức độ"
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-dark transition hover:bg-brand-light"
                              >
                                <PencilSimple size={13} />
                                <span>Sửa</span>
                              </button>
                            </div>

                            {/* 4. Nút Xóa hẳn */}
                            <button
                              type="button"
                              onClick={() => handleDeleteFinding(idx)}
                              className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              title="Xóa hẳn khỏi danh sách"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : activeTab === "diagnosis" ? (
                /* TAB 2: CLINICAL SUMMARY & ICD */
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Tóm tắt chuyên môn X-quang:
                    </p>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                      {result.summary}
                    </p>
                  </div>

                  {result.diagnosisSuggestion && (
                    <div className="rounded-xl border border-brand/20 bg-brand-light/45 p-3.5">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark">
                        Gợi ý chẩn đoán ICD-10:
                      </p>
                      <p className="whitespace-pre-line text-xs font-bold leading-relaxed text-brand-dark">
                        {result.diagnosisSuggestion}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 3: TREATMENT RECOMMENDATIONS */
                <div className="space-y-2.5">
                  {result.treatmentRecommendations && result.treatmentRecommendations.length > 0 ? (
                    result.treatmentRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                        <FirstAid size={16} className="mt-0.5 text-blue-600 shrink-0" />
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">{rec}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Không có chỉ định điều trị đặc biệt.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar (Applies ONLY accepted findings) */}
            {result &&
              result.status !== "MODEL_UNAVAILABLE" &&
              result.status !== "INVALID_IMAGE" &&
              result.status !== "ANALYSIS_FAILED" &&
              result.isRadiograph !== false &&
              result.findings.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-200 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {onApplyToDentalChart && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyToDentalChart(acceptedFindings);
                        setChartSynced(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 transition hover:bg-blue-100 cursor-pointer shadow-2xs"
                    >
                      {chartSynced ? (
                        <>
                          <CheckCircle size={15} weight="fill" className="text-blue-600" />
                          <span>Đã thêm vào bản nháp</span>
                        </>
                      ) : (
                        <>
                          <Sparkle size={15} className="text-blue-600" />
                          <span>Đồng bộ Sơ đồ răng ({acceptedFindings.length})</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    <Printer size={15} />
                    <span>Xuất PDF / In</span>
                  </button>
                </div>

                {onApplyToMedicalRecord && (
                  <button
                    type="button"
                      onClick={() => {
                      const doctorApprovedSummary =
                        `\n--- KẾT QUẢ X-QUANG (BÁC SĨ ĐÃ PHÊ DUYỆT ${acceptedFindings.length} TỔN THƯƠNG) ---\n` +
                        acceptedFindings
                          .map(
                            (f) =>
                              `• Răng ${f.fdiToothNumber}: ${FINDING_CONFIG[f.findingType]?.label || f.findingType}${
                                f.severity === "UNASSESSED" ? " (Mức độ: bác sĩ chưa đánh giá)" : ` (Mức độ: ${f.severity})`
                              }${
                                f.doctorNote ? ` - BS Ghi chú: ${f.doctorNote}` : ""
                              }`
                          )
                          .join("\n") +
                        (riskAssessment.score === null
                          ? "\nAI chưa chấm điểm sức khỏe; kết quả không loại trừ bệnh lý."
                          : `\nChỉ số sức khỏe: ${riskAssessment.score}% (${riskAssessment.riskLabel})`);

                      onApplyToMedicalRecord(doctorApprovedSummary);
                      setApplied(true);
                      }}
                      disabled={applied}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-teal-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applied ? (
                      <>
                        <CheckCircle size={16} weight="fill" />
                        <span>Đã thêm vào bản nháp</span>
                      </>
                    ) : (
                      <>
                        <FloppyDisk size={16} />
                        <span>Thêm {acceptedFindings.length} kết quả đã duyệt vào bản nháp bệnh án</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: DOCTOR EDIT FINDING */}
      {editingIndex !== null && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <PencilSimple size={16} weight="bold" /> Bác sĩ chỉnh sửa tổn thương
              </h3>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Răng số (Chuẩn FDI 11-48):</label>
                <input
                  type="number"
                  min={11}
                  max={48}
                  value={editFdiNumber}
                  onChange={(e) => setEditFdiNumber(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Loại tổn thương / Bệnh lý:</label>
                <select
                  value={editFindingType}
                  onChange={(e) => setEditFindingType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                >
                  {Object.keys(FINDING_CONFIG).map((key) => (
                    <option key={key} value={key}>
                      {FINDING_CONFIG[key].label} ({key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Mức độ lâm sàng:</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["UNASSESSED", "LOW", "MEDIUM", "HIGH"] as const).map((sev) => {
                    const active = editSeverity === sev;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setEditSeverity(sev)}
                        className={`rounded-xl py-1.5 text-xs font-bold transition cursor-pointer ${
                          active ? "bg-sky-500 text-slate-950 font-black shadow" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {sev === "UNASSESSED" ? "Chưa đánh giá" : sev === "LOW" ? "Nhẹ" : sev === "MEDIUM" ? "Vừa" : "Nặng"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Ghi chú chuyên môn của Bác sĩ:</label>
                <textarea
                  rows={2}
                  value={editDoctorNote}
                  onChange={(e) => setEditDoctorNote(e.target.value)}
                  placeholder="Nhập ghi chú thêm cho răng này (VD: Sâu mặt nhai sát tủy...)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEditFinding}
                className="rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-sky-400 cursor-pointer"
              >
                Lưu & Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ADD FINDING */}
      {showAddModal && currentBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Plus size={16} weight="bold" /> Thêm tổn thương thủ công
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCurrentBox(null);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Răng số (Chuẩn FDI):</label>
                <input
                  type="number"
                  min={11}
                  max={48}
                  value={newFdiNumber}
                  onChange={(e) => setNewFdiNumber(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Ví dụ: 18, 48, 36..."
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Loại tổn thương:</label>
                <select
                  value={newFindingType}
                  onChange={(e) => setNewFindingType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  {Object.keys(FINDING_CONFIG).map((key) => (
                    <option key={key} value={key}>
                      {FINDING_CONFIG[key].label} ({key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Mức độ:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["LOW", "MEDIUM", "HIGH"] as const).map((sev) => {
                    const active = newSeverity === sev;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setNewSeverity(sev)}
                        className={`rounded-xl py-1.5 text-xs font-bold transition ${
                          active ? "bg-amber-500 text-slate-950 font-black" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {sev === "LOW" ? "Nhẹ" : sev === "MEDIUM" ? "Vừa" : "Nặng"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCurrentBox(null);
                }}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveManualFinding}
                className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400"
              >
                Lưu vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE REPORT */}
      {showReportModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-slate-700 bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">Báo Cáo Phân Tích X-Quang Dental Vision AI</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 cursor-pointer"
                >
                  <Printer size={16} weight="bold" /> In Báo Cáo / Lưu PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Printable Document */}
            <div className="space-y-6 text-left">
              <div className="flex items-start justify-between border-b-2 border-blue-600 pb-4">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-blue-900 uppercase">
                    PHÒNG KHÁM NHA KHOA SMART DENTAL
                  </h1>
                  <p className="text-xs text-slate-600">Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM</p>
                  <p className="text-xs text-slate-600">Hotline: 1900 6868 | Website: smartdental.vn</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900">
                    PHIẾU KẾT QUẢ X-QUANG (ĐÃ PHÊ DUYỆT)
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ngày khám: {new Date().toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div>
                  <p className="text-slate-500">Bệnh nhân:</p>
                  <p className="text-sm font-bold text-slate-900">{patientName || "Bệnh nhân"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mã bệnh án (EMR):</p>
                  <p className="text-sm font-bold text-slate-900">{patientId || "P-2026"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Danh sách tổn thương Bác sĩ đã xác nhận ({acceptedFindings.length}):
                </h4>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 border">Răng FDI</th>
                      <th className="p-2 border">Loại tổn thương</th>
                      <th className="p-2 border">Mức độ</th>
                      <th className="p-2 border">Ghi chú BS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedFindings.map((f, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 border font-bold">Răng #{f.fdiToothNumber}</td>
                        <td className="p-2 border">{FINDING_CONFIG[f.findingType]?.label || f.findingType}</td>
                        <td className="p-2 border font-semibold">{f.severity === "UNASSESSED" ? "Chưa đánh giá" : f.severity}</td>
                        <td className="p-2 border text-slate-600">{f.doctorNote || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
                <p className="font-bold text-slate-800 mb-1">Tóm tắt & Phác đồ điều trị:</p>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{result.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
