"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  Phone,
  EnvelopeSimple,
  MapPin,
  Warning,
  CalendarBlank,
  Stethoscope,
  ArrowUpRight,
  SpinnerGap,
  User,
  Plus,
  Image as ImageIcon,
  Sparkle,
  FileText,
  Pill,
  X,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import { formatDate } from "@/src/lib/utils/date";
import { patientQuickLinks } from "../patient-list";
import { PatientAiBrief } from "@/src/components/doctor/patient-ai-brief";
import {
  genderLabel,
  getDoctorIdFromCookie,
} from "@/src/lib/doctor/session";
import axios from "axios";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  CHECKED_IN: { label: "Đã check-in", color: "bg-violet-100 text-violet-700" },
  IN_PROGRESS: { label: "Đang khám", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
  NO_SHOW: { label: "Không đến", color: "bg-slate-100 text-slate-600" },
};

type PatientDetail = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  dateOfBirth: string | null;
  address: string | null;
  medicalHistory: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  activeTreatmentPlan: {
    id: string;
    title: string;
    status: string;
    startDate: string | null;
    expectedEndDate: string | null;
    totalSteps: number;
    completedSteps: number;
  } | null;
  appointments: {
    id: string;
    appointmentCode: string;
    scheduledAt: string;
    status: AppointmentStatus;
    serviceName: string;
    doctorName: string;
    recordId: string | null;
  }[];
};

