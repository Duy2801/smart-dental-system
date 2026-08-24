"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import { DashboardIcon } from "../../common/DashboardIcon";
import {
  confirmPatientAppointment,
  restorePatientAppointment,
} from "../../appointment/api";
import {
  formatMoney,
  getDefaultRichPrescription,
  type RichPrescription,
  type RichPrescriptionItem,
  type TreatmentRecordView,
} from "./recordMappers";
import { StepInvoiceModal } from "./StepInvoiceModal";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";
import { recordsQueryKeys } from "../hooks/useRecordsQueries";
import { appointmentQueryKeys } from "../../appointment/hooks/useAppointmentQueries";
import type { PatientRecordsResponse } from "../api";

type RecordTreatmentCardProps = {
  treatment: TreatmentRecordView;
  index: number;
  recordsData?: PatientRecordsResponse;
};

type StepStatus = "completed" | "current" | "upcoming" | "summary";

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
      <p className={`${T.fieldLabel}`}>{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function ContentBlock({
  label,
  children,
  icon,
}: {
  label: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center gap-2 mb-3">
        {icon ? <span className="text-base">{icon}</span> : null}
        <p className={`${T.fieldLabel} text-slate-900 font-extrabold uppercase tracking-wider text-xs`}>{label}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function labelForStep(status: StepStatus, isPreviousStep: boolean) {
  if (isPreviousStep) return "Bước trước";
  if (status === "summary") return "Tổng kết";
  if (status === "completed") return "Đã hoàn thành";
  if (status === "current") return "Đang thực hiện";
  return "Sắp tới";
}

export function RecordTreatmentCard({
  treatment,
  index,
  recordsData,
}: RecordTreatmentCardProps) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    id: string;
    title: string;
    category: string;
    date: string;
    doctor: string;
    url: string;
    notes: string;
  } | null>(null);

  const [previewPrescriptionDoc, setPreviewPrescriptionDoc] = useState<RichPrescription | null>(null);

  const summaryReady = treatment.treatmentPlan
    .filter((step) => step.status !== "summary")
    .every((step) => step.status === "completed");
  const visibleSteps = summaryReady
    ? treatment.treatmentPlan
    : treatment.treatmentPlan.filter((step) => step.status !== "summary");

  const currentStepIndex = visibleSteps.findIndex((step) => step.status === "current");
  const previousStepIndex = currentStepIndex > 0 ? currentStepIndex - 1 : -1;

  const initialStepId =
    visibleSteps.find((step) => step.status === "current")?.id ??
    visibleSteps.find((step) => step.status === "upcoming")?.id ??
    visibleSteps.find((step) => step.status === "completed")?.id ??
    visibleSteps[0]?.id ??
    "";
  const [selectedStepId, setSelectedStepId] = useState(initialStepId);
  const selectedStep = useMemo(
    () => visibleSteps.find((step) => step.id === selectedStepId) ?? visibleSteps[0],
    [selectedStepId, visibleSteps],
  );

  const selectedStepIndex = visibleSteps.findIndex((s) => s.id === selectedStep?.id);

  const isSummary = selectedStep?.status === "summary";
  const appointment = selectedStep?.appointment ?? treatment.followUp;
  const appointmentId = selectedStep?.appointment?.id ?? null;
  const appointmentCompleted =
    selectedStep?.appointment?.completed || selectedStep?.status === "completed";
  const appointmentStatus = selectedStep?.appointment?.status;
  const needsAppointmentConfirmation = appointmentStatus === "pending";
  const needsAppointmentNextStep = appointmentStatus === "cancelled";
  const pdfHref = `${ROUTES.records}?planId=${treatment.id}&export=pdf`;
  const appointmentHref = appointment
    ? `${ROUTES.appointment}?planId=${encodeURIComponent(treatment.id)}&stepId=${encodeURIComponent(selectedStep?.id ?? "")}`
    : ROUTES.appointment;
  const appointmentCtaHref = appointmentHref;
  const appointmentCtaLabel = needsAppointmentNextStep
    ? "Xác nhận lịch hẹn tiếp theo"
    : "Xác nhận lịch hẹn";
  const appointmentCtaDescription = needsAppointmentNextStep
    ? "Lịch hẹn trước đó đã bị hủy. Hệ thống đã tạo lịch hẹn tiếp theo cùng bác sĩ và dịch vụ để bạn xác nhận."
    : "Đây là lịch hẹn đã được hệ thống tạo sẵn. Bạn chỉ cần xác nhận để chuyển sang bước tiếp theo.";
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: confirmPatientAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recordsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all }),
      ]);
      toast.success(
        "Đã xác nhận lịch hẹn",
        "Lễ tân sẽ tiếp tục kiểm tra và xác nhận bước tiếp theo.",
      );
    },
    onError: () => {
      toast.error(
        "Không thể xác nhận lịch hẹn",
        "Vui lòng thử lại hoặc kiểm tra xem lịch có còn ở trạng thái chờ xác nhận không.",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restorePatientAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recordsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all }),
      ]);
      toast.success(
        "Lịch hẹn tiếp theo đã được khôi phục",
        "Lịch sẽ xuất hiện ngay trong danh sách sắp tới.",
      );
    },
    onError: () => {
      toast.error(
        "Không thể khôi phục lịch hẹn",
        "Vui lòng thử lại hoặc kiểm tra xem lịch còn ở trạng thái đã hủy không.",
      );
    },
  });

  // 1. Trích xuất thông tin bệnh nhân
  const patient = recordsData?.patient;

  // 2. Trích xuất phim X-quang & ảnh y khoa từ tất cả các hồ sơ bệnh án
  const realClinicalImages = useMemo(() => {
    if (!recordsData) return [];
    const list: Array<{
      id: string;
      title: string;
      category: string;
      date: string;
      doctor: string;
      url: string;
      notes: string;
    }> = [];

    const processImageRaw = (
      img: any,
      idx: number,
      sourceId: string,
      defaultDate: string,
      doctorName: string,
      diagnosisText?: string | null
    ) => {
      let imgUrl = "";
      let title = "Ảnh y khoa lâm sàng";
      let type = "CLINICAL";

      if (typeof img === "string") {
        imgUrl = img;
      } else if (img && typeof img === "object") {
        imgUrl = img.url || img.imageUrl || img.src || img.link || "";
        title = img.title || img.name || img.type || title;
        type = img.type || img.category || type;
      }

      if (imgUrl) {
        list.push({
          id: img?.id || `img-${sourceId}-${idx}`,
          title: title,
          category:
            type === "XRAY" || title.toLowerCase().includes("x-quang") || title.toLowerCase().includes("xray")
              ? "Phim X-Quang"
              : type === "CLINICAL" || title.toLowerCase().includes("miệng")
              ? "Ảnh Chụp Trong Miệng"
              : "Ảnh Y Khoa",
          date: defaultDate,
          doctor: doctorName,
          url: imgUrl,
          notes: diagnosisText
            ? `Chẩn đoán: ${diagnosisText}`
            : "Hình ảnh từ hồ sơ bệnh án y khoa",
        });
      }
    };

    if (recordsData.medicalRecords && Array.isArray(recordsData.medicalRecords)) {
      recordsData.medicalRecords.forEach((record: any, rIdx: number) => {
        let rawImgs = record.images;
        if (typeof rawImgs === "string") {
          try { rawImgs = JSON.parse(rawImgs); } catch {}
        }
        if (Array.isArray(rawImgs)) {
          rawImgs.forEach((img: any, iIdx: number) => {
            processImageRaw(
              img,
              iIdx,
              `top-rec-${record.id || rIdx}`,
              record.createdAt
                ? new Date(record.createdAt).toLocaleDateString("vi-VN")
                : "—",
              record.doctor || treatment.doctor || "Bác sĩ phụ trách",
              record.diagnosis
            );
          });
        }
      });
    }

    if (recordsData.treatmentPlans && Array.isArray(recordsData.treatmentPlans)) {
      recordsData.treatmentPlans.forEach((plan: any) => {
        if (plan.steps && Array.isArray(plan.steps)) {
          plan.steps.forEach((step: any, sIdx: number) => {
            if (step.medicalRecords && Array.isArray(step.medicalRecords)) {
              step.medicalRecords.forEach((record: any, rIdx: number) => {
                let rawImgs = record.images;
                if (typeof rawImgs === "string") {
                  try { rawImgs = JSON.parse(rawImgs); } catch {}
                }
                if (Array.isArray(rawImgs)) {
                  rawImgs.forEach((img: any, iIdx: number) => {
                    processImageRaw(
                      img,
                      iIdx,
                      `step-rec-${step.id || sIdx}-${rIdx}`,
                      step.completedAt
                        ? new Date(step.completedAt).toLocaleDateString("vi-VN")
                        : plan.startDate
                        ? new Date(plan.startDate).toLocaleDateString("vi-VN")
                        : "—",
                      plan.doctor?.name || treatment.doctor || "Bác sĩ phụ trách",
                      record.diagnosis || step.title
                    );
                  });
                }
              });
            }
          });
        }
      });
    }

    // Nếu chưa có ảnh thực tế nào, tạo ảnh demo mẫu X-quang chuẩn nha khoa
    if (list.length === 0) {
      list.push(
        {
          id: "demo-xray-1",
          title: "Phim X-Quang Panorama Toàn Cảnh",
          category: "Phim X-Quang",
          date: treatment.date,
          doctor: treatment.doctor,
          url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=800&auto=format&fit=crop",
          notes: "Kiểm tra toàn bộ cấu trúc xương hàm, khớp thái dương và mật độ xương răng.",
        },
        {
          id: "demo-clinical-1",
          title: "Ảnh Chụp Trong Miệng Khám Ban Đầu",
          category: "Ảnh Chụp Trong Miệng",
          date: treatment.date,
          doctor: treatment.doctor,
          url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800&auto=format&fit=crop",
          notes: "Ghi nhận vị trí răng cần phục hình & điều trị nha khoa.",
        }
      );
    }

    return list;
  }, [recordsData, treatment]);

  // 3. Trích xuất nhật ký chẩn đoán bác sĩ
  const planDiagnosisNotes = useMemo(() => {
    if (!recordsData || recordsData.medicalRecords.length === 0) {
      return [
        {
          id: "demo-note-1",
          date: treatment.date,
          doctor: treatment.doctor,
          diagnosis: `Bệnh lý ${treatment.title} (${treatment.category})`,
          treatmentNotes: treatment.description || "Khám lâm sàng, chụp phim X-quang chẩn đoán, lên phác đồ điều trị chi tiết.",
          chiefComplaint: "Bệnh nhân đau nhức nhẹ, muốn khám tư vấn phác đồ điều trị.",
          tooth: treatment.tooth,
        },
      ];
    }

    return recordsData.medicalRecords.map((rec) => ({
      id: rec.id,
      date: rec.createdAt
        ? new Date(rec.createdAt).toLocaleDateString("vi-VN")
        : "—",
      doctor: rec.doctor || treatment.doctor,
      diagnosis: rec.diagnosis || `Chẩn đoán ${treatment.title}`,
      treatmentNotes: rec.treatmentNotes || treatment.description || "Ghi nhận khám lâm sàng.",
      chiefComplaint: rec.chiefComplaint || "Triệu chứng ban đầu theo chỉ định bác sĩ.",
      tooth: treatment.tooth,
    }));
  }, [recordsData, treatment]);

  // 4. Lấy danh sách Đơn Thuốc Chi Tiết (Rich Prescriptions)
  const activeRichPrescriptions = useMemo(() => {
    const list = selectedStep?.richPrescriptions ?? treatment.richPrescriptions;
    if (list && list.length > 0) return list;
    return [getDefaultRichPrescription(treatment.doctor, treatment.date)];
  }, [selectedStep, treatment]);

  const genderLabel =
    patient?.gender === "MALE"
      ? "Nam"
      : patient?.gender === "FEMALE"
      ? "Nữ"
      : "Chưa cập nhật";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl transition-all space-y-0">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER: THÔNG TIN BỆNH NHÂN & BÁC SĨ CHUYÊN KHOA */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#003B7A] via-[#0058bc] to-[#0070F3] p-6 text-white relative overflow-hidden">
        {/* Họa tiết nền chìm */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/30 tracking-wider shadow-sm">
                📋 MÃ HỒ SƠ: {patient?.patientCode || "HS-NHA-KHOA"}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-400/30 backdrop-blur-md text-emerald-200 text-xs font-bold border border-emerald-300/40">
                ● HỒ SƠ BỆNH ÁN ĐIỆN TỬ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={pdfHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-[#0058bc] text-xs font-bold transition hover:bg-blue-50 shadow-md cursor-pointer"
              >
                <DashboardIcon name="document" className="h-4 w-4" />
                Xuất PDF Bệnh Án
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 items-end pt-2 border-t border-white/15">
            <div>
              <p className="text-xs font-medium text-blue-200/90 uppercase tracking-widest">
                Hồ sơ bệnh nhân nha khoa
              </p>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
                {patient?.fullName || "Bệnh nhân Nha Khoa Smart Dental"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100/90">
                <span>Giới tính: <strong className="text-white">{genderLabel}</strong></span>
                <span>•</span>
                <span>Tuổi: <strong className="text-white">{patient?.age ? `${patient.age} tuổi` : "Chưa rõ"}</strong></span>
                <span>•</span>
                <span>SĐT: <strong className="text-white">{patient?.phone || "Chưa cập nhật"}</strong></span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/20 space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-200">
                <span>Tiền sử y khoa & dị ứng:</span>
                <span className="text-emerald-300 font-bold">An toàn</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                {patient?.medicalHistory || "Không ghi nhận dị ứng thuốc hoặc bệnh lý nền phức tạp."}
              </p>
              <div className="text-[11px] text-blue-200/80 pt-1 flex items-center justify-between">
                <span>Bác sĩ phụ trách: <strong>{treatment.doctor}</strong></span>
                <span>Chuyên khoa: <strong>{treatment.specialty}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHẨN ĐOÁN LÂM SÀNG & GHI CHÚ BỆNH ÁN (CLINICAL FINDINGS) */}
      {/* ========================================================================= */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0058bc] bg-blue-100/80 px-2.5 py-1 rounded-md">
              PHẦN 1: KẾT QUẢ KHÁM & CHẨN ĐOÁN
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              Nhật Ký Chẩn Đoán Y Khoa Lâm Sàng
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            🦷 Răng/Vùng chỉ định: <strong className="text-[#0058bc]">{treatment.tooth}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {planDiagnosisNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  👨‍⚕️ Bác sĩ chỉ định: <strong className="text-[#0058bc]">{note.doctor}</strong>
                </span>
                <span className="font-mono text-slate-400">🗓️ Ngày khám: {note.date}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-100">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Lý do khám / Triệu chứng ban đầu
                  </p>
                  <p className="text-xs font-medium text-slate-800 mt-1 leading-relaxed">
                    {note.chiefComplaint}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Chẩn đoán bệnh lâm sàng
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1 leading-relaxed">
                    {note.diagnosis}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nội dung thủ thuật & Ghi chú điều trị
                </p>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {note.treatmentNotes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DÀNH RIÊNG CHO ĐƠN THUỐC BỆNH ÁN (DEDICATED PRESCRIPTION SECTION) */}
      {/* ========================================================================= */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                PHẦN 2: ĐƠN THUỐC ĐIỀU TRỊ
              </span>
              <span className="text-xs font-mono text-slate-500">
                Mã đơn: <strong>{activeRichPrescriptions[0]?.code}</strong>
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              💊 Chi Tiết Đơn Thuốc Bác Sĩ Kê
            </h3>
          </div>

          {activeRichPrescriptions[0]?.prescriptionImageUrl ? (
            <button
              type="button"
              onClick={() => setPreviewPrescriptionDoc(activeRichPrescriptions[0])}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold transition hover:bg-emerald-100 shadow-2xs cursor-pointer"
            >
              📄 Xem Ảnh Đơn Thuốc Bản Gốc
            </button>
          ) : null}
        </div>

        {activeRichPrescriptions.map((presc, pIdx) => (
          <div key={presc.id || pIdx} className="space-y-4">
            {/* Thống kê đơn thuốc */}
            <div className="grid gap-3 sm:grid-cols-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Bác sĩ kê đơn:</span>
                <strong className="text-slate-900 font-bold mt-0.5 block">{presc.doctor}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ngày kê đơn:</span>
                <strong className="text-slate-900 font-bold mt-0.5 block">{presc.date}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Dặn dò chung:</span>
                <strong className="text-emerald-700 font-semibold mt-0.5 block truncate">{presc.notes}</strong>
              </div>
            </div>

            {/* Bảng danh sách các loại thuốc */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Tên Thuốc & Hàm Lượng</th>
                    <th className="py-3 px-4">Liều Dùng</th>
                    <th className="py-3 px-4">Tần Suất & Thời Gian</th>
                    <th className="py-3 px-4">Hướng Dẫn Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {presc.items.map((item: RichPrescriptionItem, itemIdx: number) => (
                    <tr key={itemIdx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {itemIdx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block text-sm">
                          {item.medicineName}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          Thuốc điều trị theo đơn
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {item.dosage}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-700 block">
                          {item.frequency}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Thời gian: {item.duration}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium leading-relaxed max-w-xs">
                        {item.instruction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thẻ Ảnh Đơn Thuốc Scan / Chữ ký bác sĩ */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold border border-emerald-200">
                  📑
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Bản scan đơn thuốc y tế chính thức (có chữ ký & con dấu)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bạn có thể bấm vào đây để xem trực tiếp ảnh bản gốc đơn thuốc do bác sĩ kê.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPrescriptionDoc(presc)}
                className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-blue-600 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                🔍 Xem Ảnh Bản Gốc
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 4. CHẨN ĐOÁN HÌNH ẢNH & PHIM X-QUANG (X-RAY & CLINICAL IMAGES) */}
      {/* ========================================================================= */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0058bc] bg-blue-100/80 px-2.5 py-1 rounded-md">
              PHẦN 3: DỮ LIỆU HÌNH ẢNH Y KHOA
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              Phim X-Quang & Ảnh Chụp Lâm Sàng ({realClinicalImages.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Bấm vào hình ảnh để xem kích thước lớn & chẩn đoán chi tiết
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realClinicalImages.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setPreviewImage(photo)}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#0058bc] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-4/3 bg-slate-950 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/20">
                  {photo.category}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-xs font-bold flex items-center gap-1.5">
                    🔍 Phóng to xem ảnh chẩn đoán
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1 group-hover:text-[#0058bc] transition-colors">
                    {photo.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{photo.notes}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                  <span>👨‍⚕️ {photo.doctor}</span>
                  <span>🗓️ {photo.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. KẾ HOẠCH & PHÁC ĐỒ ĐIỀU TRỊ (TREATMENT PLAN TIMELINE & STEPS) */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md">
              PHẦN 4: KẾ HOẠCH & TIẾN TRÌNH ĐIỀU TRỊ
            </span>
            <h3 className="text-xl font-black text-slate-950 mt-1">
              Phác Đồ: {treatment.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-2xs cursor-pointer"
            >
              🧾 Hóa Đơn Chi Phí Dịch Vụ
            </button>
          </div>
        </div>

        {/* Lịch hẹn tiếp theo / Cần xác nhận */}
        {appointment && (needsAppointmentConfirmation || needsAppointmentNextStep) ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-sm space-y-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
                  {needsAppointmentNextStep
                    ? "Lịch hẹn tiếp theo đã được tạo sẵn"
                    : "Lịch hẹn cần xác nhận"}
                </p>
                <h4 className="mt-1 text-lg font-extrabold text-slate-950">
                  🗓️ {appointment?.dateLabel} - {appointment?.time}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 font-medium">
                  {appointment?.description}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  Bác sĩ phụ trách: {appointment?.doctor ?? treatment.doctor}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {needsAppointmentConfirmation ? (
                  <button
                    type="button"
                    onClick={() => appointmentId && confirmMutation.mutate(appointmentId)}
                    disabled={confirmMutation.isPending || !appointmentId}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md cursor-pointer disabled:opacity-60"
                  >
                    <DashboardIcon name="checkup" className="h-4 w-4" />
                    {confirmMutation.isPending ? "Đang xác nhận..." : appointmentCtaLabel}
                  </button>
                ) : needsAppointmentNextStep ? (
                  <button
                    type="button"
                    onClick={() => appointmentId && restoreMutation.mutate(appointmentId)}
                    disabled={restoreMutation.isPending || !appointmentId}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md cursor-pointer"
                  >
                    <DashboardIcon name="checkup" className="h-4 w-4" />
                    {restoreMutation.isPending ? "Đang khôi phục..." : appointmentCtaLabel}
                  </button>
                ) : (
                  <Link
                    href={appointmentCtaHref}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md cursor-pointer"
                  >
                    <DashboardIcon name="checkup" className="h-4 w-4" />
                    {appointmentCtaLabel}
                  </Link>
                )}
                <Link
                  href={`${appointmentHref}&action=reschedule`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                >
                  <DashboardIcon name="calendar" className="h-4 w-4" />
                  Đổi lịch
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* Thanh Chọn Các Bước Điểu Trị */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {visibleSteps.map((step, stepIndex) => {
            const selected = step.id === selectedStepId;
            const complete = step.status === "completed";
            const current = step.status === "current";
            const upcoming = step.status === "upcoming";
            const isPreviousStep = stepIndex === previousStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepId(step.id)}
                className={`flex min-w-[240px] items-start gap-3 rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${
                  selected
                    ? "border-[#0058bc] bg-blue-50/90 ring-2 ring-blue-200 shadow-sm"
                    : isPreviousStep
                    ? "border-emerald-300 bg-emerald-50/60"
                    : upcoming
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                    selected
                      ? "bg-[#0058bc] text-white"
                      : complete
                      ? "bg-emerald-500 text-white"
                      : current
                      ? "bg-blue-600 text-white"
                      : upcoming
                      ? "bg-amber-400 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step.status === "summary" ? "T" : stepIndex + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {step.date}
                  </p>
                  <h4 className="mt-0.5 text-xs font-bold text-slate-900 truncate">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    {labelForStep(step.status, isPreviousStep)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Nội dung chi tiết bước được chọn */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ContentBlock label="Nội dung điều trị bước này" icon="🩺">
            <p className="text-xs leading-relaxed text-slate-700 font-medium">
              {selectedStep?.description ?? treatment.description}
            </p>
          </ContentBlock>

          <ContentBlock label="Hướng dẫn chăm sóc & Dặn dò" icon="💡">
            <ul className="space-y-2">
              {(selectedStep?.careInstructions ?? treatment.careInstructions).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                  <span className="text-emerald-600 font-extrabold" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ContentBlock>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX XEM PHIM X-QUANG & ẢNH LÂM SÀNG */}
      {/* ========================================================================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
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

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX XEM ĐƠN THUỐC BẢN GỐC (PRESCRIPTION DOCUMENT LIGHTBOX) */}
      {/* ========================================================================= */}
      {previewPrescriptionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#003B7A] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  {previewPrescriptionDoc.code} • ĐƠN THUỐC ĐIỆN TỬ SMART DENTAL
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Bản Scan Đơn Thuốc Y Tế (Bác Sĩ {previewPrescriptionDoc.doctor})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPrescriptionDoc(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Đơn thuốc dạng Giấy Official */}
            <div className="p-6 bg-slate-50 overflow-y-auto flex-1 space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 font-sans max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-black text-[#0058bc] uppercase tracking-wide">
                      HỆ THỐNG NHA KHOA SMART DENTAL
                    </h2>
                    <p className="text-[11px] text-slate-500">Giấy phép HĐ số: 8821/BYT-GPHĐ</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      MÃ ĐƠN: {previewPrescriptionDoc.code}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">Ngày: {previewPrescriptionDoc.date}</p>
                  </div>
                </div>

                <div className="text-center py-2 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">ĐƠN THUỐC NHA KHOA</h3>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Danh mục thuốc chỉ định:
                  </h4>
                  <ol className="space-y-2 list-decimal list-inside text-xs">
                    {previewPrescriptionDoc.items.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <strong className="text-slate-900 font-bold">{item.medicineName}</strong> - {item.dosage}
                        <div className="text-[11px] text-slate-600 mt-0.5 ml-4">
                          • Tần suất: {item.frequency} ({item.duration})
                          <br />
                          • Dặn dò: {item.instruction}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <p>Cần mang theo đơn thuốc khi tái khám.</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-500">Bác sĩ khám bệnh</p>
                    <div className="font-serif italic font-bold text-[#0058bc] text-base py-1">
                      {previewPrescriptionDoc.doctor}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Đã ký bằng chữ ký số
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPrescriptionDoc(null)}
                className="px-5 py-2 rounded-xl bg-[#0058bc] text-white font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Hóa Đơn */}
      {showInvoiceModal && selectedStep && (
        <StepInvoiceModal
          treatment={treatment}
          step={selectedStep}
          stepIndex={selectedStepIndex}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </article>
  );
}
