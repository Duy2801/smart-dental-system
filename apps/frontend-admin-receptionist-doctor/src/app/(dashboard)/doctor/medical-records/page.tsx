"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import {
  MagnifyingGlass,
  Warning,
  Lock,
  FloppyDisk,
  ArrowRight,
  Pill,
  CalendarBlank,
  SpinnerGap,
  CheckCircle,
  FileText,
  Check,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

type RecordSummary = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  diagnosis: string | null;
  chiefComplaint: string | null;
  serviceName: string | null;
  scheduledAt: string | null;
  followUpDate: string | null;
  prescriptionCount: number;
  createdAt: string;
};

type PrescriptionItem = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string | null;
  duration: string | null;
  instruction: string | null;
};

type Prescription = {
  id: string;
  notes: string | null;
  items: PrescriptionItem[];
  createdAt: string;
};

type RecordDetail = RecordSummary & {
  treatmentNotes: string | null;
  internalNotes: string | null;
  patientPhone: string | null;
  appointmentStatus: string | null;
  prescriptions: Prescription[];
};

type TabKey = "OVERVIEW" | "PRESCRIPTIONS";

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
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MedicalRecordsContent() {
  const searchParams = useSearchParams();
  const preSelectId = searchParams.get("recordId");

  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  // loadedDetailId tracks which record's detail is in state — derived loading:
  const [loadedDetailId, setLoadedDetailId] = useState<string | null>(null);
  const detailLoading = !!selectedId && loadedDetailId !== selectedId;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");

  // Form state
  const [form, setForm] = useState({
    chiefComplaint: "",
    diagnosis: "",
    treatmentNotes: "",
    internalNotes: "",
    followUpDate: "",
  });

  const doctorId = getUserInfo().doctorId;
  const [listLoading, setListLoading] = useState(!!doctorId);
  const [listError, setListError] = useState<string | null>(
    !doctorId ? "Không tìm thấy thông tin bác sĩ." : null,
  );

  // Load list
  useEffect(() => {
    if (!doctorId) return;
    apiClient
      .get<RecordSummary[]>(`/medical-records?doctorId=${doctorId}`)
      .then((res) => {
        setRecords(res.data);
        const firstId = preSelectId ?? res.data[0]?.id ?? null;
        if (firstId) setSelectedId(firstId);
      })
      .catch(() => setListError("Không thể tải danh sách hồ sơ bệnh án."))
      .finally(() => setListLoading(false));
  }, [doctorId, preSelectId]);

  // Load detail when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    apiClient
      .get<RecordDetail>(`/medical-records/${selectedId}`)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.data);
        setLoadedDetailId(selectedId);
        setSaved(false);
        setSaveError(null);
        setForm({
          chiefComplaint: res.data.chiefComplaint ?? "",
          diagnosis: res.data.diagnosis ?? "",
          treatmentNotes: res.data.treatmentNotes ?? "",
          internalNotes: res.data.internalNotes ?? "",
          followUpDate: res.data.followUpDate
            ? new Date(res.data.followUpDate).toISOString().split("T")[0]
            : "",
        });
        setActiveTab("OVERVIEW");
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setLoadedDetailId(selectedId);
        }
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await apiClient.patch(`/medical-records/${selectedId}`, {
        chiefComplaint: form.chiefComplaint || undefined,
        diagnosis: form.diagnosis || undefined,
        treatmentNotes: form.treatmentNotes || undefined,
        internalNotes: form.internalNotes || undefined,
        followUpDate: form.followUpDate || null,
      });
      // update local list summary
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedId
            ? {
                ...r,
                diagnosis: form.diagnosis || null,
                chiefComplaint: form.chiefComplaint || null,
                followUpDate: form.followUpDate
                  ? new Date(form.followUpDate).toISOString()
                  : null,
              }
            : r,
        ),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.patientCode.toLowerCase().includes(search.toLowerCase()) ||
      (r.diagnosis ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const initials = detail
    ? detail.patientName
        .split(" ")
        .slice(-2)
        .map((n) => n[0])
        .join("")
    : "";

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-dark">
            Hồ sơ bệnh án điện tử
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem, ghi chép và cập nhật hồ sơ bệnh án của bệnh nhân.
          </p>
        </div>

        {listError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {listError}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          {/* LEFT: Records list */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm xl:sticky xl:top-6 xl:col-span-3 xl:h-[calc(100vh-8rem)]">
            <div className="border-b border-border bg-slate-50/50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
                Danh sách hồ sơ ({records.length})
              </p>
              <div className="relative">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân, chẩn đoán..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {listLoading ? (
                <div className="flex justify-center py-10">
                  <SpinnerGap
                    size={24}
                    className="animate-spin text-brand"
                  />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Không có hồ sơ nào
                </div>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "block w-full rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
                      selectedId === r.id
                        ? "border-brand bg-brand/5 shadow-[0_0_0_1px_rgba(0,151,255,0.3)]"
                        : "border-border bg-white hover:border-slate-300 hover:shadow-sm",
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className={cn(
                          "font-bold",
                          selectedId === r.id
                            ? "text-brand-dark"
                            : "text-slate-900",
                        )}
                      >
                        {r.patientName}
                      </span>
                      {r.prescriptionCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                          <Pill size={9} /> {r.prescriptionCount}
                        </span>
                      )}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {r.patientCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(r.scheduledAt)}
                      </span>
                    </div>
                    {r.serviceName && (
                      <p className="text-xs text-slate-600">{r.serviceName}</p>
                    )}
                    {r.diagnosis && (
                      <p className="mt-1 line-clamp-1 font-mono text-[10px] text-brand-dark">
                        {r.diagnosis}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Detail panel */}
          <div className="flex flex-col gap-6 xl:col-span-9">
            {!selectedId || (!detailLoading && !detail) ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-32 shadow-sm">
                <FileText
                  size={48}
                  className="mb-4 text-slate-300"
                  weight="duotone"
                />
                <p className="text-sm text-muted-foreground">
                  Chọn một hồ sơ bệnh án để xem và chỉnh sửa
                </p>
              </div>
            ) : detailLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
                <SpinnerGap
                  size={32}
                  className="animate-spin text-brand"
                />
              </div>
            ) : detail ? (
              <>
                {/* Hero card */}
                <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-6 text-white shadow-xl">
                  <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand/30 blur-[4rem]" />
                  <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20">
                        {initials}
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-3">
                          <h2 className="text-2xl font-bold">
                            {detail.patientName}
                          </h2>
                          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                            {detail.patientCode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          {detail.patientPhone && (
                            <span className="font-mono">
                              {detail.patientPhone}
                            </span>
                          )}
                          {detail.scheduledAt && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-slate-600" />
                              <span>{formatDateTime(detail.scheduledAt)}</span>
                            </>
                          )}
                          {detail.serviceName && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-slate-600" />
                              <span>{detail.serviceName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {detail.followUpDate && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300">
                          <CalendarBlank size={12} />
                          Tái khám: {formatDate(detail.followUpDate)}
                        </div>
                      )}
                      <Link
                        href={`/doctor/patients/${detail.patientId}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Xem hồ sơ bệnh nhân <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-border px-1">
                  {(
                    [
                      { key: "OVERVIEW" as TabKey, label: "Khám & Điều trị" },
                      {
                        key: "PRESCRIPTIONS" as TabKey,
                        label: `Đơn thuốc (${detail.prescriptions.length})`,
                      },
                    ] as { key: TabKey; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all",
                        activeTab === tab.key
                          ? "border-brand text-brand"
                          : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-slate-900",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="min-h-[400px] rounded-2xl border border-border bg-white p-6 shadow-sm">
                  {activeTab === "OVERVIEW" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-slate-900">
                          Ghi chép lâm sàng
                        </h3>
                        {saved && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                            <Check size={14} weight="bold" /> Đã lưu
                          </span>
                        )}
                        {saveError && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                            <Warning size={14} /> {saveError}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Lý do khám (Chief Complaint)
                            </label>
                            <textarea
                              rows={2}
                              value={form.chiefComplaint}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  chiefComplaint: e.target.value,
                                }))
                              }
                              className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Chẩn đoán (ICD-10)
                            </label>
                            <input
                              type="text"
                              value={form.diagnosis}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  diagnosis: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-bold text-brand-dark shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              <CalendarBlank size={12} /> Ngày tái khám
                            </label>
                            <input
                              type="date"
                              value={form.followUpDate}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  followUpDate: e.target.value,
                                }))
                              }
                              className="rounded-xl border border-border bg-white px-4 py-2 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Ghi chú điều trị
                            </label>
                            <textarea
                              rows={5}
                              value={form.treatmentNotes}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  treatmentNotes: e.target.value,
                                }))
                              }
                              className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-800 shadow-inner outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              <Lock size={12} /> Ghi chú nội bộ
                            </label>
                            <textarea
                              rows={2}
                              value={form.internalNotes}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  internalNotes: e.target.value,
                                }))
                              }
                              placeholder="Chỉ bác sĩ xem được..."
                              className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm italic text-slate-700 shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
                        >
                          {saving ? (
                            <SpinnerGap
                              size={14}
                              className="animate-spin"
                            />
                          ) : saved ? (
                            <CheckCircle size={14} weight="fill" />
                          ) : (
                            <FloppyDisk size={14} />
                          )}
                          {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "PRESCRIPTIONS" && (
                    <div>
                      {detail.prescriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-500">
                            <Pill size={36} weight="duotone" />
                          </div>
                          <h3 className="mb-2 text-base font-bold text-slate-900">
                            Chưa có đơn thuốc
                          </h3>
                          <p className="max-w-sm text-sm text-muted-foreground">
                            Kê đơn thuốc cho lần khám này.
                          </p>
                          <Link
                            href={`/doctor/prescriptions/new?recordId=${detail.id}&patientId=${detail.patientId}`}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                          >
                            <Pill size={16} /> Kê đơn thuốc
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {detail.prescriptions.map((rx, i) => (
                            <div
                              key={rx.id}
                              className="rounded-xl border border-border bg-slate-50 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900">
                                  Đơn thuốc #{i + 1}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(rx.createdAt)}
                                </span>
                              </div>
                              {rx.notes && (
                                <p className="mb-3 text-xs italic text-slate-600">
                                  {rx.notes}
                                </p>
                              )}
                              <div className="divide-y divide-border/50 rounded-lg border border-border bg-white overflow-hidden">
                                {rx.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3 text-sm"
                                  >
                                    <span className="font-semibold text-slate-900">
                                      {item.medicineName}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {item.dosage}
                                    </span>
                                    {item.frequency && (
                                      <span className="text-muted-foreground">
                                        {item.frequency}
                                      </span>
                                    )}
                                    {item.duration && (
                                      <span className="text-muted-foreground">
                                        × {item.duration}
                                      </span>
                                    )}
                                    {item.instruction && (
                                      <span className="w-full text-xs italic text-slate-500">
                                        {item.instruction}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MedicalRecordsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    }>
      <MedicalRecordsContent />
    </Suspense>
  );
}
