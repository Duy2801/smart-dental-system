"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Sparkle,
  FileArrowUp,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsCounterClockwise,
  Eye,
  CheckCircle,
  Warning,
  Info,
  X,
  ShieldCheck,
  Check,
  PencilSimple,
  XCircle,
  CaretDown,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import axios from "axios";
import {
  getVisibleFindings,
  hasDrawableBoundingBox,
} from "./dental-xray-analysis-utils";

export interface DentalFinding {
  findingId?: string;
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
  regionSource?: "DETECTED" | "ESTIMATED" | "UNLOCATED" | "MANUAL";
  source?: "AI" | "DOCTOR";
  doctorStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  doctorNote?: string;
}

function isEstimatedRegion(finding: DentalFinding): boolean {
  return (
    finding.regionSource === "ESTIMATED" ||
    (finding.regionSource === undefined &&
      finding.source !== "DOCTOR" &&
      finding.findingType === "Missing tooth" &&
      hasDrawableBoundingBox(finding.boundingBox))
  );
}

export interface AnalyzeXrayResponse {
  isRadiograph?: boolean;
  status:
    | "INVALID_IMAGE"
    | "MODEL_UNAVAILABLE"
    | "HEALTHY"
    | "PATHOLOGY_DETECTED"
    | "ANALYSIS_FAILED";
  errorStatus?:
    | "INVALID_IMAGE"
    | "MODEL_UNAVAILABLE"
    | "ANALYSIS_FAILED"
    | null;
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
  clinicalNoteHint?: string;
  onApplyToMedicalRecord?: (findingsSummary: string) => void;
  onApplyToDentalChart?: (findings: DentalFinding[]) => void;
  onRequestUpload?: () => void;
}

export const FDI_TOOTH_OPTIONS = [
  // Hàm trên - Phải (Quadrant 1)
  { value: 18, label: "18 - Răng khôn trên phải" },
  { value: 17, label: "17 - Răng cối lớn 2 trên phải" },
  { value: 16, label: "16 - Răng cối lớn 1 trên phải" },
  { value: 15, label: "15 - Răng cối nhỏ 2 trên phải" },
  { value: 14, label: "14 - Răng cối nhỏ 1 trên phải" },
  { value: 13, label: "13 - Răng nanh trên phải" },
  { value: 12, label: "12 - Răng cửa bên trên phải" },
  { value: 11, label: "11 - Răng cửa giữa trên phải" },
  // Hàm trên - Trái (Quadrant 2)
  { value: 21, label: "21 - Răng cửa giữa trên trái" },
  { value: 22, label: "22 - Răng cửa bên trên trái" },
  { value: 23, label: "23 - Răng nanh trên trái" },
  { value: 24, label: "24 - Răng cối nhỏ 1 trên trái" },
  { value: 25, label: "25 - Răng cối nhỏ 2 trên trái" },
  { value: 26, label: "26 - Răng cối lớn 1 trên trái" },
  { value: 27, label: "27 - Răng cối lớn 2 trên trái" },
  { value: 28, label: "28 - Răng khôn trên trái" },
  // Hàm dưới - Trái (Quadrant 3)
  { value: 38, label: "38 - Răng khôn dưới trái" },
  { value: 37, label: "37 - Răng cối lớn 2 dưới trái" },
  { value: 36, label: "36 - Răng cối lớn 1 dưới trái" },
  { value: 35, label: "35 - Răng cối nhỏ 2 dưới trái" },
  { value: 34, label: "34 - Răng cối nhỏ 1 dưới trái" },
  { value: 33, label: "33 - Răng nanh dưới trái" },
  { value: 32, label: "32 - Răng cửa bên dưới trái" },
  { value: 31, label: "31 - Răng cửa giữa dưới trái" },
  // Hàm dưới - Phải (Quadrant 4)
  { value: 41, label: "41 - Răng cửa giữa dưới phải" },
  { value: 42, label: "42 - Răng cửa bên dưới phải" },
  { value: 43, label: "43 - Răng nanh dưới phải" },
  { value: 44, label: "44 - Răng cối nhỏ 1 dưới phải" },
  { value: 45, label: "45 - Răng cối nhỏ 2 dưới phải" },
  { value: 46, label: "46 - Răng cối lớn 1 dưới phải" },
  { value: 47, label: "47 - Răng cối lớn 2 dưới phải" },
  { value: 48, label: "48 - Răng khôn dưới phải" },
];

const FINDING_LABELS: Record<string, string> = {
  Caries: "Sâu răng",
  "Periapical radiolucency": "Viêm quanh chóp",
  Impacted: "Răng ngầm / kẹt",
  Filling: "Vết trám răng",
  "Crown / Bridge": "Mão / Cầu răng",
  "Root canal filling": "Chữa tủy (Nội nha)",
  Implant: "Cấy ghép Implant",
  "Missing tooth": "Răng đã mất",
  "Residual root": "Chân răng sót",
};

