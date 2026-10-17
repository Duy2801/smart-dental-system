"use client";

import { useState } from "react";
import type { PatientRecordsResponse } from "../api";
import { formatShortDate } from "./recordMappers";
import { RecordClinicalImage } from "./RecordClinicalImage";

type MedicalVisit = PatientRecordsResponse["medicalRecords"][number];
type Section = "clinical" | "prescriptions" | "images" | "record";

function recordImages(value: unknown) {
  let images = value;
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(images)) return [];
  return images.flatMap((image, index) => {
    if (typeof image === "string") {
      return [
        {
          id: String(index),
          url: image,
          title: `Ảnh y khoa ${index + 1}`,
          type: "clinical" as const,
        },
      ];
    }
    if (!image || typeof image !== "object") return [];
    const item = image as Record<string, unknown>;
    const url = item.url ?? item.imageUrl ?? item.src;
    if (typeof url !== "string" || !url.trim()) return [];
    const label = `${item.type ?? ""} ${item.title ?? ""}`.toLowerCase();
    return [
      {
        id: typeof item.id === "string" ? item.id : String(index),
        url,
        title:
          typeof item.title === "string" && item.title
            ? item.title
            : `Ảnh y khoa ${index + 1}`,
        type: /x.?ray|x.?quang/.test(label)
          ? ("xray" as const)
          : ("clinical" as const),
      },
    ];
  });
}

