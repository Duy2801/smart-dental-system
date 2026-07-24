"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { AppointmentStatusBadge } from "@/src/components/shared/appointment-status-badge";
import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";
import apiClient from "@/src/lib/api/client";
import {
  ArrowLeft,
  Phone,
  EnvelopeSimple,
  MapPin,
  Warning,
  WarningCircle,
  CalendarBlank,
  CalendarPlus,
  PencilSimple,
  Check,
  SpinnerGap,
  User,
} from "@phosphor-icons/react";

type PatientDetail = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: "MALE" | "FEMALE" | string | null;
  age: number | null;
  dateOfBirth: string | null;
  address: string | null;
  medicalHistory: string | null;
  allergies?: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  appointments: {
    id: string;
    appointmentCode: string;
    scheduledAt: string;
    status: AppointmentStatus;
    serviceName: string;
    doctorName: string;
  }[];
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

function PatientDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get("tab") === "edit");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    medicalHistory: "",
    allergies: "",
  });

  useEffect(() => {
    apiClient
      .get(`/patients/${id}`)
      .then((res) => {
        const data = res.data as PatientDetail;
        if (!data?.id) throw new Error("not found");
        setPatient(data);
        setDraft({
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          medicalHistory: data.medicalHistory ?? "",
          allergies: (data.allergies ?? []).join(", "),
        });
      })
      .catch(() => setPatient(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    const next = {
      ...patient,
      fullName: draft.fullName.trim() || patient.fullName,
      phone: draft.phone.trim() || patient.phone,
      email: draft.email.trim() || null,
      address: draft.address.trim() || null,
      medicalHistory: draft.medicalHistory.trim() || null,
      allergies: draft.allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      await apiClient.patch(`/patients/${patient.id}`, {
        fullName: next.fullName,
        phone: next.phone,
        email: next.email,
        address: next.address,
        medicalHistory: next.medicalHistory,
      });
      setPatient(next);
      setEditing(false);
    } catch {
      // keep editing open
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Chi tiết bệnh nhân" />
        <div className="flex h-64 items-center justify-center bg-muted">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <Header title="Chi tiết bệnh nhân" />
        <div className="bg-muted min-h-screen p-6">
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            Không tìm thấy bệnh nhân.
          </div>
        </div>
      </>
    );
  }

  const initials = patient.fullName
    .split(/\s+/)
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <Header
        title="Chi tiết bệnh nhân"
        description={patient.patientCode || patient.id}
      >
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
              >
                <PencilSimple size={15} /> Sửa
              </button>
              <Link
                href={`/receptionist/appointments/new?patientId=${patient.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
              >
                <CalendarPlus size={15} weight="bold" /> Tạo lịch hẹn
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-muted"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
              >
                {saving ? (
                  <SpinnerGap size={15} className="animate-spin" />
                ) : (
                  <Check size={15} weight="bold" />
                )}
                Lưu
              </button>
            </>
          )}
        </div>
      </Header>

      <div className="bg-muted min-h-screen p-6 space-y-5">
        <Link
          href="/receptionist/patients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1 space-y-4">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                  {initials || <User size={24} />}
                </div>
                <div className="min-w-0">
                  {editing ? (
                    <input
                      value={draft.fullName}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, fullName: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-muted px-3 py-1.5 text-lg font-bold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  ) : (
                    <h1 className="text-lg font-bold text-slate-900 truncate">
                      {patient.fullName}
                    </h1>
                  )}
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {patient.patientCode}
                  </span>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  {(
                    [
                      ["phone", "SĐT"],
                      ["email", "Email"],
                      ["address", "Địa chỉ"],
                      ["allergies", "Dị ứng"],
                      ["medicalHistory", "Tiền sử"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        {label}
                      </label>
                      {key === "medicalHistory" ? (
                        <textarea
                          rows={2}
                          value={draft[key]}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [key]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                      ) : (
                        <input
                          value={draft[key]}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [key]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
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
                  {patient.dateOfBirth && (
                    <InfoRow
                      icon={<CalendarBlank size={15} />}
                      label="Ngày sinh"
                      value={`${new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")}${
                        patient.gender
                          ? ` • ${patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : patient.gender}`
                          : ""
                      }${patient.age ? ` (${patient.age} tuổi)` : ""}`}
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
              )}

              {!editing && (patient.allergies?.length ?? 0) > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {patient.allergies!.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 ring-1 ring-inset ring-red-600/20"
                    >
                      <WarningCircle size={10} weight="fill" />
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {!editing && patient.medicalHistory && (
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

              {!editing &&
                (patient.emergencyContactName ||
                  patient.emergencyContactPhone) && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Liên hệ khẩn cấp
                    </p>
                    {patient.emergencyContactName && (
                      <p className="text-sm font-medium text-slate-900">
                        {patient.emergencyContactName}
                      </p>
                    )}
                    {patient.emergencyContactPhone && (
                      <p className="text-sm text-muted-foreground font-mono">
                        {patient.emergencyContactPhone}
                      </p>
                    )}
                  </div>
                )}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-bold text-brand-dark">Lịch sử khám</h2>
                <span className="text-xs text-muted-foreground">
                  {patient.appointments.length} lượt
                </span>
              </div>

              {patient.appointments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <CalendarBlank size={36} className="text-slate-300" />
                  <p className="text-sm">Chưa có lịch khám</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {patient.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/60 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <AppointmentStatusBadge status={apt.status} />
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {apt.appointmentCode}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {apt.serviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(apt.scheduledAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}BS. {apt.doctorName}
                        </p>
                      </div>
                      <Link
                        href={`/receptionist/appointments/${apt.id}`}
                        className={cn(
                          "shrink-0 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm",
                          "hover:border-brand hover:text-brand transition-colors",
                        )}
                      >
                        Chi tiết
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReceptionistPatientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      }
    >
      <PatientDetailContent />
    </Suspense>
  );
}
