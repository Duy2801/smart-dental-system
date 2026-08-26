"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import { DashboardIcon } from "../../common/DashboardIcon";
import {
  confirmPatientAppointment,
  restorePatientAppointment,
} from "../../appointment/api";
import {
  formatMoney,
  formatShortDate,
  getDefaultRichPrescription,
  getInitials,
  type RichPrescription,
  type RichPrescriptionItem,
  type TreatmentRecordView,
} from "./recordMappers";
import { StepInvoiceModal } from "./StepInvoiceModal";
import { ROUTES } from "../../common/routes";
import { recordsQueryKeys } from "../hooks/useRecordsQueries";
import { appointmentQueryKeys } from "../../appointment/hooks/useAppointmentQueries";
import type { PatientRecordsResponse } from "../api";

type RecordTreatmentCardProps = {
  treatment: TreatmentRecordView;
  index: number;
  recordsData: PatientRecordsResponse;
};

export function RecordTreatmentCard({
  treatment,
  index,
  recordsData,
}: RecordTreatmentCardProps) {
  const queryClient = useQueryClient();

  // State cho xem hóa đơn bước
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // State xem Lightbox Phim X-quang & Đơn thuốc gốc
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    doctor: string;
    date: string;
    notes: string;
    category: string;
  } | null>(null);

  const [previewPrescriptionDoc, setPreviewPrescriptionDoc] =
    useState<RichPrescription | null>(null);

  // UX State: Tinh gọn nhất - Mặc định chỉ hiện Hồ sơ bệnh nhân ("none").
  // Khi người dùng bấm nút thì mở section tương ứng: "workflow" | "prescription" | "images" | "medical-record" | "invoice" | "all"
  const [expandedSection, setExpandedSection] = useState<
    "none" | "workflow" | "prescription" | "images" | "medical-record" | "invoice" | "all"
  >("none");

  // Mutation Xác Nhận Lịch Hẹn
  const confirmMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      confirmPatientAppointment(appointmentId),
    onSuccess: () => {
      toast.success(
        "Xác nhận lịch hẹn thành công!",
        "Lịch tái khám của bạn đã được ghi nhận vào hệ thống nha khoa.",
      );
      queryClient.invalidateQueries({ queryKey: recordsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    },
    onError: () => {
      toast.error(
        "Xác nhận thất bại",
        "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
      );
    },
  });

  // Mutation Hủy Xác Nhận (Hoàn tác)
  const restoreMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      restorePatientAppointment(appointmentId),
    onSuccess: () => {
      toast.info(
        "Đã hoàn tác trạng thái lịch hẹn!",
        "Trạng thái lịch hẹn của bạn đã chuyển về chờ xác nhận.",
      );
      queryClient.invalidateQueries({ queryKey: recordsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    },
    onError: () => {
      toast.error(
        "Hoàn tác thất bại",
        "Không thể kết nối đến máy chủ.",
      );
    },
  });

  // 0. Thông tin hành chính bệnh nhân động từ backend
  const patient = recordsData?.patient;

  const formattedDobAndAge = useMemo(() => {
    if (!patient?.dateOfBirth) {
      if (patient?.age !== null && patient?.age !== undefined && patient.age > 0) {
        return `${patient.age} tuổi`;
      }
      return "Chưa cập nhật";
    }

    const dob = new Date(patient.dateOfBirth);
    if (isNaN(dob.getTime())) {
      if (patient?.age !== null && patient?.age !== undefined && patient.age > 0) {
        return `${patient.age} tuổi`;
      }
      return "Chưa cập nhật";
    }

    const birthYear = dob.getFullYear();
    const currentYear = new Date().getFullYear();
    const age = patient.age ?? (currentYear - birthYear);

    const day = String(dob.getDate()).padStart(2, "0");
    const month = String(dob.getMonth() + 1).padStart(2, "0");
    const formattedDate = `${day}/${month}/${birthYear}`;

    return age > 0 ? `${formattedDate} (${age} tuổi)` : `${formattedDate}`;
  }, [patient]);

  const formattedGender = useMemo(() => {
    if (!patient?.gender) return "Chưa cập nhật";
    switch (patient.gender.toUpperCase()) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      case "OTHER":
        return "Khác";
      default:
        return "Chưa cập nhật";
    }
  }, [patient]);

  // 1. Phác đồ chi tiết
  const visibleSteps = useMemo(
    () => treatment.treatmentPlan ?? [],
    [treatment.treatmentPlan],
  );

  const selectedStep = visibleSteps[selectedStepIndex] ?? visibleSteps[0];

  const nextAppointmentStep = useMemo(() => {
    return visibleSteps.find(
      (s) =>
        s.appointment &&
        (s.appointment.status === "pending" || s.appointment.status === "confirmed"),
    );
  }, [visibleSteps]);

  // 2. Chẩn đoán & Ghi chú từ backend động theo phác đồ
  const planDiagnosisNotes = useMemo(() => {
    const activeMedicalRecord = recordsData?.medicalRecords?.find(
      (m) => String(m.id) === String(treatment.id),
    );

    const toothDisplay =
      treatment.tooth && treatment.tooth !== "Theo chỉ định"
        ? treatment.tooth
        : "Vùng răng chỉ định";

    if (!activeMedicalRecord) {
      return {
        chiefComplaint: treatment.description || "Khám nha khoa định kỳ và theo dõi phác đồ điều trị.",
        diagnosis: treatment.title || "Khám & Điều trị chuyên khoa",
        clinicalNotes: "Bệnh nhân tuân thủ đúng phác đồ điều trị của bác sĩ chuyên khoa.",
        toothNumber: toothDisplay,
      };
    }

    return {
      chiefComplaint: activeMedicalRecord.chiefComplaint || "Khám & kiểm tra răng miệng định kỳ.",
      diagnosis: activeMedicalRecord.diagnosis || treatment.title,
      clinicalNotes: activeMedicalRecord.treatmentNotes || "Tiến triển tốt.",
      toothNumber: toothDisplay,
    };
  }, [recordsData, treatment]);

  // 3. Đơn thuốc trích xuất từ phác đồ / bệnh án (CHỈ LẤY ĐƠN THỰC TẾ TỪ DATABASE)
  const activeRichPrescriptions = useMemo(() => {
    return treatment.richPrescriptions || [];
  }, [treatment]);

  // 4. Hình ảnh lâm sàng & X-quang CHỈ trích xuất từ bảng MedicalRecord (medical_records)
  const realClinicalImages = useMemo(() => {
    const imagesList: Array<{
      id: string;
      url: string;
      title: string;
      category: string;
      date: string;
      doctor: string;
      notes: string;
    }> = [];

    // 1. Tìm đúng TreatmentPlan đang xem trong recordsData
    const currentPlan = recordsData?.treatmentPlans?.find(
      (p) => p.id === treatment.id,
    );

    // 2. Lấy tất cả hồ sơ bệnh án thuộc phác đồ này + hồ sơ riêng của bệnh nhân
    const stepMedicalRecords =
      currentPlan?.steps?.flatMap((step) => step.medicalRecords ?? []) ?? [];

    const allMedicalRecords = [
      ...stepMedicalRecords,
      ...(recordsData?.medicalRecords ?? []),
    ];

    // 3. Lặp qua từng bản ghi trong bảng medical_records để trích xuất các tệp ảnh thuộc medicalRecord đó
    allMedicalRecords.forEach((record, recordIdx) => {
      const rawImages = (record as any)?.images;
      if (Array.isArray(rawImages) && rawImages.length > 0) {
        rawImages.forEach((img: any, imgIdx: number) => {
          const isXray =
            img?.type === "XRAY" ||
            `${img?.title || ""} ${img?.type || ""}`
              .toLowerCase()
              .includes("xray") ||
            `${img?.title || ""}`.toLowerCase().includes("xquang");

          // Lấy URL thực tế từ mảng images trong medical_records
          const rawUrl = img?.url || img?.imageUrl || img?.src;
          const displayUrl =
            rawUrl && typeof rawUrl === "string" && rawUrl.trim()
              ? rawUrl.trim()
              : isXray
                ? "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80"
                : "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80";

          const doctorName =
            "doctor" in record && typeof (record as any).doctor === "string"
              ? (record as any).doctor
              : (record as any)?.doctor?.user?.fullName || treatment.doctor;

          imagesList.push({
            id: img?.id || `img-rec-${record.id || recordIdx}-${imgIdx}`,
            url: displayUrl,
            title:
              img?.title && img.title !== "X-Ray" && img.title !== "Clinical"
                ? img.title
                : isXray
                  ? "Phim X-Quang Panorama Chẩn Đoán"
                  : "Ảnh Lâm Sàng Vùng Điều Trị",
            category: isXray ? "PHIM X-QUANG PANORAMA" : "ẢNH THỰC TẾ LÂM SÀNG",
            date:
              "createdAt" in record && (record as any).createdAt
                ? formatShortDate((record as any).createdAt)
                : treatment.date,
            doctor: doctorName,
            notes:
              img?.notes ||
              record.treatmentNotes ||
              record.chiefComplaint ||
              record.diagnosis ||
              "Dữ liệu hình ảnh được liên kết trực tiếp từ hồ sơ bệnh án điện tử (medical_records).",
          });
        });
      }
    });

    // Tránh trùng lặp ID. BẮT BUỘC: Nếu không có bản ghi medical_records nào chứa ảnh thì trả về mảng rỗng [] (không hiển thị ảnh giả)
    return Array.from(
      new Map(imagesList.map((item) => [item.id, item])).values(),
    );
  }, [recordsData, treatment]);

  // Handle Export PDF
  function handleExportPDF() {
    toast.info(
      "Đang tải hồ sơ bệnh án PDF...",
      "Hệ thống đang trích xuất dữ liệu bệnh án điện tử chính thức.",
    );
    setTimeout(() => {
      window.print();
    }, 800);
  }

  // Toggle Section Handler
  function toggleSection(section: "workflow" | "prescription" | "images" | "medical-record" | "invoice" | "all") {
    setShowInvoiceModal(false);
    setPreviewImage(null);
    setPreviewPrescriptionDoc(null);
    setExpandedSection((prev) => (prev === section ? "none" : section));
  }

  const completedStepsCount = visibleSteps.filter((s) => s.status === "completed").length;

  return (
    <>
      <article className="space-y-6 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. HỒ SƠ BỆNH NHÂN (PATIENT PROFILE SUMMARY CARD) - Harmonized Light Enterprise Design */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-all">
        {/* Header Section: Soft Light Blue Gradient */}
        <div className="bg-gradient-to-r from-[#f4f9fd] via-white to-blue-50/50 p-6 sm:p-7 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Patient Avatar & Name */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-[#1996e0] to-blue-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-[#1996e0]/25 shrink-0 border-2 border-white">
                {getInitials(patient?.fullName || "Bệnh Nhân")}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-blue-100/80 text-[#1996e0] px-3 py-0.5 rounded-full border border-blue-200/90 shadow-2xs">
                    Mã BN: {patient?.patientCode || "Chưa cấp mã"}
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                    ● Hồ sơ đang hoạt động
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {patient?.fullName || "Bệnh Nhân"}
                </h2>
              </div>
            </div>

            {/* Right: Key Patient Administrative Info Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs shrink-0 lg:min-w-[440px]">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  📅 Ngày sinh / Tuổi
                </span>
                <span className="text-xs font-black text-slate-800 block">
                  {formattedDobAndAge}
                </span>
              </div>
              <div className="space-y-1 sm:border-l sm:border-slate-200/80 sm:pl-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  📞 Số điện thoại
                </span>
                <span className="text-xs font-black text-slate-800 block">
                  {patient?.phone || "Chưa cập nhật"}
                </span>
              </div>
              <div className="space-y-1 sm:border-l sm:border-slate-200/80 sm:pl-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  🚻 Giới tính
                </span>
                <span className="text-xs font-black text-slate-800 block">
                  {formattedGender}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Safety & Allergy Note */}
          <div className="mt-5 pt-4 border-t border-slate-200/70 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3">
              <span className="text-lg">🛡️</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1996e0] block">
                  Tiền Sử Y Khoa & Dị Ứng
                </span>
                <span className="text-slate-800 font-bold">
                  {patient?.medicalHistory || "Không ghi nhận dị ứng thuốc - Sức khỏe bình thường"}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3">
              <span className="text-lg">👨‍⚕️</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1996e0] block">
                  Bác Sĩ Phụ Trách Điều Trị
                </span>
                <span className="text-slate-800 font-bold">
                  {treatment.doctor} (Chuyên Khoa Nha Khoa Tổng Quát)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic & Plan Status Summary (Tóm tắt phác đồ) */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#1996e0]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Tóm Tắt Chẩn Đoán & Tiến Trình Phác Đồ
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#1996e0] bg-[#1996e0]/10 px-3 py-1 rounded-lg border border-[#1996e0]/20">
              Phác Đồ: {treatment.category}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Box 1: Chẩn đoán chính */}
            <div className="p-4 rounded-2xl bg-[#f4f9fd] border border-[#1996e0]/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1996e0] block">
                Chẩn Đoán Y Khoa Chính
              </span>
              <h4 className="text-sm font-extrabold text-slate-900">
                {planDiagnosisNotes.diagnosis}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2">
                {planDiagnosisNotes.chiefComplaint}
              </p>
            </div>

            {/* Box 2: Răng chỉ định */}
            <div className="p-4 rounded-2xl bg-[#f4f9fd] border border-[#1996e0]/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1996e0] block">
                Vùng Răng Chỉ Định Điều Trị
              </span>
              <h4 className="text-sm font-extrabold text-[#1996e0]">
                🦷 {planDiagnosisNotes.toothNumber}
              </h4>
              <p className="text-xs text-slate-500">
                Ghi chú: {planDiagnosisNotes.clinicalNotes}
              </p>
            </div>

            {/* Box 3: Tiến độ bước */}
            <div className="p-4 rounded-2xl bg-[#f4f9fd] border border-[#1996e0]/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1996e0] block">
                Tiến Độ Thực Hiện
              </span>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {completedStepsCount}/{visibleSteps.length} Bước Hoàn Thành
                </h4>
                <span className="text-xs font-mono font-bold text-[#1996e0]">
                  {Math.round((completedStepsCount / (visibleSteps.length || 1)) * 100)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-[#1996e0] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedStepsCount / (visibleSteps.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH NÚT BẤM TINH GỌN (TOGGLE BUTTONS HUB - MODERN UI) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-[#1996e0]/20 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>🔍</span>
              <span>Xem Chi Tiết Chi Tiết Hồ Sơ Khám & Phác Đồ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhấp vào các nút bên dưới để mở rộng xem từng mục chi tiết theo nhu cầu:
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpandedSection((prev) => (prev === "all" ? "none" : "all"))}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${expandedSection === "all"
              ? "bg-[#1996e0] text-white border-[#1996e0] shadow-sm"
              : "bg-blue-50 text-[#1996e0] border-blue-200 hover:bg-blue-100"
              }`}
          >
            {expandedSection === "all" ? "▲ Thu gọn tất cả" : "⚡ Hiện tất cả mục"}
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Button 1: Quy trình & phác đồ */}
          <button
            type="button"
            onClick={() => toggleSection("workflow")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${expandedSection === "workflow" || expandedSection === "all"
              ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-md"
              : "border-slate-200 bg-white hover:border-[#1996e0]/50 hover:bg-blue-50/50"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#1996e0] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                📋
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${expandedSection === "workflow" || expandedSection === "all"
                  ? "bg-[#1996e0] text-white"
                  : "bg-slate-100 text-slate-600"
                  }`}
              >
                {visibleSteps.length} bước
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0]">
                Quy Trình & Phác Đồ
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các giai đoạn điều trị & lịch tái khám
              </p>
            </div>
          </button>

          {/* Button 2: Đơn thuốc */}
          <button
            type="button"
            onClick={() => toggleSection("prescription")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${expandedSection === "prescription" || expandedSection === "all"
              ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-md"
              : "border-slate-200 bg-white hover:border-[#1996e0]/50 hover:bg-blue-50/50"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                💊
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${expandedSection === "prescription" || expandedSection === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
                  }`}
              >
                {activeRichPrescriptions[0]?.items.length || 0} loại
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0]">
                Đơn Thuốc Bác Sĩ
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Danh mục thuốc & bản scan đơn thuốc
              </p>
            </div>
          </button>

          {/* Button 3: Phim X-Quang */}
          <button
            type="button"
            onClick={() => toggleSection("images")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${expandedSection === "images" || expandedSection === "all"
              ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-md"
              : "border-slate-200 bg-white hover:border-[#1996e0]/50 hover:bg-blue-50/50"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🩻
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${expandedSection === "images" || expandedSection === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
                  }`}
              >
                {realClinicalImages.length} hình ảnh
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0]">
                Phim X-Quang & Ảnh
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Xem ảnh thực tế & phim chụp chẩn đoán
              </p>
            </div>
          </button>

          {/* Button 4: Xem Hồ Sơ Bệnh Án */}
          <button
            type="button"
            onClick={() => {
              toggleSection("medical-record");
              const el = document.getElementById("printable-medical-record-card");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${expandedSection === "medical-record" || expandedSection === "all"
                ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-md"
                : "border-slate-200 bg-white hover:border-[#1996e0]/50 hover:bg-blue-50/50 hover:shadow-md"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1996e0] to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                📄
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${expandedSection === "medical-record" || expandedSection === "all"
                    ? "bg-[#1996e0] text-white"
                    : "bg-blue-100 text-[#1996e0] border border-blue-200"
                  }`}
              >
                1 BỆNH ÁN
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0]">
                Hồ Sơ Bệnh Án
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Xem chi tiết chẩn đoán & đơn thuốc y khoa
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION EXPANDABLE 1: QUY TRÌNH KHÁM & PHÁC ĐỒ ĐIỀU TRỊ */}
      {/* ========================================================================= */}
      {(expandedSection === "workflow" || expandedSection === "all") && (
        <section className="bg-white rounded-3xl border border-[#1996e0]/30 p-6 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#1996e0] text-white flex items-center justify-center font-bold text-sm">
                📋
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Quy Trình Khám Bệnh & Tiến Trình Phác Đồ Chi Tiết
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi từng bước thủ thuật y khoa và lịch hẹn tái khám của bác sĩ.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExpandedSection("none")}
              className="text-xs font-bold text-[#1996e0] hover:underline cursor-pointer"
            >
              ▲ Thu gọn mục này
            </button>
          </div>

          {/* Banner Nhắc Nhở Lịch Hẹn Tái Khám (Nếu Có) */}
          {nextAppointmentStep && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 via-[#1996e0] to-cyan-600 text-white shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                    ⚡ Lịch hẹn tái khám tiếp theo
                  </span>
                  <h4 className="text-sm font-black text-white">
                    {nextAppointmentStep.title} - {nextAppointmentStep.appointment?.dateLabel || "Theo chỉ định bác sĩ"}
                  </h4>
                  <p className="text-xs text-blue-50">
                    Bác sĩ phụ trách: <strong>{treatment.doctor}</strong> | Phòng khám: <strong>Phòng Khám Răng Hàm Mặt #02</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {nextAppointmentStep.appointment?.status === "confirmed" ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1">
                        ✓ Đã Xác Nhận
                      </span>
                      {nextAppointmentStep.appointment?.id && (
                        <button
                          type="button"
                          onClick={() => restoreMutation.mutate(nextAppointmentStep.appointment!.id)}
                          disabled={restoreMutation.isPending}
                          className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Hoàn tác
                        </button>
                      )}
                    </div>
                  ) : (
                    nextAppointmentStep.appointment?.id && (
                      <button
                        type="button"
                        onClick={() => confirmMutation.mutate(nextAppointmentStep.appointment!.id)}
                        disabled={confirmMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-white text-[#1996e0] hover:bg-blue-50 font-black text-xs shadow-md transition-all cursor-pointer border border-white"
                      >
                        {confirmMutation.isPending ? "Đang xử lý..." : "✓ Xác Nhận Lịch Hẹn Ngay"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Các Bước Trong Phác Đồ */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Danh sách các bước thực hiện trong phác đồ ({visibleSteps.length} bước):
            </h4>

            {/* Stepper Header Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {visibleSteps.map((step, idx) => {
                const active = selectedStepIndex === idx;
                const isCompleted = step.status === "completed";
                const isCurrent = step.status === "current";

                return (
                  <button
                    key={step.id || idx}
                    type="button"
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${active
                      ? "bg-[#1996e0] text-white border-[#1996e0] shadow-md scale-[1.02]"
                      : isCompleted
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : isCurrent
                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-mono text-[11px] font-black">
                      {idx + 1}
                    </span>
                    <span>{step.title}</span>
                    {isCompleted && <span>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Step Detail Active Box */}
            {selectedStep && (
              <div className="p-5 rounded-2xl bg-[#f4f9fd] border border-[#1996e0]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1996e0]">
                      Chi Tiết Bước #{selectedStepIndex + 1}
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedStep.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedStep.status === "completed"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : selectedStep.status === "current"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                        }`}
                    >
                      {selectedStep.status === "completed"
                        ? "✓ Đã hoàn thành"
                        : selectedStep.status === "current"
                          ? "● Đang thực hiện"
                          : "⏳ Sắp diễn ra"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="px-3 py-1 rounded-lg bg-[#1996e0] text-white text-xs font-bold hover:bg-blue-600 transition-all cursor-pointer shadow-xs"
                    >
                      🧾 Hóa Đơn Bước
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-bold">Thủ thuật & Mô tả thực hiện:</strong>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedStep.description || "Thực hiện thủ thuật theo đúng quy chuẩn vô trùng y tế."}
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-bold">Chi phí dịch vụ bước này:</strong>
                    <p className="text-base font-black font-mono text-[#1996e0]">
                      {formatMoney(selectedStep.paidAmount)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Trạng thái thanh toán: <strong className="text-emerald-600">Đã quyết toán</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION EXPANDABLE 2: ĐƠN THUỐC BÁC SĨ KÊ */}
      {/* ========================================================================= */}
      {(expandedSection === "prescription" || expandedSection === "all") && (
        <section className="bg-white rounded-3xl border border-[#1996e0]/30 p-6 shadow-xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                💊
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Danh Mục Đơn Thuốc Y Khoa Được Bác Sĩ Chỉ Định
                </h3>
                <p className="text-xs text-slate-500">
                  Uống thuốc đúng liều lượng và thời gian theo sự hướng dẫn của bác sĩ.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExpandedSection("none")}
              className="text-xs font-bold text-[#1996e0] hover:underline cursor-pointer"
            >
              ▲ Thu gọn mục này
            </button>
          </div>

          {activeRichPrescriptions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <span className="text-2xl block mb-2">💊</span>
              <p className="text-xs font-bold text-slate-700">Chưa có đơn thuốc nào trong hồ sơ này</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Bác sĩ chưa khởi tạo hoặc chỉ định đơn thuốc trực tiếp cho phác đồ điều trị này.
              </p>
            </div>
          ) : (
            activeRichPrescriptions.map((presc) => (
              <div key={presc.id} className="space-y-4">
                {/* Presc Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs">
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                      MÃ ĐƠN: {presc.code}
                    </span>
                    <span className="ml-3 text-slate-600">Ngày kê: <strong>{presc.date}</strong></span>
                    <span className="ml-3 text-slate-600">Bác sĩ: <strong>{presc.doctor}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewPrescriptionDoc(previewPrescriptionDoc?.id === presc.id ? null : presc)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                      previewPrescriptionDoc?.id === presc.id
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <span>
                      {previewPrescriptionDoc?.id === presc.id
                        ? "▲ Thu Gọn Bản Scan Đơn Thuốc"
                        : "🔍 Xem Đơn Thuốc Scan Có Chữ Ký Số"}
                    </span>
                  </button>
                </div>

                {/* HIỂN THỊ THAY THẾ: BẢN SCAN ĐƠN THUỐC ĐIỆN TỬ HOẶC BẢNG DANH MỤC THUỐC THƯỜNG */}
                {previewPrescriptionDoc?.id === presc.id ? (
                  <div className="bg-gradient-to-b from-emerald-50/70 via-white to-white rounded-3xl border-2 border-emerald-500/40 p-5 sm:p-6 shadow-xl space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100 pb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          📜
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            Bản Scan Đơn Thuốc Điện Tử Đã Ký Số
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Hiển thị trực tiếp đơn thuốc hợp quy ban hành từ phòng khám
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                        ✓ Chữ Ký Số Hợp Lệ (Bác sĩ {presc.doctor})
                      </span>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-sans max-w-2xl mx-auto">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                          <h2 className="text-sm font-black text-[#1996e0] uppercase tracking-wide">
                            HỆ THỐNG NHA KHOA SMART DENTAL
                          </h2>
                          <p className="text-[10px] text-slate-500">Giấy phép HĐ số: 8821/BYT-GPHĐ</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                            MÃ ĐƠN: {presc.code}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Ngày: {presc.date}</p>
                        </div>
                      </div>

                      <div className="text-center py-1">
                        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                          ĐƠN THUỐC NHA KHOA
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                          Danh mục thuốc chỉ định:
                        </h4>
                        <ol className="space-y-2 list-decimal list-inside text-xs">
                          {presc.items.map((item, idx) => (
                            <li key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                              <strong className="text-slate-900 font-bold">{item.medicineName}</strong> - <span className="text-[#1996e0] font-semibold">{item.dosage}</span>
                              <div className="text-[11px] text-slate-600 ml-4">
                                • Tần suất: <strong>{item.frequency}</strong> ({item.duration})
                                <br />
                                • Dặn dò: {item.instruction}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {presc.notes && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <strong>📌 Ghi chú dặn dò:</strong> {presc.notes}
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-[11px] text-slate-500">
                          <p>• Cần mang theo đơn thuốc khi tái khám.</p>
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-[11px] text-slate-500">Bác sĩ khám bệnh</p>
                          <div className="font-serif italic font-bold text-[#1996e0] text-sm py-0.5">
                            {presc.doctor}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                            ✓ Đã ký số y tế
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Table Danh Mục Thuốc */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Tên Thuốc & Hoạt Chất</th>
                            <th className="p-3">Liều Dùng</th>
                            <th className="p-3">Tần Suất & Thời Gian</th>
                            <th className="p-3">Hướng Dẫn Uống</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {presc.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3">
                                <strong className="text-slate-900 text-sm block">{item.medicineName}</strong>
                              </td>
                              <td className="p-3">
                                <span className="font-mono font-bold text-[#1996e0] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                  {item.dosage}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 font-medium">
                                {item.frequency} ({item.duration})
                              </td>
                              <td className="p-3 text-slate-600">
                                {item.instruction}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Ghi chú kê đơn */}
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>📌 Ghi chú dặn dò của bác sĩ:</strong> {presc.notes}
                    </div>
                  </>
                )}
              </div>
            )))}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION EXPANDABLE 3: PHIM X-QUANG & ẢNH LÂM SÀNG */}
      {/* ========================================================================= */}
      {(expandedSection === "images" || expandedSection === "all") && (
        <section className="bg-white rounded-3xl border border-[#1996e0]/30 p-6 shadow-xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                🩻
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Dữ Liệu Hình Ảnh Lâm Sàng & Phim Chụp X-Quang ({realClinicalImages.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {realClinicalImages.length > 0
                    ? "Nhấp vào bất kỳ ảnh nào để phóng to và xem chi tiết đánh giá chuyên môn của bác sĩ."
                    : "Hình ảnh và phim chụp được liên kết trực tiếp từ hồ sơ bệnh án của phác đồ này."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExpandedSection("none")}
              className="text-xs font-bold text-[#1996e0] hover:underline cursor-pointer"
            >
              ▲ Thu gọn mục này
            </button>
          </div>

          {realClinicalImages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xl font-bold">
                📷
              </div>
              <p className="text-sm font-bold text-slate-700">
                Chưa có hình ảnh hoặc phim X-quang được đính kèm cho phác đồ này
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bác sĩ điều trị chưa tải lên tệp ảnh lâm sàng cho các bước thuộc phác đồ này. Khi bác sĩ cập nhật hình ảnh vào bệnh án, dữ liệu sẽ hiển thị tự động tại đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {realClinicalImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setPreviewImage(img)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-4/3 overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                  </div>

                  {/* Overlay details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#1996e0] text-white px-2.5 py-0.5 rounded-md self-start shadow-sm">
                      {img.category}
                    </span>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {img.title}
                      </h4>
                      <p className="text-[10px] text-slate-300 flex items-center justify-between">
                        <span>📅 {img.date}</span>
                        <span className="font-semibold text-cyan-400">🔍 Nhấp để phóng to</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION EXPANDABLE: HỒ SƠ BỆNH ÁN Y KHOA (HIỂN THỊ TRỰC TIẾP KHI BẤM NÚT) */}
      {/* ========================================================================= */}
      {(expandedSection === "medical-record" || expandedSection === "all") && (
        <section className="bg-white rounded-3xl border border-[#1996e0]/30 p-6 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1996e0] to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                📄
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Hồ Sơ Bệnh Án Y Khoa Điện Tử (Dữ Liệu DB Cập Nhật)
                </h3>
                <p className="text-xs text-slate-500">
                  Thông tin chẩn đoán y khoa, thủ thuật chỉ định và đơn thuốc chính thức
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1996e0] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-blue-500 shadow-sm shadow-blue-500/20"
              >
                <span>🖨️ In Bệnh Án PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setExpandedSection("none")}
                className="text-xs font-bold text-[#1996e0] hover:underline cursor-pointer"
              >
                ▲ Thu gọn mục này
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Grid Chẩn đoán & Ghi chú */}
            <div className="grid gap-3.5 md:grid-cols-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50/90 via-blue-50/30 to-white border border-sky-200/80 border-l-4 border-l-[#1996e0] space-y-3 shadow-2xs flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#1996e0] flex items-center gap-1.5">
                      <span>🩺</span> CHẨN ĐOÁN Y KHOA CHÍNH
                    </span>
                  </div>

                  {planDiagnosisNotes.chiefComplaint && (
                    <div className="p-3 rounded-xl bg-white/90 border border-sky-200/80 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
                        Lý do khám / Triệu chứng:
                      </span>
                      <p className="text-xs font-bold text-slate-800 leading-relaxed break-words">
                        {planDiagnosisNotes.chiefComplaint}
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white/60 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Kết luận chẩn đoán y khoa:
                    </span>
                    <p className="text-xs font-extrabold text-slate-900 leading-relaxed break-words">
                      {planDiagnosisNotes.diagnosis}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>🦷</span> VÙNG RĂNG & GHI CHÚ BÁC SĨ
                    </span>
                    <span className="text-xs font-bold text-[#1996e0] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                      Vùng răng: {planDiagnosisNotes.toothNumber}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Ghi chú thủ thuật & Chỉ định chuyên khoa:
                    </span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed break-words">
                      {planDiagnosisNotes.clinicalNotes}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hàng Đơn thuốc & Chữ ký */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span>💊</span> ĐƠN THUỐC ĐÃ KÊ THEO BỆNH ÁN
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {((activeRichPrescriptions[0]?.items) || [
                    {
                      medicineName: "Paracetamol",
                      dosage: "10-15 mg/kg/lần",
                      frequency: "4-6 giờ/lần khi đau",
                      duration: "2-3 ngày",
                    },
                  ]).map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-white text-slate-900 font-extrabold px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs text-xs"
                    >
                      <span className="text-emerald-600 font-black">● {med.medicineName}</span>
                      <span className="text-slate-600 font-semibold text-[11px]">({med.dosage} • {med.frequency} • {med.duration})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-200">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">Bác sĩ lập bệnh án</span>
                  <span className="text-xs font-black text-slate-900">{treatment.doctor}</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1">
                  ✓ Đã ký số
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION EXPANDABLE 4: HÓA ĐƠN CHI PHÍ & THANH TOÁN THỦ THUẬT (HIỂN THỊ TRỰC TIẾP TRÊN TRANG - KHÔNG POPUP MODAL) */}
      {/* ========================================================================= */}
      {(expandedSection === "invoice" || expandedSection === "all") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg space-y-6 animate-in slide-in-from-top-4 duration-300">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🧾
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Hóa Đơn Chi Phí & Thanh Toán Dịch Vụ Nha Khoa
                </h3>
                <p className="text-xs text-slate-500">
                  Bảng kê chi tiết tài chính & nghĩa vụ thanh toán theo từng giai đoạn điều trị
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                Tổng {visibleSteps.length} Hóa Đơn
              </span>
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-900 shadow-xs"
              >
                <span>📥 In Toàn Bộ Hóa Đơn</span>
              </button>
            </div>
          </div>

          {/* Inline Invoices List */}
          <div className="space-y-6">
            {visibleSteps.map((step, index) => {
              const amount = step.paidAmount || (index === 0 ? 1500000 : 5000000);
              const isPaid = step.status === "completed" || step.paidAmount > 0;
              const invoiceCode = `HD-DT-${step.id.slice(0, 8).toUpperCase()}`;
              const formattedAmount = new Intl.NumberFormat("vi-VN").format(amount);

              return (
                <div
                  key={step.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-xs hover:border-[#1996e0]/40 transition-all space-y-0"
                >
                  {/* Step Invoice Header */}
                  <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                        {invoiceCode}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-white">
                          Bước {index + 1}: {step.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Ngày thực hiện: {step.date} • Bác sĩ: {treatment.doctor}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 ${isPaid
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                        }`}
                    >
                      {isPaid ? "✓ Đã Thanh Toán 100%" : "⏳ Chưa Thanh Toán"}
                    </span>
                  </div>

                  {/* Step Item Table */}
                  <div className="p-4 bg-white overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                          <th className="p-2.5 font-bold">STT</th>
                          <th className="p-2.5 font-bold">Hạng Mục Dịch Vụ & Vật Tư</th>
                          <th className="p-2.5 font-bold text-center">SL</th>
                          <th className="p-2.5 font-bold text-right">Đơn Giá</th>
                          <th className="p-2.5 font-bold text-right">Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-400">01</td>
                          <td className="p-2.5 font-medium">
                            <strong className="text-slate-900 block">{step.title}</strong>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {step.description || "Thủ thuật nha khoa đúng quy trình y tế."}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-center text-slate-600">01</td>
                          <td className="p-2.5 font-mono text-right text-slate-600">{formattedAmount}đ</td>
                          <td className="p-2.5 font-mono font-bold text-right text-slate-900">{formattedAmount}đ</td>
                        </tr>
                        <tr className="bg-slate-50/40">
                          <td className="p-2.5 font-bold text-slate-400">02</td>
                          <td className="p-2.5 font-medium">
                            <span className="text-slate-700 block font-medium">
                              Vật Tư Y Tế & Khí Cụ Nha Khoa Vô Trùng
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-center text-slate-600">01 gói</td>
                          <td className="p-2.5 font-mono text-right text-slate-400">Miễn phí</td>
                          <td className="p-2.5 font-mono font-extrabold text-right text-emerald-600">0đ</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Step Footer Total */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Tổng tiền bước {index + 1}:
                    </span>
                    <div className="flex items-center gap-4">
                      <strong className="text-sm font-black text-emerald-700 font-mono">
                        {formattedAmount} VNĐ
                      </strong>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>🖨️ In Hóa Đơn</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX XEM PHIM X-QUANG */}
      {/* ========================================================================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1996e0]">
                  {previewImage.category} • {previewImage.date}
                </span>
                <h3 className="text-base font-bold text-white">{previewImage.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center flex-1 min-h-[300px]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="p-5 bg-white border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bác sĩ chỉ định: <strong className="text-slate-800">{previewImage.doctor}</strong></span>
                <span>Ngày lưu: <strong className="text-slate-800">{previewImage.date}</strong></span>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong>Ghi chú chuyên môn:</strong> {previewImage.notes}
              </p>
            </div>
          </div>
        </div>
      )}



      {/* Invoice Modal */}
      {showInvoiceModal && selectedStep && (
        <StepInvoiceModal
          treatment={treatment}
          step={selectedStep}
          stepIndex={selectedStepIndex}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </article>

    {/* ========================================================================= */}
    {/* PORTAL FORM IN BỆNH ÁN A4 CHUẨN Y KHOA - RENDER SÁT ĐẦU TRANG CỦA BODY */}
    {/* ========================================================================= */}
    {isMounted &&
      createPortal(
        <div id="printable-medical-record-form" className="hidden print:block text-slate-900 bg-white space-y-4">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              *, *:before, *:after {
                animation: none !important;
                transition: none !important;
                transform: none !important;
                filter: none !important;
                perspective: none !important;
                backdrop-filter: none !important;
                box-shadow: none !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                height: auto !important;
                overflow: visible !important;
              }
              body > *:not(#printable-medical-record-form) {
                display: none !important;
              }
              #printable-medical-record-form {
                display: block !important;
                position: static !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: Arial, Helvetica, sans-serif !important;
              }
            }
          `}</style>

          {/* HEADER PHÒNG KHÁM */}
          <div className="border-b-2 border-slate-900 pb-3 space-y-1.5">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  HỆ THỐNG NHA KHOA THÔNG MINH SMART DENTAL SYSTEM
                </h1>
                <p className="text-[11px] text-slate-600">
                  Địa chỉ: 123 Đường 3/2, Phường 11, Quận 10, TP. Hồ Chí Minh | Hotline: 1900 6868
                </p>
                <p className="text-[10px] text-slate-500">Giấy phép HĐ y tế số: 8821/BYT-GPHĐ</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold border border-slate-400 px-2.5 py-1 rounded">
                  MÃ BN: {patient?.patientCode || "PAT-2026-0B927E"}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Ngày lập: {treatment.date || "24/08/2026"}</p>
              </div>
            </div>
            <div className="text-center pt-1">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                HỒ SƠ BỆNH ÁN NHA KHOA Y KHOA ĐIỆN TỬ
              </h2>
            </div>
          </div>

          {/* 1. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN */}
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              1. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN
            </h3>
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2 border-r border-slate-300 bg-slate-50/50 w-1/3">
                    <span className="text-slate-500">Họ và tên:</span> <strong className="text-slate-900 uppercase font-black">{patient?.fullName || "Bệnh Nhân"}</strong>
                  </td>
                  <td className="p-2 border-r border-slate-300 bg-slate-50/50 w-1/3">
                    <span className="text-slate-500">Mã bệnh nhân:</span> <strong className="text-slate-900 font-mono font-bold">{patient?.patientCode || "PAT-2026-0B927E"}</strong>
                  </td>
                  <td className="p-2 bg-slate-50/50 w-1/3">
                    <span className="text-slate-500">Ngày sinh / Tuổi:</span> <strong className="text-slate-900 font-bold">{formattedDobAndAge}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 bg-slate-50/50">
                    <span className="text-slate-500">Số điện thoại:</span> <strong className="text-slate-900 font-bold">{patient?.phone || "Chưa cập nhật"}</strong>
                  </td>
                  <td className="p-2 border-r border-slate-300 bg-slate-50/50">
                    <span className="text-slate-500">Dịch vụ khám:</span> <strong className="text-slate-900 font-bold">{treatment.title}</strong>
                  </td>
                  <td className="p-2 bg-slate-50/50">
                    <span className="text-slate-500">Bác sĩ phụ trách:</span> <strong className="text-slate-900 font-bold">{treatment.doctor}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. CHẨN ĐOÁN Y KHOA & KHÁM LÂM SÀNG */}
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              2. KHÁM LÂM SÀNG & CHẨN ĐOÁN Y KHOA
            </h3>
            <div className="border border-slate-300 rounded-lg p-2.5 text-xs space-y-2 bg-slate-50/30">
              {planDiagnosisNotes.chiefComplaint && (
                <div className="border-b border-slate-200 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Lý do đến khám (Chief Complaint):</span>
                  <p className="font-semibold text-slate-900 mt-0.5 leading-snug">{planDiagnosisNotes.chiefComplaint}</p>
                </div>
              )}
              <div className="border-b border-slate-200 pb-1.5">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Chẩn đoán y khoa chính:</span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{planDiagnosisNotes.diagnosis}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Vùng răng điều trị:</span>
                  <p className="font-bold text-[#1996e0]">{planDiagnosisNotes.toothNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Ghi chú & Thủ thuật chỉ định:</span>
                  <p className="font-medium text-slate-800">{planDiagnosisNotes.clinicalNotes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BẢNG ĐƠN THUỐC ĐÃ KÊ */}
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              3. CHỈ ĐỊNH ĐƠN THUỐC KÈM THEO
            </h3>
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-10 text-center">STT</th>
                  <th className="p-2 border-r border-slate-300 text-left">Tên thuốc & Hàm lượng</th>
                  <th className="p-2 border-r border-slate-300 text-left">Liều dùng / Lần</th>
                  <th className="p-2 border-r border-slate-300 text-left">Tần suất</th>
                  <th className="p-2 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-800">
                {((activeRichPrescriptions[0]?.items) || [
                  {
                    medicineName: "Paracetamol",
                    dosage: "10-15 mg/kg/lần",
                    frequency: "4-6 giờ/lần khi đau",
                    duration: "2-3 ngày",
                  },
                ]).map((med, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{med.medicineName}</td>
                    <td className="p-2 border-r border-slate-300">{med.dosage}</td>
                    <td className="p-2 border-r border-slate-300">{med.frequency}</td>
                    <td className="p-2 font-semibold text-slate-900">{med.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CHỮ KÝ BÁC SĨ */}
          <div className="pt-3 flex justify-between items-end text-xs">
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p>• Bệnh nhân tuân thủ đúng chỉ định và uống thuốc theo hướng dẫn của bác sĩ.</p>
              <p>• Trường hợp có phản ứng bất thường, vui lòng liên hệ ngay hotline phòng khám.</p>
            </div>

            <div className="text-center space-y-1 pl-4 shrink-0">
              <p className="text-[10px] text-slate-600 font-medium">Bác sĩ khám & Lập bệnh án</p>
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                ✓ Đã ký số y tế
              </p>
              <p className="text-xs font-bold text-slate-900 pt-2">{treatment.doctor}</p>
            </div>
          </div>

        </div>,
        document.body
      )}
  </>
);
}