type XrayItem = {
  id?: string;
  url: string;
  caption?: string;
  type?: "xray" | "intraoral" | "other";
  createdAt?: string;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 shrink-0 text-brand">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default function DoctorPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [xrayAlbum, setXrayAlbum] = useState<XrayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<XrayItem | null>(null);

  const doctorId = getDoctorIdFromCookie();
  const validationError = !id || !isUuid(id)
    ? "Mã bệnh nhân không hợp lệ."
    : !doctorId
      ? "Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại."
      : null;

  useEffect(() => {
    if (!id || !isUuid(id)) {
      return;
    }
    if (!doctorId) {
      return;
    }

    Promise.all([
      apiClient.get<PatientDetail>(`/patients/${id}?doctorId=${doctorId}`),
      apiClient.get<Record<string, unknown>[]>(`/medical-records?doctorId=${doctorId}&patientId=${id}`),
    ])
      .then(([ptRes, recRes]) => {
        if (!ptRes.data) {
          setError("Không tìm thấy bệnh nhân.");
          return;
        }
        setPatient(ptRes.data);

        // Aggregate X-rays from all past medical records
        const allImages: XrayItem[] = [];
        const records = Array.isArray(recRes.data) ? recRes.data : [];
        records.forEach((rec) => {
          const imgs = (rec.images as XrayItem[]) || [];
          imgs.forEach((img) => {
            allImages.push({
              ...img,
              createdAt: (rec.scheduledAt as string) || (rec.createdAt as string),
            });
          });
        });

        setXrayAlbum(allImages);
      })
      .catch((err) => {
        const status = axios.isAxiosError(err) ? err.response?.status : null;
        if (status === 403) {
          setError("Bạn không có quyền xem bệnh nhân này.");
        } else if (status === 404) {
          setError("Không tìm thấy bệnh nhân.");
        } else {
          setError("Không thể tải thông tin bệnh nhân.");
        }
      })
      .finally(() => setLoading(false));
  }, [id, doctorId]);

  if (!validationError && loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (validationError || error || !patient) {
    return (
      <div className="p-8">
        <Link
          href="/doctor/patients"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-dark"
        >
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} className="shrink-0" />
          {validationError ?? error ?? "Không tìm thấy bệnh nhân."}
        </div>
      </div>
    );
  }

  const initials = patient.fullName
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("");
  const plan = patient.activeTreatmentPlan;
  const progressPercent =
    plan && plan.totalSteps > 0
      ? Math.round((plan.completedSteps / plan.totalSteps) * 100)
      : 0;
  const quickLinks = patientQuickLinks(patient.id);

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* 1. TOP HEADER & QUICK ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark cursor-pointer"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={quickLinks.records}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand cursor-pointer"
          >
            <FileText size={15} className="text-brand" />
            <span>Xem Bệnh Án</span>
          </Link>

          <Link
            href={quickLinks.prescription}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <Pill size={15} className="text-blue-600" />
            <span>Kê Đơn Thuốc</span>
          </Link>

          <Link
            href={quickLinks.treatmentPlan}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-dark cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>Lập Phác Đồ Mới</span>
          </Link>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* === LEFT COLUMN: PROFILE & TREATMENT PLAN === */}
        <div className="flex flex-col gap-5 xl:col-span-1">
          {/* Patient Card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                {initials || <User size={24} />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {patient.fullName}
                </h1>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {patient.patientCode}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {patient.phone && (
                <InfoRow
                  icon={<Phone size={15} />}
                  label="Số điện thoại"
                  value={patient.phone}
                />
              )}
              {patient.email && (
                <InfoRow
                  icon={<EnvelopeSimple size={15} />}
                  label="Email"
                  value={patient.email}
                />
              )}
              {(patient.dateOfBirth || patient.gender || patient.age != null) && (
                <InfoRow
                  icon={<CalendarBlank size={15} />}
                  label="Ngày sinh / Giới tính"
                  value={[
                    patient.dateOfBirth
                      ? new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")
                      : null,
                    genderLabel(patient.gender),
                    patient.age != null ? `${patient.age} tuổi` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                />
              )}
              {patient.address && (
                <InfoRow
                  icon={<MapPin size={15} />}
                  label="Địa chỉ"
                  value={patient.address}
                />
              )}
            </div>

            {patient.medicalHistory && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Warning
                    size={15}
                    className="text-amber-600"
                    weight="fill"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Tiền sử bệnh & Cảnh báo
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-amber-900">
                  {patient.medicalHistory}
                </p>
              </div>
            )}

            {(patient.emergencyContactName ||
              patient.emergencyContactPhone) && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Liên hệ khẩn cấp
                </p>
                {patient.emergencyContactName && (
                  <p className="text-sm font-medium text-slate-900">
                    {patient.emergencyContactName}
                  </p>
                )}
                {patient.emergencyContactPhone && (
                  <p className="text-xs text-muted-foreground">
                    {patient.emergencyContactPhone}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Treatment Plan Card */}
          {plan ? (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center gap-2">
                <Stethoscope
                  size={16}
                  className="text-brand"
                  weight="duotone"
                />
                <h3 className="text-sm font-semibold text-brand-dark">
                  Kế hoạch điều trị đang thực hiện
                </h3>
              </div>
              <p className="mb-1 font-bold text-slate-900 text-sm">{plan.title}</p>
              {(plan.startDate || plan.expectedEndDate) && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {plan.startDate
                    ? new Date(plan.startDate).toLocaleDateString("vi-VN")
                    : "?"}
                  {" → "}
                  {plan.expectedEndDate
                    ? new Date(plan.expectedEndDate).toLocaleDateString("vi-VN")
                    : "?"}
                </p>
              )}
              {plan.totalSteps > 0 && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Tiến độ hoàn thành</span>
                    <span className="font-mono font-bold text-brand-dark">
                      {plan.completedSteps}/{plan.totalSteps} bước ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
                <Link
                  href={`/doctor/treatment-plans/${plan.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Xem chi tiết <ArrowUpRight size={12} />
                </Link>
                <Link
                  href={`/doctor/treatment-plans/new?patientId=${patient.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-brand cursor-pointer"
                >
                  <Plus size={12} /> Lập kế hoạch mới
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white p-5 shadow-xs text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Stethoscope
                  size={20}
                  className="text-muted-foreground"
                  weight="duotone"
                />
                <h3 className="text-sm font-semibold text-brand-dark">
                  Kế hoạch điều trị
                </h3>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Bệnh nhân chưa có phác đồ điều trị đang active.
              </p>
              <Link
                href={`/doctor/treatment-plans/new?patientId=${patient.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-dark cursor-pointer shadow-2xs"
              >
                <Plus size={12} weight="bold" /> Lập kế hoạch điều trị
              </Link>
            </div>
          )}
        </div>

        {/* === RIGHT COLUMN: AI BRIEF, X-RAY ALBUM & APPOINTMENT HISTORY === */}
        <div className="space-y-5 xl:col-span-2">
          {/* AI Pre-Consultation Brief */}
          <PatientAiBrief
            key={patient.id}
            patientId={patient.id}
            patientName={patient.fullName}
            className="shadow-xs"
          />

          {/* 3. X-RAY & CLINICAL PHOTO ALBUM */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
            <div className="mb-3.5 flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" weight="duotone" />
                <h3 className="text-sm font-bold text-slate-900">
                  Album Phim X-Quang & Ảnh Nha Khoa ({xrayAlbum.length})
                </h3>
              </div>
              <Link
                href={quickLinks.records}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                <Sparkle size={13} weight="fill" /> Xem hồ sơ hình ảnh
              </Link>
            </div>

            {xrayAlbum.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có ảnh phim X-quang nào được tải lên cho bệnh nhân này.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {xrayAlbum.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(img)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-900 transition hover:border-blue-500 hover:shadow-md"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden">
                      <Image
                        src={img.url}
                        alt={img.caption || `X-ray ${idx + 1}`}
                        width={480}
                        height={360}
                        unoptimized
                        className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                      />
                    </div>
                    <div className="bg-slate-900/90 p-2 text-white">
                      <p className="truncate text-[11px] font-bold">{img.caption || `Phim X-quang #${idx + 1}`}</p>
                      {img.createdAt && (
                        <p className="font-mono text-[9px] text-slate-400">
                          {formatDate(img.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointment History */}
          <div className="rounded-2xl border border-border bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-base font-bold text-brand-dark">
                Lịch hẹn và lần khám với bạn ({patient.appointments.length})
              </h2>
              <Link
                href={`/doctor/patients/${patient.id}/records`}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-brand-dark transition-colors hover:border-brand/40 hover:text-brand cursor-pointer"
              >
                Hồ sơ bệnh án EMR <ArrowUpRight size={12} />
              </Link>
            </div>

            {patient.appointments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                <CalendarBlank
                  size={36}
                  className="text-slate-300"
                  weight="duotone"
                />
                <p className="text-sm">Chưa có lịch hẹn hoặc lần khám nào với bạn</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {patient.appointments.map((apt) => {
                  const cfg = statusConfig[apt.status] ?? statusConfig.PENDING;
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50/60"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              cfg.color,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {apt.serviceName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {new Date(apt.scheduledAt).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>BS. {apt.doctorName}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {apt.appointmentCode}
                          </span>
                        </div>
                      </div>

                      {apt.status === "COMPLETED" && apt.recordId && (
                        <Link
                          href={`/doctor/medical-records?recordId=${apt.recordId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-brand-dark transition-colors hover:border-brand/40 hover:text-brand cursor-pointer"
                        >
                          Xem hồ sơ <ArrowUpRight size={12} />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL: FULL PREVIEW IMAGE */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white">
                {previewImage.caption || "Ảnh X-quang nha khoa"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <Image
              src={previewImage.url}
              alt="Preview X-ray"
              width={1200}
              height={900}
              unoptimized
              className="max-h-[500px] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