const FINDING_EXPLANATIONS: Record<string, string> = {
  Caries:
    "Sâu răng: Men răng hoặc ngà răng bị vi khuẩn ăn mòn tạo thành lỗ sâu (trên phim X-quang thấy vệt tối màu trên thân răng).",
  "Periapical radiolucency":
    "Viêm quanh chóp: Vùng xương ngay dưới đáy chân răng bị viêm nhiễm hoặc ổ mủ (trên phim thấy bóng đen tròn dưới chóp chân răng).",
  Impacted:
    "Răng ngầm / mọc lệch: Răng (thường là răng khôn số 8) bị kẹt dưới nướu/xương hoặc mọc đâm ngang vào răng bên cạnh.",
  Filling:
    "Vết trám răng: Răng từng bị sâu hoặc mẻ và đã được nha sĩ hàn/trám vá lại ở phần thân răng trên (trên phim thấy mảng trắng sáng ở thân răng).",
  "Crown / Bridge":
    "Mão / Cầu răng sứ: Răng đã được bọc chụp mũ răng sứ bảo vệ bên ngoài (Mão răng), hoặc làm dải răng sứ nối liền bắc ngang qua chỗ răng đã nhổ mất (Cầu răng).",
  "Root canal filling":
    "Chữa tủy (Nội nha): Răng từng bị hư tủy, đã được lấy sạch tủy đau bên trong và bơm thuốc trám kín dọc ống chân răng (trên phim thấy đường chỉ trắng chạy dọc giữa chân răng).",
  Implant:
    "Cấy ghép Implant: Răng thật đã mất và được cấy một trụ vít Titanium nhân tạo vào xương hàm thay cho chân răng (trên phim thấy hình đinh vít trắng rất rõ).",
  "Missing tooth":
    "Răng đã mất: Răng thật tại vị trí này đã bị nhổ bỏ, không còn chân răng trong xương hàm (nếu cùng vị trí có thêm Mão/Cầu răng nghĩa là có nhịp cầu răng sứ giả bắc ngang qua chỗ trống này).",
  "Residual root":
    "Chân răng sót: Phần thân răng phía trên đã vỡ mục hết, chỉ còn phần gốc chân răng nằm sót lại trong xương hàm.",
};

