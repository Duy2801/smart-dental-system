"use client";

import { useMemo, useState } from "react";
import type { PatientRecordsResponse } from "../api";

interface PatientMedicalRecordSectionProps {
  recordsData: PatientRecordsResponse;
  onSwitchToTreatmentPlan?: () => void;
}

export function PatientMedicalRecordSection({
  recordsData,
  onSwitchToTreatmentPlan,
}: PatientMedicalRecordSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [previewImage, setPreviewImage] = useState<{
    id: string;
    title: string;
    category: string;
    date: string;
    doctor: string;
    url: string;
    notes: string;
  } | null>(null);

  const { patient, medicalRecords, treatmentPlans } = recordsData;

  // 1. Trích xuất toàn bộ ảnh y khoa thật từ các bước điều trị của bệnh nhân
  const realClinicalImages = useMemo(() => {
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

    // 1. Lấy từ medicalRecords top-level
    if (medicalRecords && Array.isArray(medicalRecords)) {
      medicalRecords.forEach((record: any, rIdx: number) => {
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
              record.doctor || "Bác sĩ điều trị",
              record.diagnosis
            );
          });
        }
      });
    }

    // 2. Lấy từ các phác đồ điều trị và từng bước
    if (treatmentPlans && Array.isArray(treatmentPlans)) {
      treatmentPlans.forEach((plan: any) => {
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
                      plan.doctor?.name || "Bác sĩ điều trị",
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

    return list;
  }, [medicalRecords, treatmentPlans]);

  // 2. Tổng hợp nhật ký chẩn đoán thật từ backend medicalRecords & treatmentPlans
  const realClinicalNotes = useMemo(() => {
    const notes: Array<{
      id: string;
      date: string;
      doctor: string;
      department: string;
      diagnosis: string;
      notes: string;
      status: string;
      prescriptions?: Array<{
        medicineName: string;
        dosage: string;
        frequency: string | null;
        instruction: string | null;
      }>;
    }> = [];

    // Lấy từ danh sách medicalRecords chung của bệnh nhân
    medicalRecords.forEach((rec) => {
      notes.push({
        id: rec.id,
        date: rec.createdAt
          ? new Date(rec.createdAt).toLocaleDateString("vi-VN")
          : "—",
        doctor: rec.doctor || "Bác sĩ điều trị",
        department: rec.service || "Khám nha khoa",
        diagnosis: rec.diagnosis || "Theo dõi tình trạng răng miệng",
        notes: rec.treatmentNotes || "Đã ghi nhận kết quả khám lâm sàng.",
        status: "Đã hoàn thành khám",
      });
    });

    // Lấy thêm từ các bước điều trị có medicalRecord
    treatmentPlans.forEach((plan) => {
      plan.steps.forEach((step) => {
        step.medicalRecords.forEach((rec) => {
          if (!notes.some((n) => n.id === rec.id)) {
            const rxItems = rec.prescriptions.flatMap((p) => p.items);
            notes.push({
              id: rec.id,
              date: step.completedAt
                ? new Date(step.completedAt).toLocaleDateString("vi-VN")
                : step.expectedDate
                ? new Date(step.expectedDate).toLocaleDateString("vi-VN")
                : "—",
              doctor: plan.doctor.name,
              specialty: plan.doctor.specialty,
              department: plan.title,
              diagnosis:
                rec.diagnosis || rec.chiefComplaint || `Thực hiện bước: ${step.title}`,
              notes: rec.treatmentNotes || `Hoàn thành thủ thuật: ${step.title}`,
              status:
                step.status === "COMPLETED"
                  ? "Đã hoàn thành thủ thuật"
                  : "Đang tiến hành",
              prescriptions: rxItems.length > 0 ? rxItems : undefined,
            } as any);
          }
        });
      });
    });

    return notes;
  }, [medicalRecords, treatmentPlans]);

  // Bộ lọc thể loại ảnh
  const categories = ["Tất cả", "Phim X-Quang", "Ảnh Chụp Trong Miệng", "Ảnh Chụp Ngoài Mặt"];

  const filteredPhotos =
    selectedCategory === "Tất cả"
      ? realClinicalImages
      : realClinicalImages.filter((p) => p.category === selectedCategory);

  const genderLabel =
    patient.gender === "MALE"
      ? "Nam"
      : patient.gender === "FEMALE"
      ? "Nữ"
      : patient.gender === "OTHER"
      ? "Khác"
      : "Chưa cập nhật";

  const primaryDoctor = treatmentPlans[0]?.doctor?.name || "Bác sĩ nha khoa phụ trách";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Thẻ Tổng Quan Hồ Sơ Thật Của Bệnh Nhân */}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold border border-blue-400/30">
                MÃ HỒ SƠ: {patient.patientCode || "HS-BN"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                ● Hồ sơ y tế cá nhân
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Hồ Sơ Bệnh Án: {patient.fullName}
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              Dữ liệu hồ sơ y tế chính thức được truy xuất trực tiếp từ hệ thống phòng khám Nha khoa Smart Dental.
            </p>

            {onSwitchToTreatmentPlan && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSwitchToTreatmentPlan}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-white/20"
                >
                  <span>📋</span>
                  <span>Cuộn xuống xem Phác Đồ & Phương Pháp Điều Trị</span>
                  <span>↓</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 block font-medium">Họ & Tên bệnh nhân:</span>
              <strong className="text-xs font-bold text-white block mt-0.5 truncate">
                {patient.fullName}
              </strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 block font-medium">Bác sĩ phụ trách:</span>
              <strong className="text-xs font-bold text-white block mt-0.5 truncate">
                {primaryDoctor}
              </strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-blue-200 block font-medium">Giới tính / Tuổi:</span>
              <strong className="text-xs font-bold text-blue-300 block mt-0.5">
                {genderLabel} {patient.age ? `• ${patient.age} tuổi` : ""}
              </strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-3">
              <span className="text-[10px] text-blue-200 block font-medium">Tiền sử y khoa & Dị ứng:</span>
              <strong className="text-xs font-bold text-emerald-300 block mt-0.5 line-clamp-1">
                {patient.medicalHistory || "Không ghi nhận dị ứng hoặc tiền sử đặc biệt"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Thư viện Phim X-Quang & Hình Ảnh Y Khoa Thật */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0058bc]">
              Dữ liệu chẩn đoán hình ảnh
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Phim X-Quang & Hình Ảnh Lâm Sàng ({filteredPhotos.length})
            </h3>
          </div>

          {/* Filter Category */}
          {realClinicalImages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#0863c5] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid ảnh thật */}
        {filteredPhotos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setPreviewImage(photo)}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white border border-white/20">
                    {photo.category}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      🔍 Bấm để xem phóng to
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {photo.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {photo.notes}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2">
                    <span>{photo.doctor}</span>
                    <span>{photo.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-2">
            <div className="text-2xl">📸</div>
            <h4 className="text-sm font-bold text-slate-700">Chưa có dữ liệu phim X-quang hoặc hình ảnh lâm sàng</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hình ảnh chụp phim X-quang Panorex, CBCT và ảnh trong miệng của bệnh nhân <strong className="text-slate-700">{patient.fullName}</strong> sẽ tự động xuất hiện tại đây khi bác sĩ tiến hành chụp trong đợt khám trực tiếp.
            </p>
          </div>
        )}
      </div>

      {/* Lịch Sử Chẩn Đoán & Khám Lâm Sàng Thật Của Bác Sĩ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0058bc]">
            Nhật ký bệnh án từ cơ sở dữ liệu
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            Lịch Sử Chẩn Đoán Y Khoa Của {patient.fullName} ({realClinicalNotes.length})
          </h3>
        </div>

        {realClinicalNotes.length > 0 ? (
          <div className="space-y-3">
            {realClinicalNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{note.doctor}</span>
                    <span className="text-xs text-slate-500">({note.department})</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    🗓️ Ngày ghi nhận: {note.date}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                      Chẩn đoán y khoa:
                    </span>
                    <p className="font-bold text-slate-800 mt-0.5">{note.diagnosis}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                      Trạng thái đợt khám:
                    </span>
                    <p className="font-bold text-emerald-700 mt-0.5">✓ {note.status}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block text-[11px]">
                    📝 Ghi chú & Lời dặn của bác sĩ:
                  </span>
                  <p className="leading-relaxed">{note.notes}</p>
                </div>

                {note.prescriptions && note.prescriptions.length > 0 && (
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs space-y-1">
                    <span className="font-bold text-blue-900 block text-[11px]">
                      💊 Đơn thuốc đính kèm:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-800 font-medium">
                      {note.prescriptions.map((rx, idx) => (
                        <li key={idx}>
                          {rx.medicineName} ({rx.dosage}) - {rx.frequency || "Theo liều dặn"}. {rx.instruction ? `HDSD: ${rx.instruction}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-2">
            <div className="text-2xl">📋</div>
            <h4 className="text-sm font-bold text-slate-700">Chưa có nhật ký chẩn đoán lâm sàng</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thông tin chẩn đoán y khoa của bác sĩ cho bệnh nhân <strong className="text-slate-700">{patient.fullName}</strong> sẽ được cập nhật tự động tại đây sau mỗi đợt khám và làm thủ thuật.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
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
    </div>
  );
}
