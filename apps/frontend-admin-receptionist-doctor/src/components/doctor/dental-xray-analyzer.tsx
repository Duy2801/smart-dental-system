"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowsCounterClockwise,
  Brain,
  CheckCircle,
  CircleHalf,
  Columns,
  Eye,
  EyeSlash,
  FileArrowUp,
  FloppyDisk,
  Lightning,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Plus,
  Printer,
  Sliders,
  Sparkle,
  Sun,
  Trash,
  Warning,
  XCircle,
} from "@phosphor-icons/react";



import apiClient from "@/src/lib/api/client";
import axios from "axios";

export interface DentalFinding {
  fdiToothNumber: number;
  findingType: string;
  confidence: number;
  boundingBox: {
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface AnalyzeXrayResponse {
  isRadiograph?: boolean;
  status?: string;
  findings: DentalFinding[];
  totalFindings: number;
  summary: string;
  diagnosisSuggestion?: string | null;
  treatmentRecommendations?: string[];
  annotatedImageUrl?: string | null;
  disclaimer: string;
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
  onApplyToMedicalRecord?: (summaryText: string) => void;
  onApplyToDentalChart?: (findings: DentalFinding[]) => void;
}

export const PATIENT_EXPLANATIONS_VI: Record<string, string> = {
  Caries: "Sâu răng - vi khuẩn ăn mòn men răng, cần trám sớm để tránh ăn vào tủy.",
  "Periapical radiolucency": "Viêm quanh chóp - có ổ nhiễm trùng cuống răng, cần chữa tủy để hết đau.",
  Implant: "Cấy ghép Implant - răng nhân tạo đã được phục hình định hình tốt.",
  "Root canal filling": "Đã chữa tủy - ống tủy đã được xử lý và bít kín an toàn.",
  "Crown / Bridge": "Mão / Cầu răng sứ - răng giả bọc ngoài bảo vệ cấu trúc răng thật.",
  Filling: "Vết trám răng - miếng trám cũ đang bảo vệ men răng.",
  "Missing tooth": "Răng thiếu / đã mất - khuyến nghị trồng răng để tránh xô lệch hàm.",
  "Residual root": "Chân răng còn sót - chân răng cũ trong xương hàm, cần tiểu phẫu nhổ bỏ.",
};

const DEFAULT_PATIENT_XRAYS: PatientXrayItem[] = [

  {
    url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200",
    title: "Phim Panorama toàn cảnh",
    date: "23/08/2026",
    type: "xray",
  },
  {
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200",
    title: "Phim Cánh bướm Bitewing R36-R38",
    date: "15/06/2026",
    type: "xray",
  },
  {
    url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1200",
    title: "Phim Cận chóp Periapical R26",
    date: "10/01/2026",
    type: "xray",
  },
];

const DEFAULT_PANO_IMAGE = DEFAULT_PATIENT_XRAYS[0].url;


const FINDING_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  Caries: { border: "border-red-500", bg: "bg-red-500/20", text: "text-red-700 bg-red-50" },
  "Periapical radiolucency": { border: "border-amber-500", bg: "bg-amber-500/20", text: "text-amber-700 bg-amber-50" },
  Implant: { border: "border-emerald-500", bg: "bg-emerald-500/20", text: "text-emerald-700 bg-emerald-50" },
  "Root canal filling": { border: "border-blue-500", bg: "bg-blue-500/20", text: "text-blue-700 bg-blue-50" },
  "Crown / Bridge": { border: "border-purple-500", bg: "bg-purple-500/20", text: "text-purple-700 bg-purple-50" },
  Filling: { border: "border-cyan-500", bg: "bg-cyan-500/20", text: "text-cyan-700 bg-cyan-50" },
  "Missing tooth": { border: "border-slate-400", bg: "bg-slate-400/20", text: "text-slate-700 bg-slate-100" },
  "Residual root": { border: "border-orange-500", bg: "bg-orange-500/20", text: "text-orange-700 bg-orange-50" },
};

const FINDING_LABELS_VI: Record<string, string> = {
  Caries: "Sâu răng",
  "Periapical radiolucency": "Viêm quanh chóp",
  Implant: "Cấy ghép Implant",
  "Root canal filling": "Chữa tủy",
  "Crown / Bridge": "Mão / Cầu răng",
  Filling: "Vết trám răng",
  "Missing tooth": "Răng thiếu / mất",
  "Residual root": "Chân răng còn sót",
};

// Oral Health Risk Assessment Helper
export function calculateOralHealthRisk(findings: DentalFinding[]) {
  if (!findings || findings.length === 0) {
    return {
      score: 100,
      riskLevel: "LOW" as const,
      riskLabel: "An Toàn / Sức Khoẻ Tốt",
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      badgeColor: "bg-emerald-500",
      urgentTeeth: [],
      recommendation: "Không phát hiện tổn thương bất thường. Khuyên dùng vệ sinh răng định kỳ 6 tháng/lần.",
    };
  }

  let penalty = 0;
  const urgentTeeth: { fdi: number; reason: string }[] = [];

  findings.forEach((f) => {
    let itemPenalty = 10;
    if (f.findingType === "Periapical radiolucency" || f.findingType === "Residual root") {
      itemPenalty = 15;
      urgentTeeth.push({
        fdi: f.fdiToothNumber,
        reason: FINDING_LABELS_VI[f.findingType] || f.findingType,
      });
    } else if (f.findingType === "Caries" || f.findingType === "Missing tooth") {
      itemPenalty = 10;
      if (f.severity === "HIGH") {
        urgentTeeth.push({
          fdi: f.fdiToothNumber,
          reason: `Sâu răng Nặng R${f.fdiToothNumber}`,
        });
      }
    } else {
      itemPenalty = 5;
    }

    if (f.severity === "HIGH") itemPenalty += 5;
    penalty += itemPenalty;
  });

  const score = Math.max(15, Math.min(100, 100 - penalty));

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let riskLabel = "An Toàn / Rủi ro Thấp";
  let colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let badgeColor = "bg-emerald-500";
  let recommendation = "Tình trạng răng miệng tương đối ổn định. Theo dõi thêm vệ sinh hàng ngày.";

  if (score < 50) {
    riskLevel = "HIGH";
    riskLabel = "NGHIÊM TRỌNG / Can thiệp Gấp";
    colorClass = "text-rose-700 bg-rose-50 border-rose-200";
    badgeColor = "bg-rose-600";
    recommendation = "Cần ưu tiên điều trị nội nha / nhổ chân răng tồn tại để tránh tiêu xương và nhiễm trùng.";
  } else if (score < 80) {
    riskLevel = "MEDIUM";
    riskLabel = "TRUNG BÌNH / Cần Phác đồ";
    colorClass = "text-amber-700 bg-amber-50 border-amber-200";
    badgeColor = "bg-amber-500";
    recommendation = "Có tổn thương tiến triển. Cần lập phác đồ chữa tủy và bọc mão bảo vệ cấu trúc răng.";
  }

  return {
    score,
    riskLevel,
    riskLabel,
    colorClass,
    badgeColor,
    urgentTeeth,
    recommendation,
  };
}

export function DentalXrayAnalyzer({
  patientId,
  patientName,
  patientImages,
  onApplyToMedicalRecord,
  onApplyToDentalChart,
}: DentalXrayAnalyzerProps) {
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const effectivePatientImages =
    patientImages !== undefined ? patientImages : DEFAULT_PATIENT_XRAYS;

  const [imageUrl, setImageUrl] = useState<string>(
    effectivePatientImages[0]?.url || DEFAULT_PANO_IMAGE
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeXrayResponse | null>(null);

  /** Kiểm tra qua Canvas xem ảnh có phải ảnh đơn sắc/grayscale (phim X-quang) hay ảnh chụp màu/giao diện */
  const checkImageIsRadiograph = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 40;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(true);
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let colorDiffSum = 0;
          let pixelCount = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            colorDiffSum += diff;
            pixelCount++;
          }
          const avgColorDiff = colorDiffSum / pixelCount;
          // Phim X-quang răng là ảnh xám (monochrome), độ lệch màu giữa R, G, B cực nhỏ (< 10).
          // Ảnh màn hình/giao diện macOS/Windows/ảnh màu thường có avgColorDiff > 15-60.
          if (avgColorDiff > 12) {
            resolve(false);
          } else {
            resolve(true);
          }
        } catch {
          resolve(true);
        }
      };
      img.onerror = () => resolve(true);
      img.src = src;
    });
  };

  const isDentalXrayImage = (url: string, fileName?: string | null): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    const nameLower = (fileName || "").toLowerCase();

    const nonDentalKeywords = [
      "macos", "vpn", "screenshot", "screen", "desktop", "laptop", "apple",
      "windows", "tutorial", "guide", "ui", "mockup", "login", "step",
      "document", "pdf", "avatar", "profile", "banner", "logo", "chart", "diagram", "code", "app"
    ];

    if (nonDentalKeywords.some((kw) => urlLower.includes(kw) || nameLower.includes(kw))) {
      return false;
    }

    const isDefaultXray = DEFAULT_PATIENT_XRAYS.some((item) => item.url === url);
    if (isDefaultXray) return true;

    return true;
  };

  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    Caries: true,
    "Periapical radiolucency": true,
    Implant: true,
    "Root canal filling": true,
    "Crown / Bridge": true,
    Filling: true,
    "Missing tooth": true,
    "Residual root": true,
  });
  const [hoveredFinding, setHoveredFinding] = useState<DentalFinding | null>(null);
  const [applied, setApplied] = useState(false);
  const [chartSynced, setChartSynced] = useState(false);


  // DICOM Viewer Image Tool States
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [showSliders, setShowSliders] = useState<boolean>(false);

  // Dual Comparison Mode State (Before vs After)
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareImageUrl, setCompareImageUrl] = useState<string>(
    effectivePatientImages[1]?.url || effectivePatientImages[0]?.url || DEFAULT_PANO_IMAGE
  );

  // Manual Bounding Box Drawing Mode State
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Option 3 Modals
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState<boolean>(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState<boolean>(false);

  // Helper for Treatment Plan Items
  const treatmentPlanItems = useMemo(() => {
    if (!result?.findings) return [];
    return result.findings.map((f) => {
      let procedure = "Trám răng thẩm mỹ Composite";
      let cost = 400000;
      if (f.findingType === "Periapical radiolucency") {
        procedure = "Chữa tủy (Nội nha) + Trám bọc bảo vệ";
        cost = 1500000;
      } else if (f.findingType === "Missing tooth") {
        procedure = "Cấy ghép Implant nha khoa Straumann";
        cost = 12000000;
      } else if (f.findingType === "Residual root") {
        procedure = "Tiểu phẫu nhổ chân răng tồn tại";
        cost = 800000;
      } else if (f.findingType === "Crown / Bridge") {
        procedure = "Bảo dưỡng & Gắn lại mão răng sứ";
        cost = 300000;
      } else if (f.severity === "HIGH") {
        procedure = "Trám răng sâu độ 3 + Lót sinh học";
        cost = 600000;
      }

      return {
        toothFdi: f.fdiToothNumber,
        findingLabel: FINDING_LABELS_VI[f.findingType] || f.findingType,
        procedure,
        cost,
        severity: f.severity,
      };
    });
  }, [result]);

  const totalTreatmentCost = useMemo(() => {
    return treatmentPlanItems.reduce((acc, item) => acc + item.cost, 0);
  }, [treatmentPlanItems]);

  // Helper for Prescription Items
  const prescriptionItems = useMemo(() => {
    if (!result?.findings) return [];
    return [
      {
        name: "Amoxicillin 500mg",
        type: "Kháng sinh",
        dosage: "10 viên",
        usage: "Uống 1 viên x 2 lần/ngày sau ăn (Sáng / Tối)",
      },
      {
        name: "Ibuprofen 400mg",
        type: "Giảm đau, Chống viêm",
        dosage: "10 viên",
        usage: "Uống 1 viên x 2 lần/ngày khi đau (Sau ăn)",
      },
      {
        name: "Chlorhexidine Kin 0.12%",
        type: "Nước súc miệng diệt khuẩn",
        dosage: "1 chai (250ml)",
        usage: "Súc miệng 15ml x 2-3 lần/ngày sau khi đánh răng",
      },
    ];
  }, [result]);

  // New Finding Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFdiNumber, setNewFdiNumber] = useState<number>(48);
  const [newFindingType, setNewFindingType] = useState<string>("Caries");
  const [newSeverity, setNewSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");


  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setStartPos({ x, y });
    setIsDragging(true);
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !isDragging || !startPos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);

    setCurrentBox({ x, y, width, height });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingMode || !isDragging || !currentBox) return;
    setIsDragging(false);
    if (currentBox.width > 1 && currentBox.height > 1) {
      setShowAddModal(true);
    } else {
      setCurrentBox(null);
    }
  };

  const handleSaveManualFinding = () => {
    if (!currentBox) return;
    const newFinding: DentalFinding = {
      fdiToothNumber: Number(newFdiNumber),
      findingType: newFindingType,
      confidence: 1.0,
      boundingBox: currentBox,
      severity: newSeverity,
    };

    if (!result) {
      setResult({
        findings: [newFinding],
        totalFindings: 1,
        summary: `R${newFdiNumber}: ${FINDING_LABELS_VI[newFindingType] || newFindingType}`,
        disclaimer: "Kết quả hỗ trợ chẩn đoán bởi Dental Vision AI & Bác sĩ.",
      });
    } else {
      const updatedFindings = [...result.findings, newFinding];
      const updatedSummary = `${result.summary}\nR${newFdiNumber}: ${
        FINDING_LABELS_VI[newFindingType] || newFindingType
      }`;
      setResult({
        ...result,
        findings: updatedFindings,
        totalFindings: updatedFindings.length,
        summary: updatedSummary,
        disclaimer: result.disclaimer || "Kết quả hỗ trợ chẩn đoán bởi Dental Vision AI & Bác sĩ.",
      });
    }

    setShowAddModal(false);
    setCurrentBox(null);
    setIsDrawingMode(false);
  };


  // Sync state when patientImages changes dynamically
  useEffect(() => {
    if (effectivePatientImages.length > 0) {
      if (!imageUrl || !effectivePatientImages.some((img) => img.url === imageUrl)) {
        setImageUrl(effectivePatientImages[0].url);
      }
      if (
        !compareImageUrl ||
        !effectivePatientImages.some((img) => img.url === compareImageUrl)
      ) {
        setCompareImageUrl(
          effectivePatientImages[1]?.url || effectivePatientImages[0].url
        );
      }
    }
  }, [patientImages]);


  const handleResetViewer = () => {
    setZoomLevel(1.0);
    setBrightness(100);
    setContrast(100);
    setIsInverted(false);
  };

  const handleSelectPatientImage = (url: string) => {
    setImageUrl(url);
    setUploadedFileName(null);
    setResult(null);
    setApplied(false);
    handleResetViewer();
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        setImageUrl(b64);
        setImageBase64(b64);
      };
      reader.readAsDataURL(file);
      setResult(null);
      setApplied(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setApplied(false);

    try {
      const res = await apiClient.post<AnalyzeXrayResponse>(
        "/ai/doctor/analyze-xray",
        {
          imageUrl: imageUrl.startsWith("data:") ? null : imageUrl,
          imageBase64: imageUrl.startsWith("data:") ? imageUrl : imageBase64,
          patientId,
        },
        { timeout: 60000 }
      );

      // Safely unpack payload across Axios interceptor wrappers
      const payload: AnalyzeXrayResponse =
        (res as any)?.data?.data ?? (res as any)?.data ?? res;

      const isInvalid =
        payload?.isRadiograph === false ||
        payload?.status === "INVALID_IMAGE" ||
        (payload?.summary || "").toLowerCase().includes("cảnh báo y khoa") ||
        (payload?.summary || "").toLowerCase().includes("không phải là phim") ||
        (payload?.summary || "").toLowerCase().includes("không phải phim");

      if (isInvalid) {
        setResult({
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
        const rawFindings = payload?.findings || [];
        setResult({
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
          disclaimer:
            payload?.disclaimer ||
            "Kết quả phân tích X-quang bởi Dental Vision AI (Hybrid Cloud Pipeline).",
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? (Array.isArray(err.response.data.message)
              ? err.response.data.message.join(", ")
              : String(err.response.data.message))
          : "Không thể kết nối đến dịch vụ Vision AI. Vui lòng kiểm tra lại dịch vụ.";
      setResult({
        isRadiograph: false,
        status: "INVALID_IMAGE",
        totalFindings: 0,
        disclaimer: "Lỗi kết nối hoặc xử lý phân tích hình ảnh.",
        summary: errorMsg,
        findings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDeleteFinding = (indexToDelete: number) => {
    if (!result) return;
    const updatedFindings = result.findings.filter((_, idx) => idx !== indexToDelete);
    const updatedSummary = `Phân tích X-quang Panorama (Mô hình dental-pano-ai):\n` +
      updatedFindings.map((f) => `- Răng ${f.fdiToothNumber}: ${FINDING_LABELS_VI[f.findingType] || f.findingType} (${f.findingType}), độ tin cậy ${(f.confidence * 100).toFixed(1)}%.`).join("\n");

    setResult({
      ...result,
      findings: updatedFindings,
      totalFindings: updatedFindings.length,
      summary: updatedSummary,
    });
  };

  const handleUpdateToothNumber = (index: number, newTooth: number) => {
    if (!result || isNaN(newTooth)) return;
    const updatedFindings = [...result.findings];
    updatedFindings[index] = { ...updatedFindings[index], fdiToothNumber: newTooth };
    const updatedSummary = `Phân tích X-quang Panorama (Mô hình dental-pano-ai):\n` +
      updatedFindings.map((f) => `- Răng ${f.fdiToothNumber}: ${FINDING_LABELS_VI[f.findingType] || f.findingType} (${f.findingType}), độ tin cậy ${(f.confidence * 100).toFixed(1)}%.`).join("\n");

    setResult({
      ...result,
      findings: updatedFindings,
      summary: updatedSummary,
    });
  };

  const handleUpdateFindingType = (index: number, newType: string) => {
    if (!result) return;
    const updatedFindings = [...result.findings];
    updatedFindings[index] = { ...updatedFindings[index], findingType: newType };
    const updatedSummary = `Phân tích X-quang Panorama (Mô hình dental-pano-ai):\n` +
      updatedFindings.map((f) => `- Răng ${f.fdiToothNumber}: ${FINDING_LABELS_VI[f.findingType] || f.findingType} (${f.findingType}), độ tin cậy ${(f.confidence * 100).toFixed(1)}%.`).join("\n");

    setResult({
      ...result,
      findings: updatedFindings,
      summary: updatedSummary,
    });
  };

  const handleToggleSeverity = (index: number) => {
    if (!result) return;
    const nextSeverity: Record<DentalFinding["severity"], DentalFinding["severity"]> = {
      LOW: "MEDIUM",
      MEDIUM: "HIGH",
      HIGH: "LOW",
    };
    const updatedFindings = [...result.findings];
    updatedFindings[index] = {
      ...updatedFindings[index],
      severity: nextSeverity[updatedFindings[index].severity] || "LOW",
    };

    setResult({
      ...result,
      findings: updatedFindings,
    });
  };

  const handleAddFinding = () => {
    const newFinding: DentalFinding = {
      fdiToothNumber: 11,
      findingType: "Caries",
      confidence: 1.0,
      boundingBox: { x: 50, y: 50, width: 8, height: 12 },
      severity: "MEDIUM",
    };

    const currentFindings = result?.findings ?? [];
    const updatedFindings = [newFinding, ...currentFindings];
    const updatedSummary =
      `Phân tích X-quang Panorama (Mô hình dental-pano-ai):\n` +
      updatedFindings
        .map(
          (f) =>
            `- Răng ${f.fdiToothNumber}: ${
              FINDING_LABELS_VI[f.findingType] || f.findingType
            } (${f.findingType}), độ tin cậy ${(f.confidence * 100).toFixed(1)}%.`
        )
        .join("\n");

    setResult({
      totalFindings: updatedFindings.length,
      disclaimer:
        result?.disclaimer ||
        "Kết quả phân tích X-quang bởi Dental Vision AI. Bác sĩ cần đối chiếu lâm sàng.",
      summary: updatedSummary,
      findings: updatedFindings,
    });
  };



  const visibleFindings =

    result?.findings.filter((f) => selectedTypes[f.findingType] !== false) ?? [];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sky-400 shadow-md shadow-slate-900/10 border border-slate-800">
            <Brain size={22} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Dental Vision AI (Chẩn đoán X-Quang Panorama)
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                dental-pano-ai (AUC 96.2%)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tự động nhận diện 8 loại tổn thương & nhãn số răng FDI chuẩn quốc tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100">
            <FileArrowUp size={16} />
            Tải phim X-quang
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadImage}
            />
          </label>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-98 disabled:opacity-60"
          >
            <Sparkle size={16} weight="fill" className="text-sky-300" />
            {loading ? "Đang phân tích..." : "Phân tích phim AI"}
          </button>
        </div>
      </div>

      {/* Patient X-Ray Album Thumbnail Selector */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Album Phim X-Quang Bệnh Nhân ({effectivePatientImages.length})</span>
          <span className="text-[11px] font-normal text-slate-500">
            Nhấp chọn ảnh phim để AI phân tích
          </span>
        </div>

        {effectivePatientImages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Chưa có ảnh phim X-quang nào trong hồ sơ này. Vui lòng bấm <b>&quot;Tải phim X-quang&quot;</b> hoặc thêm ảnh ở tab <b>&quot;Ảnh&quot;</b>.
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {effectivePatientImages.map((imgItem, idx) => {
              const isSelected = imageUrl === imgItem.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPatientImage(imgItem.url)}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg border p-1.5 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="relative h-12 w-16 overflow-hidden rounded bg-slate-900">
                    <img
                      src={imgItem.url}
                      alt={imgItem.title || "X-ray film"}
                      className="h-full w-full object-cover opacity-90 transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="pr-1 text-left">
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? "text-blue-900" : "text-slate-800"
                      }`}
                    >
                      {imgItem.title || `Phim X-quang ${idx + 1}`}
                    </p>
                    {imgItem.date && (
                      <p className="text-[10px] text-slate-500">{imgItem.date}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>



      {/* Layer Filter Buttons */}
      {result && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2.5 ring-1 ring-inset ring-slate-200/60">
          <span className="text-xs font-semibold text-slate-500">Lọc tổn thương:</span>
          {Object.keys(FINDING_COLORS).map((type) => {
            const active = selectedTypes[type] !== false;
            const count = result.findings.filter((f) => f.findingType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleTypeFilter(type)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? `${FINDING_COLORS[type].text} ring-1 ring-inset ring-current`
                    : "bg-slate-200/70 text-slate-500 line-through"
                }`}
              >
                {active ? <Eye size={12} /> : <EyeSlash size={12} />}
                {FINDING_LABELS_VI[type] || type} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Radiography Viewer */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="relative min-h-[360px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner lg:col-span-8 flex flex-col justify-between">
          {/* DICOM Control Bar */}
          <div className="z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/90 px-3 py-2 text-white backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Kính soi DICOM
              </span>
              <span className="h-3 w-px bg-slate-700" />
              <span className="text-[11px] font-semibold text-slate-300">
                Tỉ lệ: {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1.0, z - 0.25))}
                disabled={zoomLevel <= 1.0}
                title="Thu nhỏ (-)"
                className="rounded p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <MagnifyingGlassMinus size={16} />
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
                disabled={zoomLevel >= 3.0}
                title="Phóng to (+)"
                className="rounded p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <MagnifyingGlassPlus size={16} />
              </button>

              <span className="h-3 w-px bg-slate-700" />

              {/* Invert Color */}
              <button
                type="button"
                onClick={() => setIsInverted((inv) => !inv)}
                title="Đảo màu âm bản (Invert X-ray)"
                className={`rounded p-1.5 text-slate-300 transition-colors hover:bg-slate-800 ${
                  isInverted ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500" : ""
                }`}
              >
                <CircleHalf size={16} />
              </button>

              {/* Brightness & Contrast Toggle */}
              <button
                type="button"
                onClick={() => setShowSliders((s) => !s)}
                title="Chỉnh độ sáng / Độ tương phản"
                className={`rounded p-1.5 text-slate-300 transition-colors hover:bg-slate-800 ${
                  showSliders || brightness !== 100 || contrast !== 100
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500"
                    : ""
                }`}
              >
                <Sliders size={16} />
              </button>

              {/* Reset Controls */}
              <button
                type="button"
                onClick={handleResetViewer}
                title="Đặt lại cài đặt kính soi"
                className="rounded p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <ArrowsCounterClockwise size={16} />
              </button>

              <span className="h-3 w-px bg-slate-700" />

              {/* Manual Bounding Box Drawing Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawingMode((prev) => !prev);
                  setCurrentBox(null);
                }}
                title="Vẽ khoanh vùng tổn thương thủ công trên ảnh X-quang"
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                  isDrawingMode
                    ? "bg-amber-500 font-bold text-slate-950 shadow ring-2 ring-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Plus size={15} weight="bold" />
                <span>{isDrawingMode ? "Đang vẽ (Kéo chuột)" : "Vẽ khoanh vùng"}</span>
              </button>

              <span className="h-3 w-px bg-slate-700" />

              {/* Dual Compare Mode Toggle */}
              <button
                type="button"
                onClick={() => setCompareMode((c) => !c)}
                title="Bật/Tắt Chế độ So sánh 2 phim (Cũ vs Mới)"
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                  compareMode
                    ? "bg-emerald-500 font-bold text-slate-950 shadow"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Columns size={15} />
                <span>{compareMode ? "Đang so sánh" : "So sánh 2 phim"}</span>
              </button>

            </div>
          </div>

          {/* Sliders Panel */}
          {showSliders && (
            <div className="z-30 flex items-center justify-around border-b border-slate-800 bg-slate-900/95 p-3 text-xs text-slate-200 backdrop-blur">
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-amber-400" />
                <span>Độ sáng ({brightness}%):</span>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="h-1 w-24 cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-blue-400" />
                <span>Độ tương phản ({contrast}%):</span>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="h-1 w-24 cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Canvas Wrapper with Dual Split Screen */}
          <div className="relative flex-1 overflow-hidden bg-slate-950 p-2">
            {compareMode ? (
              <div className="grid h-full w-full grid-cols-1 gap-2 md:grid-cols-2">
                {/* Left Pane: Baseline Historical Film */}
                <div className="relative flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 text-xs text-slate-300">
                    <span className="font-bold text-amber-400">
                      1. Phim Trước Điều Trị (Gốc/Cũ)
                    </span>
                    <select
                      value={compareImageUrl}
                      onChange={(e) => setCompareImageUrl(e.target.value)}
                      className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-white focus:outline-none"
                    >
                      {effectivePatientImages.map((imgItem, idx) => (
                        <option key={idx} value={imgItem.url}>
                          {imgItem.title || `Phim ${idx + 1}`} ({imgItem.date || "Cũ"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                    <img
                      src={compareImageUrl}
                      alt="Baseline X-ray"
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                          isInverted ? "invert(100%)" : ""
                        }`,
                        transform: `scale(${zoomLevel})`,
                      }}
                      className="max-h-[420px] w-auto max-w-full rounded object-contain opacity-90 transition-all"
                    />
                  </div>
                </div>

                {/* Right Pane: Current AI Analyzed Film */}
                <div className="relative flex flex-col overflow-hidden rounded-lg border border-emerald-900/60 bg-slate-900/80 p-2">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs text-slate-300">
                    <span className="font-bold text-emerald-400">
                      2. Phim Hiện Tại (AI Phân Tích)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {visibleFindings.length} tổn thương
                    </span>
                  </div>
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                    <div
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                          isInverted ? "invert(100%)" : ""
                        }`,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center center",
                        transition: "transform 0.2s ease-out, filter 0.15s ease-out",
                      }}
                      className="relative flex items-center justify-center"
                    >
                      <div className="relative inline-block max-w-full max-h-[420px]">
                        <img
                          src={imageUrl}
                          alt="Current X-Ray"
                          className="max-h-[420px] w-auto max-w-full rounded object-contain opacity-90 shadow-md block"
                        />
                        {visibleFindings.map((finding, idx) => {
                          const color = FINDING_COLORS[finding.findingType] || {
                            border: "border-emerald-400",
                            bg: "bg-emerald-400/20",
                            text: "text-white bg-emerald-600",
                          };
                          return (
                            <div
                              key={idx}
                              style={{
                                left: `${finding.boundingBox.x}%`,
                                top: `${finding.boundingBox.y}%`,
                                width: `${finding.boundingBox.width}%`,
                                height: `${finding.boundingBox.height}%`,
                              }}
                              className={`absolute rounded border-2 ${color.border} ${color.bg}`}
                            >
                              <div className="absolute -top-4 left-0 rounded bg-slate-900/90 px-1 py-0.5 text-[9px] font-bold text-white shadow">
                                R{finding.fdiToothNumber}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                    isInverted ? "invert(100%)" : ""
                  }`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease-out, filter 0.15s ease-out",
                }}
                className="relative flex h-full w-full items-center justify-center"
              >
                <div
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className={`relative inline-block max-w-full max-h-[480px] select-none ${
                    isDrawingMode ? "cursor-crosshair" : ""
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt="Panoramic X-Ray"
                    draggable={false}
                    className="block max-h-[480px] w-auto max-w-full rounded object-contain opacity-90 shadow-md"
                  />

                  {/* Live Drawing Bounding Box */}
                  {currentBox && (
                    <div
                      style={{
                        left: `${currentBox.x}%`,
                        top: `${currentBox.y}%`,
                        width: `${currentBox.width}%`,
                        height: `${currentBox.height}%`,
                      }}
                      className="absolute z-30 rounded border-2 border-dashed border-amber-400 bg-amber-400/25 pointer-events-none"
                    >
                      <div className="absolute -top-5 left-0 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950 shadow">
                        Kéo thả để khoanh vùng...
                      </div>
                    </div>
                  )}

                  {/* Bounding Box Overlays */}
                  {visibleFindings.map((finding, idx) => {
                    const color = FINDING_COLORS[finding.findingType] || {
                      border: "border-emerald-400",
                      bg: "bg-emerald-400/20",
                      text: "text-white bg-emerald-600",
                    };
                    const isHovered = hoveredFinding === finding;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredFinding(finding)}
                        onMouseLeave={() => setHoveredFinding(null)}
                        style={{
                          left: `${finding.boundingBox.x}%`,
                          top: `${finding.boundingBox.y}%`,
                          width: `${finding.boundingBox.width}%`,
                          height: `${finding.boundingBox.height}%`,
                        }}
                        className={`absolute cursor-pointer rounded border-2 transition-all ${
                          color.border
                        } ${color.bg} ${
                          isHovered ? "z-20 scale-105 ring-4 ring-emerald-400/60" : "z-10"
                        }`}
                      >
                        {/* Tooth FDI Tag */}
                        <div className="absolute -top-5 left-0 flex items-center gap-1 rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                          <span>R{finding.fdiToothNumber}</span>
                          <span className="opacity-70">
                            ({Math.round(finding.confidence * 100)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal / Dialog Thêm tổn thương thủ công */}
          {showAddModal && currentBox && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Plus size={16} weight="bold" />
                    Thêm tổn thương thủ công (Bác sĩ chọn)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setCurrentBox(null);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ✕
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
                      placeholder="Ví dụ: 18, 36, 48..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-300">Loại tổn thương / Tình trạng:</label>
                    <select
                      value={newFindingType}
                      onChange={(e) => setNewFindingType(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      {Object.keys(FINDING_LABELS_VI).map((key) => (
                        <option key={key} value={key}>
                          {FINDING_LABELS_VI[key]} ({key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-300">Mức độ nghiêm trọng:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["LOW", "MEDIUM", "HIGH"] as const).map((sev) => {
                        const labels = { LOW: "Nhẹ", MEDIUM: "Vừa", HIGH: "Nặng" };
                        const active = newSeverity === sev;
                        return (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setNewSeverity(sev)}
                            className={`rounded-xl py-1.5 text-xs font-bold transition-all ${
                              active
                                ? "bg-amber-500 text-slate-950 shadow-md"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {labels[sev]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-1">
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
                    Lưu tổn thương
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal 1-Click Kế hoạch Điều trị AI */}
          {showTreatmentPlanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl border border-purple-900/50 bg-slate-900 p-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-purple-400">
                    <Sparkle size={18} className="text-purple-400" />
                    Kế Hoạch Điều Trị AI Đề Xuất (Tự động từ X-quang)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTreatmentPlanModal(false)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1 text-xs">
                  {treatmentPlanItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-purple-900/60 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-700">
                            Răng {item.toothFdi}
                          </span>
                          <span className="font-bold text-white">{item.procedure}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Chẩn đoán AI: {item.findingLabel} ({item.severity})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-300">
                          {item.cost.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-950/40 p-3 text-xs font-bold text-purple-200">
                    <span>TỔNG CHI PHÍ DỰ TOÁN ĐIỀU TRỊ:</span>
                    <span className="text-base text-purple-300">
                      {totalTreatmentCost.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowTreatmentPlanModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyToMedicalRecord) {
                        const planSummary = treatmentPlanItems
                          .map((i) => `• R${i.toothFdi}: ${i.procedure} (${i.cost.toLocaleString("vi-VN")}đ)`)
                          .join("\n");
                        onApplyToMedicalRecord(`\n--- PHÁC ĐỒ ĐIỀU TRỊ AI NHA KHOA ---\n${planSummary}\nTổng dự toán: ${totalTreatmentCost.toLocaleString("vi-VN")}đ`);
                      }
                      setShowTreatmentPlanModal(false);
                    }}
                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-purple-500"
                  >
                    Duyệt & Chèn vào Bệnh án EMR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal 1-Click Đề xuất Đơn thuốc AI */}
          {showPrescriptionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-blue-900/50 bg-slate-900 p-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-blue-400">
                    <Sparkle size={18} className="text-blue-400" />
                    Đơn Thuốc Khuyên Dùng AI (Y Khoa Nha Khoa)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(false)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {prescriptionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-800/60 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-300">{item.name}</span>
                        <span className="rounded bg-blue-900/60 px-2 py-0.5 text-[10px] text-blue-200 border border-blue-700">
                          {item.dosage}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">Hướng dẫn: {item.usage}</p>
                      <p className="text-[10px] text-slate-400">Phân loại: {item.type}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyToMedicalRecord) {
                        const rxSummary = prescriptionItems
                          .map((rx) => `• ${rx.name} (${rx.dosage}) - ${rx.usage}`)
                          .join("\n");
                        onApplyToMedicalRecord(`\n--- ĐƠN THUỐC AI ĐỀ XUẤT ---\n${rxSummary}`);
                      }
                      setShowPrescriptionModal(false);
                    }}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-500"
                  >
                    Duyệt & Kê đơn vào Bệnh án
                  </button>
                </div>
              </div>
            </div>
          )}






          {!result && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 p-6 text-center text-white backdrop-blur-[2px]">
              <Lightning size={32} className="mb-2 text-emerald-400" />
              <p className="text-sm font-bold">Chưa phân tích phim này</p>
              <p className="mt-1 max-w-sm text-xs text-slate-300">
                Nhấp nút &quot;Phân tích phim AI&quot; để khoanh vùng tự động 8 loại tổn thương theo chuỗi răng FDI.
              </p>
            </div>
          )}
        </div>
        {/* Findings Summary Table */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Kết quả chẩn đoán ({result?.totalFindings ?? 0})
            </h4>

            <div className="flex items-center gap-1.5">
              {result && (
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-700"
                  title="In báo cáo chẩn đoán X-quang cho Bệnh nhân"
                >
                  <Printer size={13} weight="bold" />
                  <span>Xuất PDF / In</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAddFinding}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-emerald-600"
              >
                <Plus size={13} weight="bold" />
                Thêm chẩn đoán
              </button>
            </div>

          </div>

          {result ? (
            <div className="flex flex-1 flex-col justify-between gap-4">
              {result.findings.length === 0 ? (
                (() => {
                  const summaryLower = (result.summary || "").toLowerCase();
                  const isNonRadiograph =
                    result.isRadiograph === false ||
                    result.status === "INVALID_IMAGE" ||
                    summaryLower.includes("không phải là phim") ||
                    summaryLower.includes("không phải phim") ||
                    summaryLower.includes("cảnh báo y khoa") ||
                    summaryLower.includes("chụp màn hình") ||
                    summaryLower.includes("màu sắc");
                  const isRateLimitOrError =
                    summaryLower.includes("429") ||
                    summaryLower.includes("rate limit") ||
                    summaryLower.includes("lỗi kết nối") ||
                    summaryLower.includes("too many requests");

                  if (isNonRadiograph) {
                    return (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/90 p-5 text-center text-rose-900 shadow-xs">
                        <Warning size={36} className="mb-2 text-rose-600" />
                        <h5 className="text-sm font-bold text-rose-900">Ảnh không phải phim X-quang răng</h5>
                        <p className="mt-1.5 text-xs text-rose-700 leading-relaxed max-w-xs">
                          Hệ thống AI phát hiện hình ảnh được chọn không phải là phim X-quang nha khoa hợp lệ. AI đã ngắt khoanh vùng để tránh chẩn đoán sai lệch.
                        </p>
                        <p className="mt-3 rounded-lg bg-rose-100/80 border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-800">
                          Vui lòng tải lên phim X-quang Panorama, Bitewing hoặc Cận chóp hợp lệ.
                        </p>
                      </div>
                    );
                  }

                  if (isRateLimitOrError) {
                    return (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/90 p-5 text-center text-amber-900 shadow-xs">
                        <Warning size={36} className="mb-2 text-amber-600" />
                        <h5 className="text-sm font-bold text-amber-900">Dịch vụ AI đang bận (429 Rate Limit)</h5>
                        <p className="mt-1.5 text-xs text-amber-700 leading-relaxed max-w-xs">
                          Máy chủ AI miễn phí đang quá tải lượt gọi cùng lúc. Vui lòng bấm nút phân tích lại sau vài giây.
                        </p>
                        <button
                          onClick={handleAnalyze}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 cursor-pointer"
                        >
                          <ArrowsCounterClockwise size={14} /> Thử phân tích lại
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 text-center text-emerald-900 shadow-xs">
                      <CheckCircle size={36} className="mb-2 text-emerald-600" />
                      <h5 className="text-sm font-bold text-emerald-900">Không ghi nhận bất thường bệnh lý</h5>
                      <p className="mt-1.5 text-xs text-emerald-700 leading-relaxed max-w-xs">
                        Phim X-quang răng không phát hiện sâu răng, răng khôn kẹt hay viêm quanh chóp. Tình trạng cung hàm ổn định.
                      </p>
                      <div className="mt-3 rounded-lg bg-emerald-100/80 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                        Chỉ số sức khỏe răng: 100% (An Toàn)
                      </div>
                    </div>
                  );
                })()
              ) : (

                <>
                  {/* Clinical Oral Health Risk Scorecard (Option 2) */}
              {(() => {
                const risk = calculateOralHealthRisk(result.findings);
                return (
                  <div
                    className={`flex flex-col gap-2 rounded-xl border p-3 shadow-xs ${risk.colorClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        Chỉ số Sức khỏe Răng
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${risk.badgeColor}`}
                      >
                        {risk.riskLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{risk.score}%</span>
                      <span className="text-[11px] font-medium opacity-80">
                        ({result.findings.length} tổn thương ghi nhận)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        style={{ width: `${risk.score}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${risk.badgeColor}`}
                      />
                    </div>

                    {/* Urgent Priority Teeth */}
                    {risk.urgentTeeth.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-rose-800">
                          Ưu tiên can thiệp:
                        </span>
                        {risk.urgentTeeth.map((u, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-900 border border-rose-300"
                          >
                            R{u.fdi} ({u.reason})
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] font-medium leading-relaxed opacity-90">
                      💡 <b>Khuyến nghị AI:</b> {risk.recommendation}
                    </p>
                  </div>
                );
              })()}

              <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">

                {result.findings.map((item, i) => {
                  const style = FINDING_COLORS[item.findingType] || {
                    text: "text-slate-800 bg-slate-100",
                  };
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredFinding(item)}
                      onMouseLeave={() => setHoveredFinding(null)}
                      className={`group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-all ${
                        hoveredFinding === item ? "ring-2 ring-emerald-500 shadow-sm" : ""
                      }`}
                    >
                      {/* Header Row: Tooth FDI Badge + Severity Badge + Delete Action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
                          <span className="text-[10px] text-slate-400">R</span>
                          <input
                            type="number"
                            min={11}
                            max={48}
                            value={item.fdiToothNumber}
                            onChange={(e) =>
                              handleUpdateToothNumber(i, parseInt(e.target.value, 10))
                            }
                            className="w-7 rounded bg-transparent text-center font-mono text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSeverity(i)}
                            title="Nhấp để đổi mức độ nghiêm trọng (LOW -> MEDIUM -> HIGH)"
                            className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-extrabold uppercase transition-transform active:scale-95 ${
                              item.severity === "HIGH"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : item.severity === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            }`}
                          >
                            {item.severity}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFinding(i);
                            }}
                            title="Xóa phát hiện này"
                            className="rounded p-1 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content Row: Free Text Diagnosis Input */}
                      <input
                        type="text"
                        value={FINDING_LABELS_VI[item.findingType] || item.findingType}
                        onChange={(e) => handleUpdateFindingType(i, e.target.value)}
                        placeholder="Nhập chẩn đoán lâm sàng..."
                        className={`w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 ${style.text}`}
                      />

                      {/* Footer Row: Confidence Score */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Độ tin cậy AI:</span>
                        <span className="font-semibold text-slate-600">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>



              {/* Option 3: 1-Click AI Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowTreatmentPlanModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-900 shadow-2xs transition-colors hover:bg-purple-100"
                >
                  <Sparkle size={14} className="text-purple-600" />
                  <span>1-Click Lập Phác đồ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 shadow-2xs transition-colors hover:bg-blue-100"
                >
                  <Sparkle size={14} className="text-blue-600" />
                  <span>1-Click Đề xuất Đơn thuốc</span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {onApplyToDentalChart && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!result) return;
                      onApplyToDentalChart(result.findings);
                      setChartSynced(true);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 hover:text-emerald-700"
                  >
                    {chartSynced ? (
                      <>
                        <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                        Đã đồng bộ sang Sơ đồ răng 2D
                      </>
                    ) : (
                      <>
                        <Sparkle size={15} className="text-emerald-600" />
                        Cập nhật tự động Sơ đồ răng (FDI)
                      </>
                    )}
                  </button>
                )}

                {onApplyToMedicalRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToMedicalRecord(result.summary);
                      setApplied(true);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                  >
                    {applied ? (
                      <>
                        <CheckCircle size={16} weight="fill" />
                        Đã chèn vào Bệnh án EMR
                      </>
                    ) : (
                      <>
                        <FloppyDisk size={16} />
                        Chèn kết quả AI vào Bệnh án (EMR)
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-10 text-center text-xs text-slate-400">
              <p>Chưa có dữ liệu phân tích</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Option 4: Xuất Báo cáo PDF / In cho Bệnh nhân */}
      {showReportModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-slate-700 bg-white p-8 text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Print Controls Header (Hidden during print) */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Báo Cáo Phân Tích X-Quang Dental Vision (Bệnh Nhân)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-emerald-700"
                >
                  <Printer size={16} weight="bold" />
                  In Báo Cáo / Lưu PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="space-y-6 text-left">
              {/* Clinic Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-emerald-800 uppercase">
                    NHA KHOA QUỐC TẾ SMART DENTAL SYSTEM
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Hotline: 1900 6868 | Website: www.smartdentalsystem.vn
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    BÁO CÁO KẾT QUẢ X-QUANG
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ngày tạo: {new Date().toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              {/* Patient Info Table */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div>
                  <p className="text-slate-500">Họ và tên Bệnh nhân:</p>
                  <p className="text-sm font-bold text-slate-900">{patientName || "Bệnh nhân (Hồ sơ EMR)"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mã Bệnh nhân (EMR ID):</p>
                  <p className="text-sm font-bold text-slate-900">{patientId || "P-2026-0888"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Bác sĩ Chẩn đoán:</p>
                  <p className="font-bold text-slate-800">BS. Nguyễn Văn A (Khoa Chẩn đoán Hình ảnh)</p>
                </div>
                <div>
                  <p className="text-slate-500">Chỉ số Sức khỏe Răng:</p>
                  <p className="font-bold text-emerald-700">
                    {calculateOralHealthRisk(result.findings).score}% ({calculateOralHealthRisk(result.findings).riskLabel})
                  </p>
                </div>
              </div>

              {/* X-Ray Image Preview with Findings */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Hình ảnh X-quang & Bounding Box Khoanh Vùng AI
                </h4>
                <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950 p-2 flex justify-center">
                  <div className="relative inline-block max-w-full max-h-[360px]">
                    <img
                      src={imageUrl}
                      alt="X-ray Film"
                      className="max-h-[360px] w-auto max-w-full rounded object-contain opacity-90 block"
                    />
                    {result.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        style={{
                          left: `${finding.boundingBox.x}%`,
                          top: `${finding.boundingBox.y}%`,
                          width: `${finding.boundingBox.width}%`,
                          height: `${finding.boundingBox.height}%`,
                        }}
                        className="absolute rounded border-2 border-emerald-400 bg-emerald-400/20"
                      >
                        <div className="absolute -top-4 left-0 rounded bg-slate-900 px-1 py-0.5 text-[9px] font-bold text-white shadow">
                          R{finding.fdiToothNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Findings & Patient Explanations */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Danh sách Tổn thương Răng & Lời Giải Thích Dễ Hiểu
                </h4>
                <div className="space-y-2">
                  {result.findings.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                            Răng {item.fdiToothNumber}
                          </span>
                          <span className="font-bold text-slate-900">
                            {FINDING_LABELS_VI[item.findingType] || item.findingType}
                          </span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            Mức độ: {item.severity}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          <b>Giải thích cho bệnh nhân:</b>{" "}
                          {PATIENT_EXPLANATIONS_VI[item.findingType] || "Cần theo dõi vệ sinh kỹ hàng ngày."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Signature Block */}
              <div className="mt-8 flex justify-between pt-6 border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-700">XÁC NHẬN CỦA PHÒNG KHÁM</p>
                  <p className="text-[11px] text-slate-500">(Ký & Đóng dấu)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">BÁC SĨ CHẨN ĐOÁN HÌNH ẢNH</p>
                  <p className="text-[11px] text-slate-500">(Ký & Ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">BS. Nguyễn Văn A</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {result?.disclaimer && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <Warning size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <p>{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