export const DentalXrayAnalyzer: React.FC<DentalXrayAnalyzerProps> = ({
  patientImages = [],
  clinicalNoteHint,
  onApplyToMedicalRecord,
  onApplyToDentalChart,
  onRequestUpload,
}) => {
  const effectivePatientImages = patientImages;

  const [imageUrl, setImageUrl] = useState<string>(
    effectivePatientImages[0]?.url || "",
  );
  const [imageId, setImageId] = useState<string | null>(
    effectivePatientImages[0]?.id ?? null,
  );
  const activeImageIdRef = useRef<string | null>(imageId);
  const activeAnalysisIdRef = useRef<string | null>(null);
  const prevImagesCountRef = useRef<number>(effectivePatientImages.length);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeXrayResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedFindingIndex, setSelectedFindingIndex] = useState<
    number | null
  >(null);
  const [openInfoIndex, setOpenInfoIndex] = useState<number | null>(null);
  // Doctor Edit Modal
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFdiNumber, setEditFdiNumber] = useState<number>(48);
  const [editFindingType, setEditFindingType] = useState<string>("Caries");
  const [editSeverity, setEditSeverity] = useState<
    "UNASSESSED" | "LOW" | "MEDIUM" | "HIGH"
  >("MEDIUM");
  const [editDoctorNote, setEditDoctorNote] = useState<string>("");

  // Actions
  const [applied, setApplied] = useState(false);
  const [includeDentalChart, setIncludeDentalChart] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);

  React.useEffect(
    () => () => {
      activeAnalysisIdRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    if (editingIndex === null) return;
    const dialog = editDialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    dialog?.querySelector<HTMLSelectElement>("#xray-edit-tooth")?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [editingIndex]);

  React.useEffect(() => {
    const prevCount = prevImagesCountRef.current;
    prevImagesCountRef.current = effectivePatientImages.length;
    const addedNewImage =
      effectivePatientImages.length > prevCount &&
      !loading &&
      !reviewSaving;
    const newest =
      effectivePatientImages[effectivePatientImages.length - 1];
    const next = addedNewImage ? newest : effectivePatientImages[0];
    const selectedStillAvailable = effectivePatientImages.some(
      (image) => (image.id ?? null) === imageId && image.url === imageUrl,
    );
    if (
      (!addedNewImage && selectedStillAvailable) ||
      (!next && !imageId && !imageUrl)
    )
      return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the workspace when the parent replaces, removes, or appends a newly uploaded image.
    setImageUrl(next?.url ?? "");
    setImageId(next?.id ?? null);
    activeImageIdRef.current = next?.id ?? null;
    activeAnalysisIdRef.current = null;
    setResult(null);
    setSelectedFindingIndex(null);
    setReviewConfirmed(false);
    setReviewError(null);
    setApplied(false);
    setIncludeDentalChart(false);
    setEditingIndex(null);
    setZoomLevel(1);
  }, [effectivePatientImages, imageId, imageUrl, loading, reviewSaving]);

  // Sync image selection
  const handleSelectPatientImage = (image: PatientXrayItem) => {
    if (loading || reviewSaving) return;
    setZoomLevel(1);
    setUploadError(null);
    setEditingIndex(null);
    setImageUrl(image.url);
    setImageId(image.id ?? null);
    activeImageIdRef.current = image.id ?? null;
    activeAnalysisIdRef.current = null;
    setResult(null);
    setSelectedFindingIndex(null);
    setApplied(false);
    setIncludeDentalChart(false);
    setReviewConfirmed(false);
    setReviewError(null);
  };

  // Main Analyze Function
  const handleAnalyze = async () => {
    if (loading || reviewSaving) return;
    if (!imageId) {
      setUploadError("Ảnh phải được lưu vào bệnh án trước khi phân tích AI.");
      return;
    }
    const submittedImageId = imageId;

    setLoading(true);
    setApplied(false);
    setIncludeDentalChart(false);
    setReviewConfirmed(false);
    setReviewError(null);
    setResult(null);
    setSelectedFindingIndex(null);
    activeAnalysisIdRef.current = null;

    try {
      const res = await apiClient.post<AnalyzeXrayResponse>(
        "/ai/doctor/analyze-xray",
        {
          imageId,
          clinicalNoteHint: clinicalNoteHint?.trim() || undefined,
        },
        { timeout: 90000 },
      );

      if (activeImageIdRef.current !== submittedImageId) return;
      const payload = res.data;
      activeAnalysisIdRef.current = payload.analysisId;

      const isAnalysisFailed = payload?.status === "ANALYSIS_FAILED";
      const isModelUnavailable = payload?.status === "MODEL_UNAVAILABLE";
      const isInvalid =
        payload?.isRadiograph === false ||
        payload?.status === "INVALID_IMAGE" ||
        (payload?.summary || "").toLowerCase().includes("cảnh báo y khoa") ||
        (payload?.summary || "").toLowerCase().includes("không phải là phim") ||
        (payload?.summary || "").toLowerCase().includes("không phải phim");

      if (isAnalysisFailed) {
        setResult({
          analysisId: payload.analysisId,
          modelVersion: payload.modelVersion,
          analyzedAt: payload.analyzedAt,
          isRadiograph: payload.isRadiograph,
          status: "ANALYSIS_FAILED",
          errorStatus: "ANALYSIS_FAILED",
          totalFindings: 0,
          disclaimer: payload.disclaimer || "Chưa có kết quả phân tích.",
          summary: payload.summary || "Dịch vụ Vision AI không thể xử lý ảnh.",
          findings: [],
          annotatedImageUrl: imageUrl,
        });
      } else if (isModelUnavailable) {
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
          summary:
            payload?.summary || "Model phân tích X-quang hiện chưa sẵn sàng.",
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
          disclaimer:
            payload?.disclaimer ||
            "Hệ thống tự động phát hiện và chặn các ảnh không phải X-quang răng.",
          summary:
            payload?.summary ||
            "CẢNH BÁO Y KHOA: Hình ảnh tải lên không phải là phim chụp X-quang răng nha khoa hợp lệ.",
          findings: [],
          annotatedImageUrl: imageUrl,
        });
      } else {
        const rawFindings = (payload?.findings || []).map((f) => ({
          ...f,
          source: "AI" as const,
          doctorStatus: "PENDING" as const,
        }));

        setResult({
          analysisId: payload.analysisId,
          modelVersion: payload.modelVersion,
          analyzedAt: payload.analyzedAt,
          isRadiograph: true,
          status:
            payload?.status ||
            (rawFindings.length > 0 ? "PATHOLOGY_DETECTED" : "HEALTHY"),
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
          disclaimer:
            payload?.disclaimer ||
            "Kết quả phân tích X-quang bởi Dental Vision AI (Hybrid Cloud Pipeline).",
        });
      }
    } catch (err: unknown) {
      if (activeImageIdRef.current !== submittedImageId) return;
      activeAnalysisIdRef.current = "client-error";
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
    if (!result || reviewConfirmed || reviewSaving) return;
    const updated = [...result.findings];
    updated[index] = { ...updated[index], doctorStatus: "ACCEPTED" };
    setResult({ ...result, findings: updated });
    setReviewConfirmed(false);
    setReviewError(null);
  };

  const handleRejectFinding = (index: number) => {
    if (!result || reviewConfirmed || reviewSaving) return;
    const updated = [...result.findings];
    updated[index] = { ...updated[index], doctorStatus: "REJECTED" };
    setResult({ ...result, findings: updated });
    setReviewConfirmed(false);
    setReviewError(null);
  };

  const handleOpenEditModal = (index: number) => {
    if (!result || reviewConfirmed || reviewSaving) return;
    const item = result.findings[index];
    setEditingIndex(index);
    setEditFdiNumber(item.fdiToothNumber);
    setEditFindingType(item.findingType);
    setEditSeverity(item.severity);
    setEditDoctorNote(item.doctorNote || "");
  };

  const handleSaveEditFinding = () => {
    if (!result || editingIndex === null || reviewConfirmed || reviewSaving)
      return;
    const updated = [...result.findings];
    updated[editingIndex] = {
      ...updated[editingIndex],
      fdiToothNumber: editFdiNumber,
      findingType: editFindingType,
      severity: editSeverity,
      doctorNote: editDoctorNote,
      source: "DOCTOR",
      doctorStatus: "ACCEPTED",
    };
    setResult({ ...result, findings: updated });
    setReviewConfirmed(false);
    setReviewError(null);
    setEditingIndex(null);
  };

  const visibleFindings = useMemo(() => {
    if (selectedFindingIndex !== null) {
      const finding = result?.findings[selectedFindingIndex];
      return finding && hasDrawableBoundingBox(finding.boundingBox)
        ? [{ finding, originalIndex: selectedFindingIndex }]
        : [];
    }
    return getVisibleFindings(result?.findings || [], {});
  }, [result, selectedFindingIndex]);
  const acceptedFindings = useMemo(() => {
    return result?.findings.filter((f) => f.doctorStatus === "ACCEPTED") || [];
  }, [result]);

  const pendingFindings = useMemo(() => {
    return result?.findings.filter((f) => f.doctorStatus === "PENDING") || [];
  }, [result]);

  const allFindingsReviewed =
    Boolean(result?.findings.length) && pendingFindings.length === 0;

  const handleConfirmReview = async () => {
    if (
      reviewSaving ||
      reviewConfirmed ||
      !result ||
      !allFindingsReviewed ||
      result.analysisId === "client-error"
    )
      return;
    const submittedAnalysisId = result.analysisId;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await apiClient.patch(
        `/ai/doctor/xray-analyses/${result.analysisId}/review`,
        {
          findings: result.findings.map((finding) => ({
            findingId: finding.findingId,
            fdiToothNumber: finding.fdiToothNumber,
            findingType: finding.findingType,
            confidence: finding.confidence,
            boundingBox: finding.boundingBox,
            severity: finding.severity,
            regionSource: finding.regionSource,
            source: finding.source,
            doctorStatus: finding.doctorStatus,
            doctorNote: finding.doctorNote,
          })),
        },
        { timeout: 30000 },
      );
      if (activeAnalysisIdRef.current === submittedAnalysisId) {
        setReviewConfirmed(true);
        if (acceptedFindings.length > 0) {
          if (onApplyToMedicalRecord) {
            const summary = [
              `--- KẾT QUẢ X-QUANG: ${acceptedFindings.length} PHÁT HIỆN BÁC SĨ ĐÃ XÁC NHẬN ---`,
              ...acceptedFindings.map(
                (finding) =>
                  `• Răng ${finding.fdiToothNumber}: ${FINDING_LABELS[finding.findingType] || finding.findingType}` +
                  (finding.severity === "UNASSESSED"
                    ? " (chưa đánh giá mức độ)"
                    : ` (mức độ: ${finding.severity === "HIGH" ? "nặng" : finding.severity === "MEDIUM" ? "vừa" : "nhẹ"})`) +
                  (finding.doctorNote ? ` — ${finding.doctorNote}` : ""),
              ),
              "AI chỉ hỗ trợ đọc phim; kết quả không loại trừ các bệnh lý khác.",
            ].join("\n");
            onApplyToMedicalRecord(summary);
            setApplied(true);
          }
          if (includeDentalChart && onApplyToDentalChart) {
            onApplyToDentalChart(acceptedFindings);
          }
        }
      }
    } catch (err: unknown) {
      if (activeAnalysisIdRef.current !== submittedAnalysisId) return;
      const message = axios.isAxiosError(err) && err.response?.data?.message;
      setReviewError(
        typeof message === "string"
          ? message
          : "Không thể lưu xác nhận rà soát. Vui lòng thử lại.",
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const validResult =
    result &&
    result.isRadiograph !== false &&
    (result.status === "HEALTHY" || result.status === "PATHOLOGY_DETECTED");
  const workflowStep = !imageUrl ? 1 : validResult ? 3 : 2;
  const estimatedCount = result?.findings.filter(isEstimatedRegion).length ?? 0;
  const reviewedCount = (result?.findings.length ?? 0) - pendingFindings.length;

  return (
    <section className="space-y-5" aria-label="Phân tích ảnh X-quang">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">
            AI hỗ trợ đọc phim X-quang
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Chọn phim, chạy phân tích rồi kiểm tra từng gợi ý trước khi đưa vào
            bệnh án.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRequestUpload && (
            <button
              type="button"
              onClick={onRequestUpload}
              disabled={loading || reviewSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <FileArrowUp size={16} /> Thêm / đổi ảnh
            </button>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || reviewSaving || !imageId}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${validResult ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" : "bg-brand text-white hover:bg-brand-dark"}`}
          >
            {loading ? (
              <ArrowsCounterClockwise size={17} className="animate-spin" />
            ) : (
              <Sparkle size={17} />
            )}
            {loading
              ? "Đang phân tích..."
              : result
                ? "Phân tích lại"
                : "Phân tích ảnh"}
          </button>
        </div>
      </div>

      <ol
        aria-label="Các bước phân tích"
        className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500"
      >
        {["Chọn phim", "AI phân tích", "Bác sĩ kiểm tra"].map(
          (label, index) => (
            <li
              key={label}
              aria-current={workflowStep === index + 1 ? "step" : undefined}
              className={`flex items-center gap-2 ${workflowStep === index + 1 ? "font-semibold text-brand-dark" : ""}`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ${workflowStep === index + 1 ? "bg-brand text-white" : "bg-slate-200/70 text-slate-500"}`}
              >
                {workflowStep > index + 1 ? <Check size={13} /> : index + 1}
              </span>
              <span>{label}</span>
            </li>
          ),
        )}
      </ol>

      {uploadError && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          {uploadError}
        </p>
      )}
      {effectivePatientImages.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Chọn phim cần phân tích"
        >
          {effectivePatientImages.map((image, index) => (
            <button
              key={image.id ?? image.url}
              type="button"
              title={image.title || `Phim ${index + 1}`}
              aria-pressed={imageId === image.id && imageUrl === image.url}
              onClick={() => handleSelectPatientImage(image)}
              disabled={loading || reviewSaving}
              className={`max-w-full truncate rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${imageUrl === image.url ? "border-brand bg-brand/5 text-brand-dark" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {image.title || `Phim ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <div className="min-w-0 space-y-2 xl:sticky xl:top-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 p-3 text-xs text-slate-200">
              <span className="font-semibold">Ảnh X-quang</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Thu nhỏ"
                  title="Thu nhỏ"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  disabled={!imageUrl || zoomLevel <= 1}
                  className="rounded-lg p-2 transition hover:bg-slate-800 disabled:opacity-30"
                >
                  <MagnifyingGlassMinus size={18} />
                </button>
                <span className="w-10 text-center tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Phóng to"
                  title="Phóng to"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  disabled={!imageUrl || zoomLevel >= 3}
                  className="rounded-lg p-2 transition hover:bg-slate-800 disabled:opacity-30"
                >
                  <MagnifyingGlassPlus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  disabled={!imageUrl || zoomLevel === 1}
                  className="ml-1 rounded-lg border border-slate-700 px-2 py-1.5 transition hover:bg-slate-800 disabled:opacity-30"
                >
                  Vừa khung
                </button>
              </div>
            </div>
            <div className="max-h-[520px] min-h-52 overflow-auto sm:min-h-72">
              {imageUrl ? (
                <div
                  ref={containerRef}
                  className="relative"
                  style={{ width: `${zoomLevel * 100}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Phim X-quang đang phân tích"
                    draggable={false}
                    className="block h-auto w-full"
                  />
                  {visibleFindings.map(({ finding, originalIndex }) => {
                    const estimated = isEstimatedRegion(finding);
                    const selected = selectedFindingIndex === originalIndex;
                    const rejected = finding.doctorStatus === "REJECTED";
                    return (
                      <button
                        key={finding.findingId ?? originalIndex}
                        type="button"
                        aria-label={`Xem phát hiện ở răng ${finding.fdiToothNumber}`}
                        title={
                          estimated
                            ? `Điểm dự kiến của răng ${finding.fdiToothNumber}; bác sĩ cần xác nhận.`
                            : `Vùng răng ${finding.fdiToothNumber} cần kiểm tra; khung này không phải biên tổn thương.`
                        }
                        onClick={() => setSelectedFindingIndex(originalIndex)}
                        style={{
                          left: `${finding.boundingBox.x + (estimated ? finding.boundingBox.width / 2 : 0)}%`,
                          top: `${finding.boundingBox.y + (estimated ? finding.boundingBox.height / 2 : 0)}%`,
                          width: estimated
                            ? 14
                            : `${finding.boundingBox.width}%`,
                          height: estimated
                            ? 14
                            : `${finding.boundingBox.height}%`,
                        }}
                        className={`absolute border-2 ${estimated ? "-translate-x-1/2 -translate-y-1/2 rounded-full border-dashed" : "rounded-sm"} ${rejected ? "border-slate-400 bg-slate-500/10 opacity-40" : "border-sky-400 bg-sky-400/10"} ${selected ? "z-20 ring-2 ring-white" : "z-10"}`}
                      >
                        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {estimated ? "≈" : ""}R{finding.fdiToothNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center gap-2 p-6 text-center text-slate-300 sm:min-h-72">
                  <FileArrowUp size={30} />
                  <p className="text-sm font-semibold">
                    Chưa có phim Panorama hỗ trợ AI
                  </p>
                  <p className="text-xs">
                    Tải phim X-quang toàn hàm để bắt đầu phân tích.
                  </p>
                  {onRequestUpload && (
                    <button
                      type="button"
                      onClick={onRequestUpload}
                      className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      Chọn ảnh từ máy
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {validResult && result.findings.length > 0 && (
            <div className="space-y-1 text-xs leading-relaxed text-slate-500">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Vùng răng AI đề nghị kiểm tra</span>
                {selectedFindingIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedFindingIndex(null)}
                    className="font-semibold text-brand hover:underline"
                  >
                    Xem tất cả vùng
                  </button>
                )}
              </div>
              <p>
                Khung đánh dấu chỉ vùng răng cần xem, không phải ranh giới tổn
                thương.
              </p>
              {estimatedCount > 0 && (
                <p>
                  Dấu ≈ chỉ vị trí ước lượng; bác sĩ cần đối chiếu lại trên
                  phim.
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className="min-w-0 space-y-4"
          aria-live="polite"
          aria-busy={loading || reviewSaving}
        >
          {!result ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
              {loading ? (
                <>
                  <ArrowsCounterClockwise
                    size={22}
                    className="mb-3 animate-spin text-brand"
                  />
                  <h3 className="font-semibold text-slate-900">
                    AI đang đọc phim
                  </h3>
                  <p className="mt-1">
                    Vui lòng đợi trong giây lát. Kết quả sẽ hiện tại đây.
                  </p>
                </>
              ) : (
                <>
                  <Info size={22} className="mb-3 text-slate-400" />
                  <h3 className="font-semibold text-slate-900">
                    Bắt đầu phân tích
                  </h3>
                  <p className="mt-1">
                    {imageUrl
                      ? "Bấm Phân tích ảnh. Sau đó, chọn Chấp nhận hoặc Không đúng cho từng gợi ý của AI."
                      : "Thêm phim X-quang để AI tìm các vùng cần bác sĩ kiểm tra."}
                  </p>
                </>
              )}
            </div>
          ) : !validResult ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
            >
              <h3 className="flex items-center gap-2 font-semibold">
                <Warning size={19} className="shrink-0" />
                {result.status === "ANALYSIS_FAILED"
                  ? "Chưa phân tích được ảnh"
                  : result.status === "MODEL_UNAVAILABLE"
                    ? "AI hiện chưa sẵn sàng"
                    : "Ảnh không phù hợp để phân tích"}
              </h3>
              <p className="mt-2">{result.summary}</p>
              <p className="mt-2 text-xs">
                {result.status === "INVALID_IMAGE"
                  ? "Hãy chọn phim X-quang răng toàn hàm (Panorama)."
                  : "Chưa có kết quả. Bạn có thể bấm Phân tích lại khi dịch vụ hoạt động."}
              </p>
            </div>
          ) : result.findings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">
                Không phát hiện bất thường vượt ngưỡng
              </h3>
              <p className="mt-2 leading-relaxed">
                AI chưa ghi nhận vùng cần đánh dấu. Kết quả này không loại trừ
                bệnh lý; bác sĩ vẫn cần kiểm tra phim và đối chiếu lâm sàng.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Kiểm tra {result.findings.length} gợi ý từ AI
                </h3>
                <p className="text-sm text-slate-500">
                  {reviewConfirmed
                    ? "Đã kiểm tra xong"
                    : `Đã kiểm tra ${reviewedCount}/${result.findings.length} gợi ý`}
                </p>
              </div>
              <div className="space-y-3">
                {result.findings.map((finding, index) => {
                  const accepted = finding.doctorStatus === "ACCEPTED";
                  const rejected = finding.doctorStatus === "REJECTED";
                  const label =
                    FINDING_LABELS[finding.findingType] || finding.findingType;
                  const explanation =
                    FINDING_EXPLANATIONS[finding.findingType] ||
                    `${label}: Tình trạng răng miệng được AI ghi nhận trên phim X-quang tại vị trí răng ${finding.fdiToothNumber}.`;
                  const isInfoOpen = openInfoIndex === index;
                  return (
                    <article
                      key={finding.findingId ?? index}
                      className={`space-y-3 rounded-xl border p-4 ${selectedFindingIndex === index ? "border-brand ring-2 ring-brand/10" : "border-slate-200"} ${rejected ? "bg-slate-50" : "bg-white"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Răng {finding.fdiToothNumber}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <h4
                              className={`text-sm font-semibold ${rejected ? "text-slate-400 line-through" : "text-slate-900"}`}
                            >
                              {label}
                            </h4>
                            <button
                              type="button"
                              title={explanation}
                              aria-label={`Giải thích: ${label}`}
                              aria-expanded={isInfoOpen}
                              onClick={() =>
                                setOpenInfoIndex(isInfoOpen ? null : index)
                              }
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                                isInfoOpen
                                  ? "border-sky-300 bg-sky-100 text-sky-800"
                                  : "border-slate-300 bg-slate-100 text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                              }`}
                            >
                              ?
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={
                            !hasDrawableBoundingBox(finding.boundingBox)
                          }
                          aria-label={`Xem trên phim: R${finding.fdiToothNumber} ${label}`}
                          onClick={() => {
                            setSelectedFindingIndex(index);
                            containerRef.current?.scrollIntoView?.({
                              behavior: "smooth",
                              block: "center",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand/5 disabled:opacity-40"
                        >
                          <Eye size={14} />
                          Xem vị trí
                        </button>
                      </div>
                      {isInfoOpen && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs leading-relaxed text-sky-950">
                          {explanation}
                        </div>
                      )}
                      {!hasDrawableBoundingBox(finding.boundingBox) && (
                        <p className="text-xs text-slate-500">
                          Chưa có vùng đánh dấu trên phim.
                        </p>
                      )}
                      {isEstimatedRegion(finding) && (
                        <p className="text-xs text-slate-500">
                          Vị trí ước lượng, cần bác sĩ kiểm tra lại.
                        </p>
                      )}
                      {finding.doctorNote && (
                        <p className="text-xs leading-relaxed text-slate-600">
                          Ghi chú bác sĩ: {finding.doctorNote}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={accepted}
                          onClick={() => handleAcceptFinding(index)}
                          disabled={reviewConfirmed || reviewSaving}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold transition disabled:opacity-50 ${accepted ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          <Check size={14} />
                          {accepted ? "Đã chấp nhận" : "Chấp nhận"}
                        </button>
                        <button
                          type="button"
                          aria-pressed={rejected}
                          onClick={() => handleRejectFinding(index)}
                          disabled={reviewConfirmed || reviewSaving}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold transition disabled:opacity-50 ${rejected ? "border-slate-400 bg-slate-100 text-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          <XCircle size={14} />
                          {rejected ? "Đã loại bỏ" : "Không đúng"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(index)}
                          disabled={reviewConfirmed || reviewSaving}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          <PencilSimple size={14} />
                          Sửa
                        </button>
                      </div>
                      <details className="group text-xs text-slate-500">
                        <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
                          Chi tiết gợi ý
                          <CaretDown
                            size={12}
                            className="transition group-open:rotate-180"
                          />
                        </summary>
                        <div className="mt-2 space-y-1 leading-relaxed">
                          <p>
                            {finding.source === "DOCTOR"
                              ? "Bác sĩ đã chỉnh sửa gợi ý này."
                              : `Độ tin cậy AI: ${Math.round(finding.confidence * 100)}% (không phải mức độ bệnh).`}
                          </p>
                          <p>
                            Mức độ:{" "}
                            {finding.severity === "UNASSESSED"
                              ? "chưa được bác sĩ đánh giá"
                              : finding.severity === "HIGH"
                                ? "nặng"
                                : finding.severity === "MEDIUM"
                                  ? "vừa"
                                  : "nhẹ"}
                            .
                          </p>
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {onApplyToDentalChart && acceptedFindings.length > 0 && (
                  <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                    <input
                      type="checkbox"
                      checked={includeDentalChart}
                      disabled={reviewSaving || reviewConfirmed}
                      onChange={(event) =>
                        setIncludeDentalChart(event.target.checked)
                      }
                      className="mt-0.5 accent-brand"
                    />
                    Cập nhật cả sơ đồ răng từ các gợi ý đã chấp nhận
                  </label>
                )}
                {pendingFindings.length > 0 && (
                  <p className="text-xs text-slate-600">
                    Còn {pendingFindings.length} gợi ý cần chọn Chấp nhận hoặc
                    Không đúng.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleConfirmReview()}
                  disabled={
                    !allFindingsReviewed || reviewSaving || reviewConfirmed
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewSaving ? (
                    <ArrowsCounterClockwise
                      size={17}
                      className="animate-spin"
                    />
                  ) : applied ? (
                    <CheckCircle size={17} />
                  ) : (
                    <ShieldCheck size={17} />
                  )}
                  {reviewSaving
                    ? "Đang xác nhận..."
                    : applied
                      ? "Đã thêm vào bản nháp"
                      : reviewConfirmed
                        ? "Đã lưu kết quả kiểm tra"
                        : acceptedFindings.length > 0 && onApplyToMedicalRecord
                          ? "Xác nhận và thêm vào bệnh án"
                          : "Xác nhận kết quả"}
                </button>
                {reviewError && (
                  <p role="alert" className="text-xs text-rose-700">
                    {reviewError}
                  </p>
                )}
                {applied && (
                  <p className="text-xs leading-relaxed text-slate-600">
                    Kết quả đã nằm trong phần Ghi bệnh án. Bấm{" "}
                    <strong>Lưu bệnh án</strong> để lưu nội dung.
                  </p>
                )}
                {reviewConfirmed && acceptedFindings.length === 0 && (
                  <p className="text-xs text-slate-600">
                    Bạn đã loại bỏ toàn bộ gợi ý. Không có phát hiện nào được
                    thêm vào bệnh án.
                  </p>
                )}
              </div>
            </>
          )}
          {validResult && (
            <details className="group rounded-xl border border-slate-200 text-sm text-slate-600">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-medium [&::-webkit-details-marker]:hidden">
                Xem giải thích thêm từ AI
                <CaretDown
                  size={14}
                  className="transition group-open:rotate-180"
                />
              </summary>
              <div className="space-y-3 border-t border-slate-200 p-4 text-xs leading-relaxed">
                <p className="whitespace-pre-line">{result.summary}</p>
                {result.diagnosisSuggestion && (
                  <p className="whitespace-pre-line">
                    {result.diagnosisSuggestion}
                  </p>
                )}
              </div>
            </details>
          )}
          <p className="text-xs leading-relaxed text-slate-500">
            AI chỉ hỗ trợ đọc phim. Bác sĩ chịu trách nhiệm kiểm tra kết quả và
            đối chiếu lâm sàng.
          </p>
        </div>
      </div>

      {editingIndex !== null && result && (
        <dialog
          ref={editDialogRef}
          className="m-auto max-h-[95vh] w-full max-w-md overflow-visible rounded-2xl border-0 bg-transparent p-0 backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
          aria-labelledby="xray-edit-heading"
          onCancel={() => setEditingIndex(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3
                id="xray-edit-heading"
                className="text-base font-bold text-slate-900"
              >
                Chỉnh sửa gợi ý
              </h3>
              <button
                type="button"
                aria-label="Đóng chỉnh sửa"
                onClick={() => setEditingIndex(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="space-y-1.5">
                <label htmlFor="xray-edit-tooth" className="font-medium">
                  Số răng
                </label>
                <select
                  autoFocus
                  id="xray-edit-tooth"
                  value={editFdiNumber}
                  onChange={(event) =>
                    setEditFdiNumber(Number(event.target.value))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  {FDI_TOOTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="xray-edit-type" className="font-medium">
                  Phát hiện
                </label>
                <select
                  id="xray-edit-type"
                  value={editFindingType}
                  onChange={(event) => setEditFindingType(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  {!FINDING_LABELS[editFindingType] && (
                    <option value={editFindingType}>{editFindingType}</option>
                  )}
                  {Object.entries(FINDING_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="xray-edit-severity" className="font-medium">
                  Mức độ theo đánh giá của bác sĩ
                </label>
                <select
                  id="xray-edit-severity"
                  value={editSeverity}
                  onChange={(event) =>
                    setEditSeverity(event.target.value as typeof editSeverity)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  <option value="UNASSESSED">Chưa đánh giá</option>
                  <option value="LOW">Nhẹ</option>
                  <option value="MEDIUM">Vừa</option>
                  <option value="HIGH">Nặng</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="xray-edit-note" className="font-medium">
                  Ghi chú thêm (không bắt buộc)
                </label>
                <textarea
                  id="xray-edit-note"
                  rows={3}
                  value={editDoctorNote}
                  onChange={(event) => setEditDoctorNote(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEditFinding}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Lưu và chấp nhận
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
};