export function RecordMedicalVisitCard({ record }: { record: MedicalVisit }) {
  const [section, setSection] = useState<Section | "all" | null>(null);
  const prescriptions = record.prescriptions ?? [];
  const medicines = prescriptions.flatMap((prescription) => prescription.items);
  const images = recordImages(record.images);
  const hasClinicalDetails = Boolean(
    record.chiefComplaint ||
      record.diagnosis ||
      record.treatmentNotes ||
      record.followUpDate,
  );

  const sections: {
    id: Section;
    icon: (className?: string) => React.ReactNode;
    label: string;
    count: string;
    hasContent: boolean;
    hint: string;
    color: string;
  }[] = [
    {
      id: "clinical",
      icon: (cls = "size-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      label: "Khám & chẩn đoán",
      count: hasClinicalDetails ? "Có dữ liệu" : "Chưa có",
      hasContent: hasClinicalDetails,
      hint: "Triệu chứng, kết luận và điều trị",
      color: "bg-sky-500",
    },
    {
      id: "prescriptions",
      icon: (cls = "size-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      ),
      label: "Đơn thuốc bác sĩ",
      count: `${prescriptions.length} đơn`,
      hasContent: prescriptions.length > 0,
      hint: "Thuốc, liều dùng và dặn dò",
      color: "bg-emerald-600",
    },
    {
      id: "images",
      icon: (cls = "size-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      label: "Phim X-quang & ảnh",
      count: `${images.length} ảnh`,
      hasContent: images.length > 0,
      hint: "Hình ảnh thực tế từ bệnh án",
      color: "bg-indigo-600",
    },
    {
      id: "record",
      icon: (cls = "size-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      label: "Hồ sơ bệnh án",
      count: "1 lần khám",
      hasContent: true,
      hint: "Thông tin bác sĩ và lần khám",
      color: "bg-blue-600",
    },
  ];

  const visible = (id: Section) => section === id || section === "all";

  return (
    <article
      className="space-y-5"
      aria-label={`Hồ sơ lần khám ${formatShortDate(record.createdAt)}`}
    >
      {/* 1. Medical Visit Diagnostic Summary Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1996e0]">
              <span className="size-2 rounded-full bg-[#1996e0]" />
              Bệnh án từ bác sĩ · {formatShortDate(record.createdAt)}
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900">
              {record.service}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Bác sĩ điều trị:</span>
              <span className="text-slate-800">{record.doctor}</span>
            </p>
          </div>
          <span className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#0863c5] shadow-2xs">
            Lần khám
          </span>
        </div>

        <h3 className="mt-5 text-xs font-black uppercase tracking-wider text-slate-500">
          Tóm tắt chẩn đoán & lần khám
        </h3>

        {/* 3 Equal-Height Balanced Diagnostic Boxes */}
        <div className="mt-3.5 grid gap-3.5 md:grid-cols-3">
          {/* Box 1: Chẩn đoán & Triệu chứng */}
          <div className="flex flex-col justify-between h-full rounded-2xl border border-blue-100/90 bg-[#f8fbfe] p-4.5 hover:border-blue-200 transition-all">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-blue-100 text-[#0863c5]">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1996e0]">
                  Chẩn đoán
                </span>
              </div>
              <h4 className="mt-2.5 text-sm font-black text-slate-900 line-clamp-2">
                {record.diagnosis || "Chưa cập nhật"}
              </h4>
            </div>
            <div className="mt-3 pt-2.5 border-t border-blue-100/70">
              <p className="text-xs font-medium text-slate-600 line-clamp-2">
                {record.chiefComplaint
                  ? `Triệu chứng: ${record.chiefComplaint}`
                  : "Chưa ghi nhận triệu chứng bất thường"}
              </p>
            </div>
          </div>

          {/* Box 2: Điều trị & Dặn dò */}
          <div className="flex flex-col justify-between h-full rounded-2xl border border-blue-100/90 bg-[#f8fbfe] p-4.5 hover:border-blue-200 transition-all">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Điều trị & dặn dò
                </span>
              </div>
              <p className="mt-2.5 text-xs font-medium leading-relaxed text-slate-700 line-clamp-3">
                {record.treatmentNotes || "Đã hoàn thành thủ thuật điều trị theo chỉ định."}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-blue-100/70">
              <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Đã thực hiện khám chuyên khoa
              </span>
            </div>
          </div>

          {/* Box 3: Theo dõi & Tái khám */}
          <div className="flex flex-col justify-between h-full rounded-2xl border border-blue-100/90 bg-[#f8fbfe] p-4.5 hover:border-blue-200 transition-all">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  Theo dõi tiếp theo
                </span>
              </div>
              <h4 className="mt-2.5 text-sm font-black text-slate-900">
                {record.followUpDate
                  ? `Tái khám: ${formatShortDate(record.followUpDate)}`
                  : "Chưa hẹn tái khám"}
              </h4>
            </div>
            <div className="mt-3 pt-2.5 border-t border-blue-100/70 flex items-center gap-2">
              <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {prescriptions.length} đơn thuốc
              </span>
              <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {images.length} hình ảnh
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Navigation Section: 4 Detail Cards */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Xem chi tiết hồ sơ khám
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn mục để xem dữ liệu tương ứng của lần khám này.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSection(section === "all" ? null : "all")}
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#0863c5] hover:bg-blue-100 transition-colors cursor-pointer"
          >
            {section === "all" ? "Thu gọn tất cả" : "Hiện tất cả mục"}
          </button>
        </div>

        {/* 4 Interactive Action Cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((item) => {
            const isSelected = visible(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-expanded={isSelected}
                onClick={() => setSection(section === item.id ? null : item.id)}
                className={`group relative flex min-h-[126px] flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[#1996e0] bg-[#f0f7ff] shadow-sm ring-2 ring-[#1996e0]/20"
                    : "border-slate-200/90 bg-white hover:border-[#1996e0]/60 hover:bg-slate-50/60 hover:shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl text-white shadow-2xs transition-transform group-hover:scale-105 ${item.color}`}
                  >
                    {item.icon("size-4.5")}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      item.hasContent
                        ? "bg-blue-100 text-[#0863c5]"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1996e0] transition-colors">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-500 leading-snug line-clamp-1">
                    {item.hint}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {visible("clinical") && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="grid size-7 place-items-center rounded-lg bg-sky-100 text-sky-700">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Khám & chẩn đoán chi tiết
            </h3>
          </div>
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Triệu chứng ban đầu</dt>
              <dd className="mt-1.5 font-semibold text-slate-800 text-sm">
                {record.chiefComplaint || "Không ghi nhận triệu chứng bất thường"}
              </dd>
            </div>
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Chẩn đoán chuyên khoa</dt>
              <dd className="mt-1.5 font-semibold text-slate-800 text-sm">
                {record.diagnosis || "Chưa cập nhật chẩn đoán"}
              </dd>
            </div>
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4 sm:col-span-2">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Ghi chú điều trị & dặn dò</dt>
              <dd className="mt-1.5 whitespace-pre-line font-medium text-slate-800 leading-relaxed text-sm">
                {record.treatmentNotes || "Đã thực hiện thủ thuật điều trị theo chỉ định chuyên khoa."}
              </dd>
            </div>
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4 sm:col-span-2">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Kế hoạch tái khám</dt>
              <dd className="mt-1.5 font-bold text-[#1996e0] text-sm">
                {record.followUpDate
                  ? `Lịch hẹn tái khám: ${formatShortDate(record.followUpDate)}`
                  : "Chưa có chỉ định tái khám"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {visible("prescriptions") && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Đơn thuốc bác sĩ chỉ định
            </h3>
          </div>
          {prescriptions.length ? (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4"
                >
                  <p className="text-xs font-bold text-emerald-800">
                    Đơn thuốc · Bác sĩ {record.doctor} · {formatShortDate(record.createdAt)}
                  </p>
                  {prescription.items.length ? (
                    <ul className="mt-3 space-y-2">
                      {prescription.items.map((item, index) => (
                        <li
                          key={`${prescription.id}-${index}`}
                          className="rounded-lg bg-white border border-emerald-100/60 p-3 text-xs text-slate-700 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 text-sm">
                              {item.medicineName}
                            </strong>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              {item.dosage}
                            </span>
                          </div>
                          <div className="mt-1 text-slate-500 text-[11px] flex gap-2">
                            {item.frequency && <span>Liều dùng: {item.frequency}</span>}
                            {item.duration && <span>· Dùng trong: {item.duration}</span>}
                          </div>
                          {item.instruction && (
                            <p className="mt-1.5 text-slate-600 bg-slate-50 p-2 rounded text-[11px]">
                              Hướng dẫn: {item.instruction}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Chưa có thuốc trong đơn này.
                    </p>
                  )}
                  {prescription.notes && (
                    <p className="mt-3 text-xs font-medium text-slate-700">
                      Dặn dò thêm: {prescription.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs font-medium text-slate-500">
              Lần khám này chưa có đơn thuốc kê thêm.
            </p>
          )}
          {medicines.length > 0 && (
            <p className="text-xs font-semibold text-slate-500">
              Tổng cộng {medicines.length} loại thuốc được chỉ định.
            </p>
          )}
        </section>
      )}

      {visible("images") && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Phim X-quang & hình ảnh y khoa
            </h3>
          </div>
          {images.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-xl border border-slate-200 hover:border-blue-300 transition-all hover:shadow-xs"
                >
                  <RecordClinicalImage
                    type={image.type}
                    title={image.title}
                    imageUrl={image.url}
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs font-medium text-slate-500">
              Lần khám này chưa đính kèm phim chụp hoặc hình ảnh lâm sàng.
            </p>
          )}
        </section>
      )}

      {visible("record") && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="grid size-7 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Hồ sơ bệnh án điện tử
            </h3>
          </div>
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Ngày khám</dt>
              <dd className="mt-1 font-extrabold text-slate-900 text-sm">
                {formatShortDate(record.createdAt)}
              </dd>
            </div>
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Bác sĩ & dịch vụ</dt>
              <dd className="mt-1 font-extrabold text-slate-900 text-sm">
                {record.doctor} · {record.service}
              </dd>
            </div>
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4 sm:col-span-2">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Kết luận</dt>
              <dd className="mt-1 font-semibold text-slate-800 text-sm">
                {record.diagnosis || "Chưa cập nhật"}
              </dd>
            </div>
            <div className="rounded-xl bg-[#f8fbfe] border border-slate-100 p-4 sm:col-span-2">
              <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Ghi chú bác sĩ</dt>
              <dd className="mt-1 whitespace-pre-line font-medium text-slate-800 leading-relaxed text-sm">
                {record.treatmentNotes || "Chưa ghi nhận thêm ghi chú."}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </article>
  );
}
