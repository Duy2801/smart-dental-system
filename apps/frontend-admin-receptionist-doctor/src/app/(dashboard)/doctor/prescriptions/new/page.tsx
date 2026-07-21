"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash,
  SpinnerGap,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type Patient = {
  id: string;
  patientCode: string;
  fullName: string;
};

type RecordSummary = {
  id: string;
  patientId: string;
  patientName: string;
  diagnosis: string | null;
  scheduledAt: string | null;
};

type MedItem = {
  key: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
};

function getUserInfo(): { doctorId: string | null } {
  if (typeof document === "undefined") return { doctorId: null };
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return { doctorId: null };
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return { doctorId: null };
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function NewPrescriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initPatientId = searchParams.get("patientId") ?? "";
  const initRecordId = searchParams.get("recordId") ?? "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initPatientId);
  const [selectedRecordId, setSelectedRecordId] = useState(initRecordId);
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<MedItem[]>([
    { key: 1, medicineName: "", dosage: "", frequency: "", duration: "", instruction: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const doctorId = getUserInfo().doctorId;

  // Load patients
  useEffect(() => {
    if (!doctorId) return;
    apiClient
      .get<Patient[]>(`/patients?doctorId=${doctorId}`)
      .then((res) => setPatients(res.data))
      .catch(() => {});
  }, [doctorId]);

  // Load medical records when patient changes
  useEffect(() => {
    if (!doctorId || !selectedPatientId) {
      setRecords([]);
      setSelectedRecordId("");
      return;
    }
    apiClient
      .get<RecordSummary[]>(`/medical-records?doctorId=${doctorId}`)
      .then((res) => {
        const filtered = res.data.filter(
          (r) => r.patientId === selectedPatientId,
        );
        setRecords(filtered);
        setSelectedRecordId(filtered[0]?.id ?? "");
      })
      .catch(() => {});
  }, [doctorId, selectedPatientId]);

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      { key: Date.now(), medicineName: "", dosage: "", frequency: "", duration: "", instruction: "" },
    ]);
  };

  const removeMedication = (key: number) => {
    if (medications.length > 1) {
      setMedications((prev) => prev.filter((m) => m.key !== key));
    }
  };

  const updateMed = (key: number, field: keyof Omit<MedItem, "key">, value: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)),
    );
  };

  const handleSubmit = async () => {
    if (!selectedPatientId || !selectedRecordId) {
      setError("Vui lòng chọn bệnh nhân và hồ sơ bệnh án.");
      return;
    }
    const validItems = medications.filter((m) => m.medicineName.trim());
    if (validItems.length === 0) {
      setError("Vui lòng thêm ít nhất một loại thuốc.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/prescriptions?doctorId=${doctorId}`, {
        patientId: selectedPatientId,
        medicalRecordId: selectedRecordId,
        notes: notes.trim() || undefined,
        items: validItems.map((m) => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim() || undefined,
          duration: m.duration.trim() || undefined,
          instruction: m.instruction.trim() || undefined,
        })),
      });
      setSuccess(true);
      setTimeout(() => router.push("/doctor/prescriptions"), 1500);
    } catch {
      setError("Tạo đơn thuốc thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 space-y-4">
          <Link
            href="/doctor/prescriptions"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">
                Kê đơn thuốc mới
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tạo và lưu đơn thuốc điện tử cho bệnh nhân.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || success}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <SpinnerGap size={15} className="animate-spin" />
                ) : success ? (
                  <CheckCircle size={15} weight="fill" />
                ) : (
                  <Plus size={15} weight="bold" />
                )}
                {success ? "Đã lưu!" : submitting ? "Đang lưu..." : "Lưu đơn thuốc"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* 1. Thông tin */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-brand-dark">
              1. Thông tin bệnh nhân
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">
                  Bệnh nhân <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} — {p.patientCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">
                  Hồ sơ bệnh án liên quan <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  disabled={!selectedPatientId || records.length === 0}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50"
                >
                  {records.length === 0 ? (
                    <option value="">
                      {selectedPatientId
                        ? "Không có hồ sơ"
                        : "-- Chọn bệnh nhân trước --"}
                    </option>
                  ) : (
                    records.map((r) => (
                      <option key={r.id} value={r.id}>
                        {formatDate(r.scheduledAt)}{r.diagnosis ? ` — ${r.diagnosis}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-brand-dark">
                  Ghi chú đơn thuốc
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lời dặn thêm cho bệnh nhân..."
                  className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* 2. Danh sách thuốc */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-slate-50/30 px-6 py-4">
              <h2 className="text-base font-semibold text-brand-dark">
                2. Danh sách thuốc
              </h2>
            </div>

            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-8 pb-3 pr-2 text-center">#</th>
                    <th className="pb-3 pr-3">
                      Tên thuốc <span className="text-red-500">*</span>
                    </th>
                    <th className="w-28 pb-3 pr-3">Liều dùng</th>
                    <th className="w-32 pb-3 pr-3">Tần suất</th>
                    <th className="w-28 pb-3 pr-3">Thời gian</th>
                    <th className="pb-3 pr-3">Hướng dẫn</th>
                    <th className="w-10 pb-3 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {medications.map((med, index) => (
                    <tr
                      key={med.key}
                      className="group transition-colors hover:bg-slate-50/50"
                    >
                      <td className="py-2.5 pr-2 text-center text-xs font-medium text-muted-foreground/70">
                        {index + 1}
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={med.medicineName}
                          onChange={(e) =>
                            updateMed(med.key, "medicineName", e.target.value)
                          }
                          placeholder="Paracetamol 500mg"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) =>
                            updateMed(med.key, "dosage", e.target.value)
                          }
                          placeholder="500mg"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) =>
                            updateMed(med.key, "frequency", e.target.value)
                          }
                          placeholder="3 lần/ngày"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) =>
                            updateMed(med.key, "duration", e.target.value)
                          }
                          placeholder="5 ngày"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={med.instruction}
                          onChange={(e) =>
                            updateMed(med.key, "instruction", e.target.value)
                          }
                          placeholder="Uống sau ăn"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => removeMedication(med.key)}
                          disabled={medications.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground opacity-30 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-0 active:scale-95"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 border-t border-border/50 pt-4">
                <button
                  onClick={addMedication}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
                >
                  <Plus size={15} weight="bold" />
                  Thêm thuốc
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    }>
      <NewPrescriptionContent />
    </Suspense>
  );
}
