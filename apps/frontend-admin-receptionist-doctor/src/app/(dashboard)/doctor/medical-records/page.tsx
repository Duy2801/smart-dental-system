"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
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
  Plus,
  PencilSimple,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";
import { getDoctorIdFromCookie } from "@/src/lib/doctor/session";
import { localDateStr } from "@/src/lib/receptionist/mappers";
import {
  DentalChartEditor,
  type DentalChartData,
  type ToothStatus,
} from "./_components/DentalChartEditor";
import {
  MedicalRecordImages,
  type RecordImage,
} from "./_components/MedicalRecordImages";

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
  images: RecordImage[];
  dentalChart: DentalChartData;
};

type TabKey = "OVERVIEW" | "CHART" | "IMAGES" | "PRESCRIPTIONS";

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function MedicalRecordsContent() {
  const searchParams = useSearchParams();
  const preSelectId = searchParams.get("recordId");

  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [loadedDetailId, setLoadedDetailId] = useState<string | null>(null);
  const detailLoading = !!selectedId && loadedDetailId !== selectedId;
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");

  const [form, setForm] = useState({
    diagnosis: "",
    treatmentNotes: "",
    internalNotes: "",
    followUpDate: "",
    images: [] as RecordImage[],
    dentalChart: { teeth: [] } as DentalChartData,
  });

  const doctorId = getDoctorIdFromCookie();
  const today = localDateStr();
  // Khởi tạo trung tính để tránh hydration mismatch (cookie chỉ có trên client)
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const applyDetail = useCallback((data: RecordDetail, id: string) => {
    setDetail(data);
    setLoadedDetailId(id);
    setDetailError(null);
    setSaved(false);
    setSaveError(null);
    setForm({
      diagnosis: data.diagnosis ?? "",
      treatmentNotes: data.treatmentNotes ?? "",
      internalNotes: data.internalNotes ?? "",
      followUpDate: data.followUpDate
        ? localDateStr(new Date(data.followUpDate))
        : "",
      images: Array.isArray(data.images) ? data.images : [],
      dentalChart: {
        teeth: Array.isArray(data.dentalChart?.teeth)
          ? data.dentalChart.teeth.map((t) => ({
              number: t.number,
              status: t.status as ToothStatus,
            }))
          : [],
      },
    });
    setRecords((prev) => {
      if (prev.some((r) => r.id === data.id)) return prev;
      return [
        {
          id: data.id,
          patientId: data.patientId,
          patientName: data.patientName,
          patientCode: data.patientCode,
          diagnosis: data.diagnosis,
          chiefComplaint: data.chiefComplaint,
          serviceName: data.serviceName,
          scheduledAt: data.scheduledAt,
          followUpDate: data.followUpDate,
          prescriptionCount: data.prescriptionCount,
          createdAt: data.createdAt,
        },
        ...prev,
      ];
    });
  }, []);

  const loadDetail = useCallback(
    async (id: string, opts?: { keepTab?: boolean }) => {
      try {
        const res = await apiClient.get<RecordDetail>(`/medical-records/${id}`);
        applyDetail(res.data, id);
        if (!opts?.keepTab) setActiveTab("OVERVIEW");
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : null;
        setDetail(null);
        setLoadedDetailId(id);
        if (status === 403) {
          setDetailError("Bạn không có quyền xem hồ sơ này.");
        } else if (status === 404) {
          setDetailError("Không tìm thấy hồ sơ bệnh án.");
        } else {
          setDetailError("Không thể tải chi tiết hồ sơ.");
        }
      }
    },
    [applyDetail],
  );

  useEffect(() => {
    if (!doctorId) {
      setListError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setListLoading(false);
      return;
    }
    if (preSelectId && !isUuid(preSelectId)) {
      setListError("Mã hồ sơ không hợp lệ.");
      setListLoading(false);
      return;
    }
    apiClient
      .get<RecordSummary[]>(`/medical-records?doctorId=${doctorId}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setRecords(list);
        const firstId = preSelectId ?? list[0]?.id ?? null;
        if (firstId) setSelectedId(firstId);
      })
      .catch(() => setListError("Không thể tải danh sách hồ sơ bệnh án."))
      .finally(() => setListLoading(false));
  }, [doctorId, preSelectId]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Reload đơn thuốc khi quay lại tab
  useEffect(() => {
    if (activeTab !== "PRESCRIPTIONS" || !selectedId) return;
    void loadDetail(selectedId, { keepTab: true });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!selectedId) return;

    if (form.followUpDate && form.followUpDate < today) {
      setSaveError("Ngày tái khám không được trước hôm nay.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await apiClient.patch<RecordDetail>(
        `/medical-records/${selectedId}`,
        {
          diagnosis: form.diagnosis.trim() || null,
          treatmentNotes: form.treatmentNotes.trim() || null,
          internalNotes: form.internalNotes.trim() || null,
          followUpDate: form.followUpDate || null,
          images: form.images,
          dentalChart: form.dentalChart,
        },
      );
      applyDetail(res.data, selectedId);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedId
            ? {
                ...r,
                diagnosis: res.data.diagnosis,
                chiefComplaint: res.data.chiefComplaint,
                followUpDate: res.data.followUpDate,
                prescriptionCount: res.data.prescriptionCount,
              }
            : r,
        ),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      setSaveError(
        status === 403
          ? "Bạn không có quyền sửa hồ sơ này."
          : status === 404
            ? "Không tìm thấy hồ sơ. F5 tải lại danh sách rồi chọn lại."
            : "Lưu thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.patientCode.toLowerCase().includes(q) ||
        (r.diagnosis ?? "").toLowerCase().includes(q),
    );
  }, [records, search]);

  const initials = detail
    ? detail.patientName
        .split(" ")
        .slice(-2)
        .map((n) => n[0])
        .join("")
    : "";

  const prescribeHref = detail
    ? `/doctor/prescriptions/new?recordId=${detail.id}&patientId=${detail.patientId}`
    : "#";

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
                  type="search"
                  placeholder="Tìm tên BN, mã BN, chẩn đoán..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {listLoading ? (
                <div className="flex justify-center py-10">
                  <SpinnerGap size={24} className="animate-spin text-brand" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Không có hồ sơ nào
                </div>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "block w-full rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
                      selectedId === r.id
                        ? "border-brand bg-brand/5 shadow-[0_0_0_1px_rgba(0,151,255,0.3)]"
                        : "border-border bg-white hover:border-slate-300 hover:shadow-sm",
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate font-bold",
                          selectedId === r.id
                            ? "text-brand-dark"
                            : "text-slate-900",
                        )}
                      >
                        {r.patientName}
                      </span>
                      {r.prescriptionCount > 0 && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
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
                      <p className="truncate text-xs text-slate-600">
                        {r.serviceName}
                      </p>
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

          <div className="flex flex-col gap-6 xl:col-span-9">
            {detailError && selectedId && !detailLoading && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                <Warning size={18} className="shrink-0" />
                {detailError}
              </div>
            )}

            {!selectedId || (!detailLoading && !detail && !detailError) ? (
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
                <SpinnerGap size={32} className="animate-spin text-brand" />
              </div>
            ) : detail ? (
              <>
                <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-6 text-white shadow-xl">
                  <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand/30 blur-[4rem]" />
                  <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20">
                        {initials}
                      </div>
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-3">
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

                    <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
                      {detail.followUpDate && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300">
                          <CalendarBlank size={12} />
                          Tái khám: {formatDate(detail.followUpDate)}
                        </div>
                      )}
                      <Link
                        href={`/doctor/patients/${detail.patientId}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white"
                      >
                        Xem hồ sơ bệnh nhân <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-b border-border px-1">
                  {(
                    [
                      { key: "OVERVIEW" as TabKey, label: "Tổng quan" },
                      { key: "CHART" as TabKey, label: "Sơ đồ răng" },
                      {
                        key: "IMAGES" as TabKey,
                        label: `Ảnh (${form.images.length})`,
                      },
                      {
                        key: "PRESCRIPTIONS" as TabKey,
                        label: `Đơn thuốc (${detail.prescriptions.length})`,
                      },
                    ] as { key: TabKey; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
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
                              Lý do khám (chỉ đọc)
                            </label>
                            <textarea
                              rows={2}
                              readOnly
                              value={detail.chiefComplaint ?? ""}
                              placeholder="Chưa có lý do khám"
                              className="w-full resize-none rounded-xl border border-border bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Chẩn đoán
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
                              placeholder="Nhập chẩn đoán..."
                              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-bold text-brand-dark shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              <CalendarBlank size={12} /> Ngày tái khám
                            </label>
                            <input
                              type="date"
                              min={today}
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
                              placeholder="Chi tiết điều trị đã thực hiện..."
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
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
                        >
                          {saving ? (
                            <SpinnerGap size={14} className="animate-spin" />
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

                  {activeTab === "CHART" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-slate-900">
                          Sơ đồ răng (FDI)
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
                      <DentalChartEditor
                        value={form.dentalChart}
                        onChange={(dentalChart) =>
                          setForm((f) => ({ ...f, dentalChart }))
                        }
                      />
                      <div className="flex justify-end border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
                        >
                          {saving ? (
                            <SpinnerGap size={14} className="animate-spin" />
                          ) : (
                            <FloppyDisk size={14} />
                          )}
                          {saving ? "Đang lưu..." : "Lưu sơ đồ răng"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "IMAGES" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-slate-900">
                          Ảnh X-quang / nội khoa
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
                      <MedicalRecordImages
                        recordId={selectedId}
                        value={form.images}
                        onChange={(images) =>
                          setForm((f) => ({ ...f, images }))
                        }
                      />
                      <div className="flex justify-end border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
                        >
                          {saving ? (
                            <SpinnerGap size={14} className="animate-spin" />
                          ) : (
                            <FloppyDisk size={14} />
                          )}
                          {saving ? "Đang lưu..." : "Lưu ảnh"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "PRESCRIPTIONS" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Đơn thuốc của hồ sơ này
                        </h3>
                        <Link
                          href={prescribeHref}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                        >
                          <Plus size={12} weight="bold" /> Kê đơn thuốc
                        </Link>
                      </div>

                      {detail.prescriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-500">
                            <Pill size={36} weight="duotone" />
                          </div>
                          <h3 className="mb-2 text-base font-bold text-slate-900">
                            Chưa có đơn thuốc
                          </h3>
                          <p className="max-w-sm text-sm text-muted-foreground">
                            Kê đơn thuốc cho lần khám này.
                          </p>
                        </div>
                      ) : (
                        detail.prescriptions.map((rx, i) => (
                          <div
                            key={rx.id}
                            className="rounded-xl border border-border bg-slate-50 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-900">
                                Đơn thuốc #{i + 1}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(rx.createdAt)}
                                </span>
                                <Link
                                  href={`/doctor/prescriptions/${rx.id}/edit`}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
                                >
                                  <PencilSimple size={12} /> Sửa
                                </Link>
                              </div>
                            </div>
                            {rx.notes && (
                              <p className="mb-3 text-xs italic text-slate-600">
                                {rx.notes}
                              </p>
                            )}
                            <div className="overflow-hidden divide-y divide-border/50 rounded-lg border border-border bg-white">
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
                        ))
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
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      }
    >
      <MedicalRecordsContent />
    </Suspense>
  );
}
