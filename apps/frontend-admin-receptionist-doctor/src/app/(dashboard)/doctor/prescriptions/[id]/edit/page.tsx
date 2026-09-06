"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FloppyDisk,
  Plus,
  Trash,
  SpinnerGap,
  Warning,
  CheckCircle,
  Pill,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import {
  PrescriptionSafetyReview,
  usePrescriptionSafetyReview,
} from "@/src/components/doctor/prescription-safety-review";

type PrescriptionItem = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string | null;
  duration: string | null;
  instruction: string | null;
};

type PrescriptionDetail = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  medicalRecordId: string;
  diagnosis: string | null;
  scheduledAt: string | null;
  notes: string | null;
  items: PrescriptionItem[];
  createdAt: string;
};

type MedItem = {
  key: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "Chưa có";
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function EditPrescriptionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<MedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const safetyReview = usePrescriptionSafetyReview({
    patientId: prescription?.patientId,
    medicalRecordId: prescription?.medicalRecordId,
    items: medications,
  });

  // Tải thông tin đơn thuốc
  useEffect(() => {
    if (!id) return;
    apiClient
      .get<PrescriptionDetail>(`/prescriptions/${id}`)
      .then((res) => {
        const rx = res.data;
        setPrescription(rx);
        setNotes(rx.notes ?? "");
        setMedications(
          rx.items.map((item, i) => ({
            key: i + 1,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency ?? "",
            duration: item.duration ?? "",
            instruction: item.instruction ?? "",
          })),
        );
      })
      .catch(() => setFetchError("Không thể tải thông tin đơn thuốc."))
      .finally(() => setLoading(false));
  }, [id]);

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        key: Date.now(),
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instruction: "",
      },
    ]);
  };

  const removeMedication = (key: number) => {
    if (medications.length > 1) {
      setMedications((prev) => prev.filter((m) => m.key !== key));
    }
  };

  const updateMed = (
    key: number,
    field: keyof Omit<MedItem, "key">,
    value: string,
  ) => {
    setMedications((prev) =>
      prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)),
    );
  };

  const handleSubmit = async () => {
    const activeMeds = medications.filter(
      (m) =>
        m.medicineName.trim() ||
        m.dosage.trim() ||
        m.frequency.trim() ||
        m.duration.trim() ||
        m.instruction.trim(),
    );
    if (activeMeds.length === 0) {
      setSaveError("Vui lòng thêm ít nhất một loại thuốc.");
      return;
    }
    const incomplete = activeMeds.find(
      (m) => !m.medicineName.trim() || !m.dosage.trim(),
    );
    if (incomplete) {
      setSaveError("Mỗi thuốc cần có đầy đủ tên thuốc và liều dùng.");
      return;
    }
    const filled = activeMeds;
    setSaveError(null);
    if (!(await safetyReview.ensureReadyToSave())) {
      document
        .getElementById("prescription-safety-review")
        ?.scrollIntoView({ block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.patch(`/prescriptions/${id}`, {
        notes: notes.trim() || undefined,
        items: filled.map((m) => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim() || undefined,
          duration: m.duration.trim() || undefined,
          instruction: m.instruction.trim() || undefined,
        })),
      });
      setSuccess(true);
      setTimeout(() => {
        if (prescription?.medicalRecordId) {
          router.push(`/doctor/medical-records?recordId=${prescription.medicalRecordId}`);
        } else {
          router.push("/doctor/prescriptions");
        }
      }, 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Lưu đơn thuốc thất bại. Vui lòng thử lại.";
      setSaveError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  // Error tải
  if (fetchError || !prescription) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} className="shrink-0" />
          {fetchError ?? "Không tìm thấy đơn thuốc."}
        </div>
        <Link
          href="/doctor/prescriptions"
          className="mt-4 inline-flex items-center gap-2 text-sm text-brand hover:underline"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb + tiêu đề */}
        <div className="mb-6 space-y-4">
          <Link
            href={
              prescription.medicalRecordId
                ? `/doctor/medical-records?recordId=${prescription.medicalRecordId}`
                : "/doctor/prescriptions"
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            {prescription.medicalRecordId ? "Quay lại bệnh án" : "Quay lại danh sách"}
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">
                Sửa đơn thuốc
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cập nhật thông tin đơn thuốc đã kê.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || safetyReview.loading || success}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <SpinnerGap size={15} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={15} weight="fill" />
              ) : (
                <FloppyDisk size={15} weight="bold" />
              )}
              {success
                ? "Đã lưu!"
                : submitting
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {saveError}
          </div>
        )}

        <div className="mb-6">
          <PrescriptionSafetyReview
            controller={safetyReview}
            disabled={submitting || success}
          />
        </div>

        <div className="space-y-6">
          {/* 1. Thông tin bệnh nhân (chỉ đọc) */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
              <Pill size={16} weight="duotone" className="text-brand" />
              Thông tin đơn thuốc
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bệnh nhân
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {prescription.patientName}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mã bệnh nhân
                </p>
                <p className="mt-1 font-mono font-semibold text-slate-900">
                  {prescription.patientCode}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Chẩn đoán
                </p>
                <p className="mt-1 text-slate-700">
                  {prescription.diagnosis ?? "Chưa ghi nhận"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ngày kê
                </p>
                <p className="mt-1 text-slate-700">
                  {formatDate(
                    prescription.scheduledAt ?? prescription.createdAt,
                  )}
                </p>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Ghi chú / Lời dặn
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

          {/* 2. Danh sách thuốc */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-slate-50/30 px-6 py-4">
              <h2 className="text-base font-semibold text-brand-dark">
                Danh sách thuốc
              </h2>
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                {medications.filter((m) => m.medicineName.trim()).length} thuốc
              </span>
            </div>

            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-187.5 text-left text-sm">
                <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-8 pb-3 pr-2 text-center">#</th>
                    <th className="pb-3 pr-3">
                      Tên thuốc <span className="text-red-500">*</span>
                    </th>
                    <th className="w-28 pb-3 pr-3">
                      Liều dùng <span className="text-red-500">*</span>
                    </th>
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
                          type="button"
                          onClick={() => removeMedication(med.key)}
                          disabled={medications.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground opacity-30 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-0 active:scale-95 cursor-pointer"
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
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-dark cursor-pointer"
                >
                  <Plus size={15} weight="bold" />
                  Thêm thuốc
                </button>
              </div>
            </div>
          </div>

          {/* Footer action */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-4 shadow-sm">
            <Link
              href="/doctor/prescriptions"
              className="text-sm text-muted-foreground hover:text-brand cursor-pointer"
            >
              Hủy thay đổi
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || safetyReview.loading || success}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <SpinnerGap size={15} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={15} weight="fill" />
              ) : (
                <FloppyDisk size={15} weight="bold" />
              )}
              {success
                ? "Đã lưu!"
                : submitting
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
