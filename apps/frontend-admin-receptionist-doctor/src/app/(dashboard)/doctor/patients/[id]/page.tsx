"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type AppointmentStatus =
  | "PENDING" | "CONFIRMED" | "CHECKED_IN"
  | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
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

function getUserInfo(): { doctorId: string | null } {
  if (typeof document === "undefined") return { doctorId: null };
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=").slice(1).join("=");
  if (!raw) return { doctorId: null };
  try { return JSON.parse(decodeURIComponent(raw)); }
  catch { return { doctorId: null }; }
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 shrink-0 text-brand">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function DoctorPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doctorId = getUserInfo().doctorId;

  useEffect(() => {
    const url = doctorId
      ? `/patients/${id}?doctorId=${doctorId}`
      : `/patients/${id}`;
    apiClient
      .get<PatientDetail>(url)
      .then((res) => setPatient(res.data))
      .catch(() => setError("Không thể tải thông tin bệnh nhân."))
      .finally(() => setLoading(false));
  }, [id, doctorId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8">
        <Link href="/doctor/patients" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-dark">
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} className="shrink-0" />
          {error ?? "Không tìm thấy bệnh nhân."}
        </div>
      </div>
    );
  }

  const initials = patient.fullName.split(" ").slice(-2).map((n) => n[0]).join("");
  const plan = patient.activeTreatmentPlan;
  const progressPercent = plan && plan.totalSteps > 0
    ? Math.round((plan.completedSteps / plan.totalSteps) * 100)
    : 0;

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/doctor/patients"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: Patient info */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          {/* Info card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                {initials || <User size={24} />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{patient.fullName}</h1>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {patient.patientCode}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {patient.phone && (
                <InfoRow icon={<Phone size={15} />} label="Số điện thoại" value={patient.phone} />
              )}
              {patient.email && (
                <InfoRow icon={<EnvelopeSimple size={15} />} label="Email" value={patient.email} />
              )}
              {patient.dateOfBirth && (
                <InfoRow
                  icon={<CalendarBlank size={15} />}
                  label="Ngày sinh"
                  value={`${new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")}${patient.gender ? ` • ${patient.gender}` : ""}${patient.age ? ` (${patient.age} tuổi)` : ""}`}
                />
              )}
              {patient.address && (
                <InfoRow icon={<MapPin size={15} />} label="Địa chỉ" value={patient.address} />
              )}
            </div>

            {patient.medicalHistory && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Warning size={15} className="text-amber-600" weight="fill" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Tiền sử bệnh
                  </span>
                </div>
                <p className="text-sm text-amber-900">{patient.medicalHistory}</p>
              </div>
            )}

            {(patient.emergencyContactName || patient.emergencyContactPhone) && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Liên hệ khẩn cấp
                </p>
                {patient.emergencyContactName && (
                  <p className="text-sm font-medium text-slate-900">{patient.emergencyContactName}</p>
                )}
                {patient.emergencyContactPhone && (
                  <p className="text-sm text-muted-foreground">{patient.emergencyContactPhone}</p>
                )}
              </div>
            )}
          </div>

          {/* Active treatment plan */}
          {plan && (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Stethoscope size={16} className="text-brand" weight="duotone" />
                <h3 className="text-sm font-semibold text-brand-dark">
                  Kế hoạch điều trị đang active
                </h3>
              </div>
              <p className="mb-1 font-semibold text-slate-900">{plan.title}</p>
              {(plan.startDate || plan.expectedEndDate) && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {plan.startDate ? new Date(plan.startDate).toLocaleDateString("vi-VN") : "?"}
                  {" → "}
                  {plan.expectedEndDate ? new Date(plan.expectedEndDate).toLocaleDateString("vi-VN") : "?"}
                </p>
              )}
              {plan.totalSteps > 0 && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-semibold text-brand-dark">
                      {plan.completedSteps}/{plan.totalSteps} bước ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              <Link
                href={`/doctor/treatment-plans/${plan.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
              >
                Xem kế hoạch chi tiết <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Right: Appointment history */}
          <div className="xl:col-span-2">
          <div className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-base font-semibold text-brand-dark">Lịch sử khám bệnh</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{patient.appointments.length} lượt</span>
                <Link
                  href={`/doctor/patients/${patient.id}/records`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand/40 hover:text-brand"
                >
                  Hồ sơ bệnh án <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            {patient.appointments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                <CalendarBlank size={36} className="text-slate-300" weight="duotone" />
                <p className="text-sm">Chưa có lịch sử khám nào</p>
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
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900">{apt.serviceName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(apt.scheduledAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          <span>•</span>
                          <span>BS. {apt.doctorName}</span>
                          <span>•</span>
                          <span className="font-mono">{apt.appointmentCode}</span>
                        </div>
                      </div>

                      {apt.status === "COMPLETED" && apt.recordId && (
                        <Link
                          href={`/doctor/medical-records?recordId=${apt.recordId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand/40 hover:text-brand"
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
    </div>
  );
}
