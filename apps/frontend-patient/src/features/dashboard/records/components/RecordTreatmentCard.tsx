"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import {
  confirmPatientAppointment,
  restorePatientAppointment,
} from "../../appointment/api";
import {
  formatMoney,
  type TreatmentRecordView,
  formatShortDate,
  type RichPrescription,
} from "./recordMappers";
import { StepInvoiceModal } from "./StepInvoiceModal";
import { recordsQueryKeys } from "../hooks/useRecordsQueries";
import { appointmentQueryKeys } from "../../appointment/hooks/useAppointmentQueries";
import type { PatientRecordsResponse } from "../api";

type RecordTreatmentCardProps = {
  treatment: TreatmentRecordView;
  index: number;
  recordsData: PatientRecordsResponse;
};

const subscribeToMount = () => () => {};

export function RecordTreatmentCard({
  treatment,
  recordsData,
}: RecordTreatmentCardProps) {
  const queryClient = useQueryClient();

  // State cho xem hóa đơn bước
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const isMounted = useSyncExternalStore(subscribeToMount, () => true, () => false);

  // State xem Lightbox Phim X-quang & Đơn thuốc gốc
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    doctor: string;
    date: string;
    notes: string;
    category: string;
  } | null>(null);

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

  // 1. Toàn bộ hồ sơ bệnh án từ API (bao gồm cả records theo phác đồ và records trực tiếp của bệnh nhân)
  const currentPlanData = recordsData.treatmentPlans.find((plan) => plan.id === treatment.id);

  const allMedicalRecords = useMemo(() => {
    const list: Array<PatientRecordsResponse["medicalRecords"][number]> = [];
    const seen = new Set<string>();

    (recordsData?.medicalRecords ?? []).forEach((r) => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        list.push(r);
      }
    });

    currentPlanData?.steps?.forEach((step) => {
      step.medicalRecords?.forEach((r) => {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          list.push({
            id: r.id,
            createdAt: step.completedAt || treatment.date,
            doctor: treatment.doctor,
            service: step.title || treatment.title,
            chiefComplaint: r.chiefComplaint,
            diagnosis: r.diagnosis,
            treatmentNotes: r.treatmentNotes,
            followUpDate: r.followUpDate,
            images: r.images,
            prescriptions: r.prescriptions,
          });
        }
      });
    });

    return list;
  }, [recordsData, currentPlanData, treatment]);

  // 2. Chẩn đoán & Ghi chú từ backend động theo hồ sơ
  const planDiagnosisNotes = useMemo(() => {
    const activeMedicalRecord = allMedicalRecords[0];

    const toothDisplay =
      treatment.tooth && treatment.tooth !== "Theo chỉ định"
        ? treatment.tooth
        : "Vùng răng chỉ định";

    if (!activeMedicalRecord) {
      return {
        chiefComplaint: "Khám và kiểm tra răng định kỳ",
        diagnosis: "Chưa có chẩn đoán cho phác đồ này",
        clinicalNotes: "Chưa có ghi chú điều trị.",
        toothNumber: toothDisplay,
      };
    }

    return {
      chiefComplaint: activeMedicalRecord.chiefComplaint || "Khám và kiểm tra răng định kỳ",
      diagnosis: activeMedicalRecord.diagnosis || "Chẩn đoán nha khoa chuyên khoa",
      clinicalNotes: activeMedicalRecord.treatmentNotes || "Điều trị hoàn tất theo phác đồ.",
      toothNumber: toothDisplay,
    };
  }, [allMedicalRecords, treatment]);

  // 3. Toàn bộ đơn thuốc trích xuất từ database (medical_records + phác đồ)
  const allRichPrescriptions = useMemo(() => {
    const list: RichPrescription[] = [...(treatment.richPrescriptions || [])];
    const existingIds = new Set(list.map((p) => p.id));

    allMedicalRecords.forEach((record, recIdx) => {
      (record.prescriptions ?? []).forEach((presc, prescIdx) => {
        if (!existingIds.has(presc.id)) {
          existingIds.add(presc.id);
          list.push({
            id: presc.id || `presc-${record.id}-${prescIdx}`,
            code: `DT-${String(recIdx + 1).padStart(3, "0")}`,
            doctor: record.doctor || treatment.doctor,
            date: record.createdAt ? formatShortDate(record.createdAt) : treatment.date,
            notes: presc.notes || record.treatmentNotes || "Đơn thuốc theo chỉ định của bác sĩ",
            prescriptionImageUrl: null,
            items: (presc.items ?? []).map((item) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency || "Theo chỉ định",
              duration: item.duration || "5 ngày",
              instruction: item.instruction || "Uống sau ăn",
            })),
          });
        }
      });
    });

    return list;
  }, [treatment, allMedicalRecords]);

  // 4. Hình ảnh lâm sàng & X-quang trích xuất từ medical_records
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

    allMedicalRecords.forEach((record, recordIdx) => {
      const rawImages = record.images;
      if (Array.isArray(rawImages) && rawImages.length > 0) {
        rawImages.forEach((img, imgIdx) => {
          const isXray =
            img?.type === "XRAY" ||
            `${img?.title || ""} ${img?.type || ""}`.toLowerCase().includes("xray") ||
            `${img?.title || ""}`.toLowerCase().includes("xquang");

          const rawUrl = img?.url || img?.imageUrl || img?.src;
          if (typeof rawUrl !== "string" || !rawUrl.trim()) return;

          imagesList.push({
            id: img?.id || `img-rec-${record.id || recordIdx}-${imgIdx}`,
            url: rawUrl.trim(),
            title:
              img?.title && img.title !== "X-Ray" && img.title !== "Clinical"
                ? img.title
                : isXray
                  ? "Phim X-Quang Panorama Chẩn Đoán"
                  : "Ảnh Lâm Sàng Vùng Điều Trị",
            category: isXray ? "PHIM X-QUANG PANORAMA" : "ẢNH THỰC TẾ LÂM SÀNG",
            date: record.createdAt ? formatShortDate(record.createdAt) : treatment.date,
            doctor: record.doctor || treatment.doctor,
            notes:
              img?.notes ||
              record.treatmentNotes ||
              record.chiefComplaint ||
              record.diagnosis ||
              "Dữ liệu hình ảnh được liên kết trực tiếp từ hồ sơ bệnh án điện tử.",
          });
        });
      }
    });

    return Array.from(new Map(imagesList.map((item) => [item.id, item])).values());
  }, [allMedicalRecords, treatment]);

  // 5. Phác đồ chi tiết & các bước
  const visibleSteps = useMemo(() => {
    const raw = (treatment.treatmentPlan ?? []).filter((s) => s.status !== "summary");
    if (raw.length > 0) return raw;

    return [
      {
        id: "step-plan-main",
        date: treatment.date,
        title: treatment.title,
        description: treatment.description || "Khám lâm sàng, chẩn đoán và điều trị theo phác đồ chỉ định.",
        status: "completed" as const,
        paidAmount: treatment.paidAmount || 0,
        paymentStatusLabel: treatment.paymentStatusLabel || "Thanh toán đủ",
        prescriptions: treatment.prescriptions || [],
        richPrescriptions: allRichPrescriptions,
        careInstructions: treatment.careInstructions || ["Tuân thủ hướng dẫn và dặn dò của bác sĩ."],
        images: { xray: null, clinical: null },
        medicalRecordId: allMedicalRecords[0]?.id || null,
        appointment: null,
      },
    ];
  }, [treatment, allRichPrescriptions, allMedicalRecords]);

  const selectedStep = visibleSteps[selectedStepIndex] ?? visibleSteps[0];

  const nextAppointmentStep = useMemo(() => {
    return visibleSteps.find(
      (s) =>
        s.appointment &&
        (s.appointment.status === "pending" || s.appointment.status === "confirmed"),
    );
  }, [visibleSteps]);

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
    setExpandedSection((prev) => (prev === section ? "none" : section));
  }

  const actualStepsCount = visibleSteps.length;
  const planMedicalRecordCount = allMedicalRecords.length;
  const invoiceCount = new Set([
    ...(currentPlanData?.invoices.map((invoice) => invoice.id) ?? []),
    ...(currentPlanData?.steps.flatMap((step) => step.invoices.map((invoice) => invoice.id)) ?? []),
  ]).size;

  return (
    <>
      <article className="space-y-6 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* THANH NÚT BẤM TINH GỌN (TOGGLE BUTTONS HUB - MODERN UI) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Chi Tiết Phác Đồ: {treatment.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ngày lập: <strong className="text-slate-700 font-semibold">{treatment.date}</strong> • Nhấp vào các nút bên dưới để mở rộng xem chi tiết
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpandedSection((prev) => (prev === "all" ? "none" : "all"))}
            className={`shrink-0 self-end sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${expandedSection === "all"
              ? "bg-[#1996e0] text-white border-[#1996e0] shadow-sm"
              : "bg-blue-50 text-[#1996e0] border-blue-200 hover:bg-blue-100"
              }`}
          >
            {expandedSection === "all" ? "Thu gọn tất cả" : "Hiện tất cả mục"}
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {/* Button 1: Quy trình & phác đồ */}
          <button
            type="button"
            onClick={() => toggleSection("workflow")}
            className={`w-full h-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
              expandedSection === "workflow" || expandedSection === "all"
                ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-sm"
                : "border-slate-200 bg-white hover:border-[#1996e0]/60 hover:bg-blue-50/30"
            }`}
          >
            <div>
              {/* Top Header: Icon & Count Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-[#0863c5] group-hover:scale-105 transition-transform shadow-2xs">
                  <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="rounded-lg bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-[#0863c5]">
                  {actualStepsCount} bước
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0] transition-colors">
                Quy Trình & Phác Đồ
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                Các giai đoạn điều trị & lịch tái khám
              </p>
            </div>

            {/* Bottom Action Pill */}
            <div className={`mt-3 pt-2.5 border-t flex items-center justify-between transition-colors ${
              expandedSection === "workflow" || expandedSection === "all"
                ? "border-[#1996e0]/30"
                : "border-slate-100"
            }`}>
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
                expandedSection === "workflow" || expandedSection === "all"
                  ? "text-[#1996e0]"
                  : "text-slate-500 group-hover:text-[#1996e0]"
              }`}>
                {expandedSection === "workflow" || expandedSection === "all" ? (
                  <>
                    <span className="size-1.5 rounded-full bg-[#1996e0] animate-pulse" />
                    Đang xem
                  </>
                ) : (
                  "Bấm để xem"
                )}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-2xs ${
                expandedSection === "workflow" || expandedSection === "all"
                  ? "bg-[#1996e0] text-white"
                : "bg-blue-50 text-[#0863c5] group-hover:bg-[#1996e0] group-hover:text-white"
              }`}>
                <span>{expandedSection === "workflow" || expandedSection === "all" ? "Thu gọn" : "Chi tiết"}</span>
                <svg className={`size-3 transition-transform ${
                  expandedSection === "workflow" || expandedSection === "all"
                    ? "rotate-180"
                    : "group-hover:translate-x-0.5"
                }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {expandedSection === "workflow" || expandedSection === "all" ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </span>
            </div>
          </button>

          {/* Button 2: Đơn thuốc */}
          <button
            type="button"
            onClick={() => toggleSection("prescription")}
            className={`w-full h-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
              expandedSection === "prescription" || expandedSection === "all"
                ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-sm"
                : "border-slate-200 bg-white hover:border-[#1996e0]/60 hover:bg-blue-50/30"
            }`}
          >
            <div>
              {/* Top Header: Icon & Count Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-[#0863c5] group-hover:scale-105 transition-transform shadow-2xs">
                  <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                    <path d="m8.5 8.5 7 7" />
                  </svg>
                </span>
                <span className="rounded-lg bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-[#0863c5]">
                  {allRichPrescriptions.length} đơn
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0] transition-colors">
                Đơn Thuốc Bác Sĩ
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                Danh mục thuốc từ bệnh án
              </p>
            </div>

            {/* Bottom Action Pill */}
            <div className={`mt-3 pt-2.5 border-t flex items-center justify-between transition-colors ${
              expandedSection === "prescription" || expandedSection === "all"
                ? "border-[#1996e0]/30"
                : "border-slate-100"
            }`}>
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
                expandedSection === "prescription" || expandedSection === "all"
                  ? "text-[#1996e0]"
                  : "text-slate-500 group-hover:text-[#1996e0]"
              }`}>
                {expandedSection === "prescription" || expandedSection === "all" ? (
                  <>
                    <span className="size-1.5 rounded-full bg-[#1996e0] animate-pulse" />
                    Đang xem
                  </>
                ) : (
                  "Bấm để xem"
                )}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-2xs ${
                expandedSection === "prescription" || expandedSection === "all"
                  ? "bg-[#1996e0] text-white"
                  : "bg-blue-50 text-[#0863c5] group-hover:bg-[#1996e0] group-hover:text-white"
              }`}>
                <span>{expandedSection === "prescription" || expandedSection === "all" ? "Thu gọn" : "Chi tiết"}</span>
                <svg className={`size-3 transition-transform ${
                  expandedSection === "prescription" || expandedSection === "all"
                    ? "rotate-180"
                    : "group-hover:translate-x-0.5"
                }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {expandedSection === "prescription" || expandedSection === "all" ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </span>
            </div>
          </button>

          {/* Button 3: Phim X-Quang */}
          <button
            type="button"
            onClick={() => toggleSection("images")}
            className={`w-full h-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
              expandedSection === "images" || expandedSection === "all"
                ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-sm"
                : "border-slate-200 bg-white hover:border-[#1996e0]/60 hover:bg-blue-50/30"
            }`}
          >
            <div>
              {/* Top Header: Icon & Count Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-[#0863c5] group-hover:scale-105 transition-transform shadow-2xs">
                  <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </span>
                <span className="rounded-lg bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-[#0863c5]">
                  {realClinicalImages.length} ảnh
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0] transition-colors">
                Phim X-Quang & Ảnh
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                Xem ảnh thực tế & phim chụp chẩn đoán
              </p>
            </div>

            {/* Bottom Action Pill */}
            <div className={`mt-3 pt-2.5 border-t flex items-center justify-between transition-colors ${
              expandedSection === "images" || expandedSection === "all"
                ? "border-[#1996e0]/30"
                : "border-slate-100"
            }`}>
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
                expandedSection === "images" || expandedSection === "all"
                  ? "text-[#1996e0]"
                  : "text-slate-500 group-hover:text-[#1996e0]"
              }`}>
                {expandedSection === "images" || expandedSection === "all" ? (
                  <>
                    <span className="size-1.5 rounded-full bg-[#1996e0] animate-pulse" />
                    Đang xem
                  </>
                ) : (
                  "Bấm để xem"
                )}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-2xs ${
                expandedSection === "images" || expandedSection === "all"
                  ? "bg-[#1996e0] text-white"
                  : "bg-blue-50 text-[#0863c5] group-hover:bg-[#1996e0] group-hover:text-white"
              }`}>
                <span>{expandedSection === "images" || expandedSection === "all" ? "Thu gọn" : "Chi tiết"}</span>
                <svg className={`size-3 transition-transform ${
                  expandedSection === "images" || expandedSection === "all"
                    ? "rotate-180"
                    : "group-hover:translate-x-0.5"
                }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {expandedSection === "images" || expandedSection === "all" ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </span>
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
            className={`w-full h-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
              expandedSection === "medical-record" || expandedSection === "all"
                ? "border-[#1996e0] bg-[#1996e0]/10 ring-2 ring-[#1996e0]/30 shadow-sm"
                : "border-slate-200 bg-white hover:border-[#1996e0]/60 hover:bg-blue-50/30"
            }`}
          >
            <div>
              {/* Top Header: Icon & Count Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-[#0863c5] group-hover:scale-105 transition-transform shadow-2xs">
                  <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </span>
                <span className="rounded-lg bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-[#0863c5]">
                  {planMedicalRecordCount} hồ sơ
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0] transition-colors">
                Hồ Sơ Bệnh Án
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                Xem chi tiết chẩn đoán & đơn thuốc y khoa
              </p>
            </div>

            {/* Bottom Action Pill */}
            <div className={`mt-3 pt-2.5 border-t flex items-center justify-between transition-colors ${
              expandedSection === "medical-record" || expandedSection === "all"
                ? "border-[#1996e0]/30"
                : "border-slate-100"
            }`}>
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
                expandedSection === "medical-record" || expandedSection === "all"
                  ? "text-[#1996e0]"
                  : "text-slate-500 group-hover:text-[#1996e0]"
              }`}>
                {expandedSection === "medical-record" || expandedSection === "all" ? (
                  <>
                    <span className="size-1.5 rounded-full bg-[#1996e0] animate-pulse" />
                    Đang xem
                  </>
                ) : (
                  "Bấm để xem"
                )}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-2xs ${
                expandedSection === "medical-record" || expandedSection === "all"
                  ? "bg-[#1996e0] text-white"
                  : "bg-blue-50 text-[#0863c5] group-hover:bg-[#1996e0] group-hover:text-white"
              }`}>
                <span>{expandedSection === "medical-record" || expandedSection === "all" ? "Thu gọn" : "Chi tiết"}</span>
                <svg className={`size-3 transition-transform ${
                  expandedSection === "medical-record" || expandedSection === "all"
                    ? "rotate-180"
                    : "group-hover:translate-x-0.5"
                }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {expandedSection === "medical-record" || expandedSection === "all" ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </span>
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
              Thu gọn mục này
            </button>
          </div>

          {/* Banner Nhắc Nhở Lịch Hẹn Tái Khám (Nếu Có) */}
          {nextAppointmentStep && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 via-[#1996e0] to-cyan-600 text-white shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                    Lịch hẹn tái khám tiếp theo
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
              Danh sách các bước thực hiện trong phác đồ ({actualStepsCount} bước):
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
              Thu gọn mục này
            </button>
          </div>

          {allRichPrescriptions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <span className="text-2xl block mb-2">💊</span>
              <p className="text-xs font-bold text-slate-700">Chưa có đơn thuốc nào trong hồ sơ này</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Bác sĩ chưa khởi tạo hoặc chỉ định đơn thuốc trực tiếp cho phác đồ điều trị này.
              </p>
            </div>
          ) : (
            allRichPrescriptions.map((presc) => (
              <div key={presc.id} className="space-y-4">
                {/* Presc Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                  <div className="text-xs">
                    <span className="font-mono font-bold text-[#0863c5] bg-blue-100/80 px-2 py-0.5 rounded-md">
                      MÃ THAM CHIẾU: {presc.code}
                    </span>
                    <span className="ml-3 text-slate-600">Ngày bước điều trị: <strong>{presc.date}</strong></span>
                    <span className="ml-3 text-slate-600">Bác sĩ: <strong>{presc.doctor}</strong></span>
                  </div>

                </div>

                    {/* Table Danh Mục Thuốc */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50/90 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="p-3.5 w-12 text-center font-mono">#</th>
                            <th className="p-3.5 min-w-[200px]">Tên Thuốc & Hoạt Chất</th>
                            <th className="p-3.5 whitespace-nowrap">Liều Dùng</th>
                            <th className="p-3.5 min-w-[180px]">Tần Suất & Thời Gian</th>
                            <th className="p-3.5">Hướng Dẫn Uống</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {presc.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                              <td className="p-3.5 text-center font-mono font-extrabold text-slate-400">{idx + 1}</td>
                              <td className="p-3.5">
                                <strong className="text-slate-900 text-xs sm:text-sm font-bold block">{item.medicineName}</strong>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center whitespace-nowrap font-mono font-bold text-[#0863c5] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/90 shadow-2xs text-xs">
                                  {item.dosage}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-700 font-medium text-xs leading-relaxed">
                                {item.frequency} <span className="text-slate-400 font-normal">({item.duration})</span>
                              </td>
                              <td className="p-3.5 text-slate-600 text-xs leading-relaxed">
                                {item.instruction}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Ghi chú kê đơn */}
                    {presc.notes && <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>📌 Ghi chú dặn dò của bác sĩ:</strong> {presc.notes}
                    </div>}
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
              Thu gọn mục này
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
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      unoptimized
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
                        <span className="font-semibold text-cyan-400">Nhấp để phóng to</span>
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
                disabled={planMedicalRecordCount === 0}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1996e0] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-blue-500 shadow-sm shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>🖨️ In Bệnh Án PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setExpandedSection("none")}
                className="text-xs font-bold text-[#1996e0] hover:underline cursor-pointer"
              >
                Thu gọn mục này
              </button>
            </div>
          </div>

          {planMedicalRecordCount === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Chưa có bệnh án gắn với các bước của phác đồ này. Chọn một lần khám ở danh sách bên trái để xem bệnh án đã ghi.
            </p>
          ) : (
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
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#0863c5] flex items-center gap-1.5">
                  <span>💊</span> ĐƠN THUỐC ĐÃ KÊ THEO BỆNH ÁN
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {allRichPrescriptions.length === 0 && <span className="text-slate-500">Chưa có đơn thuốc được kê.</span>}
                  {allRichPrescriptions.flatMap((prescription) => prescription.items).map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-white text-slate-900 font-extrabold px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs text-xs"
                    >
                      <span className="text-[#0863c5] font-black">● {med.medicineName}</span>
                      <span className="text-slate-600 font-semibold text-[11px]">({med.dosage} • {med.frequency} • {med.duration})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-blue-200">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">Bác sĩ lập bệnh án</span>
                  <span className="text-xs font-black text-slate-900">{treatment.doctor}</span>
                </div>
              </div>
            </div>
          </div>
          )}
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
                Tổng {invoiceCount} Hóa Đơn
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
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                width={1200}
                height={900}
                unoptimized
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
                <p className="text-[11px] text-slate-600">Bản in thông tin từ hồ sơ điều trị của bệnh nhân</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold border border-slate-400 px-2.5 py-1 rounded">
                  MÃ BN: {patient?.patientCode || "Chưa cấp mã"}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Ngày lập: {treatment.date}</p>
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
                    <span className="text-slate-500">Mã bệnh nhân:</span> <strong className="text-slate-900 font-mono font-bold">{patient?.patientCode || "Chưa cấp mã"}</strong>
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
                {allRichPrescriptions.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-slate-500">Chưa có đơn thuốc được kê.</td></tr>}
                {allRichPrescriptions.flatMap((prescription) => prescription.items).map((med, idx) => (
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
              <p className="text-xs font-bold text-slate-900 pt-2">{treatment.doctor}</p>
            </div>
          </div>

        </div>,
        document.body
      )}
  </>
);
}
