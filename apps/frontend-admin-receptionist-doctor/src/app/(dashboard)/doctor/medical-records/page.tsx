"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  ClockCounterClockwise,
  Copy,
  Printer,
  X,
  Phone,
  Clock,
  Sparkle,
  IdentificationCard,
  User,
  Tooth,
  ShieldCheck,
  Image as ImageIcon,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";
import { getDoctorIdFromCookie } from "@/src/lib/doctor/session";
import { localDateStr } from "@/src/lib/receptionist/mappers";
import { useAppDialog } from "@/src/providers/app-dialog-provider";
import {
  DentalChartEditor,
  type DentalChartData,
  type ToothStatus,
} from "./_components/DentalChartEditor";
import { applyXrayFindingsToDentalChart } from "./_components/xray-dental-chart-mapper";
import {
  MedicalRecordImages,
  type RecordImage,
} from "./_components/MedicalRecordImages";
import { ClinicalScribeReview } from "@/src/components/doctor/clinical-scribe-review";
import { AftercareDraft } from "@/src/components/doctor/aftercare-draft";
import { DentalXrayAnalyzer } from "@/src/components/doctor/dental-xray-analyzer";


type RecordSummary = {
  id: string;
  patientId: string;
  doctorId?: string | null;
  doctorName?: string | null;
  appointmentId?: string | null;
  patientName: string;
  patientCode: string;
  diagnosis: string | null;
  chiefComplaint: string | null;
  treatmentNotes?: string | null;
  serviceName: string | null;
  scheduledAt: string | null;
  followUpDate: string | null;
  prescriptionCount: number;
  createdAt: string;
  updatedAt: string;
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

type TabKey =
  | "OVERVIEW"
  | "CHART"
  | "IMAGES"
  | "XRAY_AI"
  | "PRESCRIPTIONS"
  | "AFTERCARE"
  | "HISTORY";


function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
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

function cleanSearchText(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const VALID_FDI_TEETH = new Set([
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
]);

function MedicalRecordsContent() {
  const router = useRouter();
  const { showAlert, showConfirm } = useAppDialog();
  const searchParams = useSearchParams();
  const preSelectId = searchParams.get("recordId");
  const appointmentId = searchParams.get("appointmentId");
  const patientIdParam = searchParams.get("patientId");

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
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");
  const tabsNavRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabScroll = useCallback(() => {
    const el = tabsNavRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = tabsNavRef.current;
    if (!el) return;
    checkTabScroll();
    el.addEventListener("scroll", checkTabScroll, { passive: true });
    window.addEventListener("resize", checkTabScroll);
    return () => {
      el.removeEventListener("scroll", checkTabScroll);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, [checkTabScroll]);

  const scrollTabs = (direction: "left" | "right") => {
    const el = tabsNavRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const activeBtn = tabsNavRef.current?.querySelector<HTMLElement>(
      `[data-tab-key="${activeTab}"]`,
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
    const timer = setTimeout(checkTabScroll, 200);
    return () => clearTimeout(timer);
  }, [activeTab, checkTabScroll]);
  const [printingRx, setPrintingRx] = useState<RecordDetail["prescriptions"][number] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1800);
  };

  const handleGuardedNavigation = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (JSON.stringify(form) !== savedFormSnapshot.current) {
      e.preventDefault();
      const confirmed = await showConfirm({
        title: "Bỏ các thay đổi chưa lưu?",
        description:
          "Hồ sơ bệnh án có các thay đổi chưa được lưu. Nếu rời trang bây giờ, dữ liệu bạn vừa nhập sẽ bị mất.",
        confirmLabel: "Rời đi",
        tone: "danger",
      });
      if (confirmed) {
        router.push(href);
      }
    }
  };

  const [pastRecords, setPastRecords] = useState<RecordSummary[]>([]);
  const [loadingPastRecords, setLoadingPastRecords] = useState(false);
  const requestSequence = useRef(0);
  const savedFormSnapshot = useRef(
    JSON.stringify({
      chiefComplaint: "",
      diagnosis: "",
      treatmentNotes: "",
      internalNotes: "",
      followUpDate: "",
      images: [],
      dentalChart: { teeth: [] },
    }),
  );

  const [form, setForm] = useState({
    chiefComplaint: "",
    diagnosis: "",
    treatmentNotes: "",
    internalNotes: "",
    followUpDate: "",
    images: [] as RecordImage[],
    dentalChart: { teeth: [] } as DentalChartData,
  });
  const doctorId = getDoctorIdFromCookie();
  const sessionError = doctorId
    ? null
    : "Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.";
  const selectionError = preSelectId && !isUuid(preSelectId)
    ? "Mã hồ sơ không hợp lệ."
    : null;
  const today = localDateStr();
  // Khởi tạo trung tính để tránh hydration mismatch (cookie chỉ có trên client)
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  /* eslint-disable react-hooks/preserve-manual-memoization -- callbacks intentionally stay stable for request effects */
  const applyDetail = useCallback((data: RecordDetail, id: string) => {
    setDetail(data);
    setLoadedDetailId(id);
    setDetailError(null);
    setSaved(false);
    setSaveError(null);
    const nextForm = {
      chiefComplaint: data.chiefComplaint ?? "",
      diagnosis: data.diagnosis ?? "",
      treatmentNotes: data.treatmentNotes ?? "",
      internalNotes: data.internalNotes ?? "",
      followUpDate: data.followUpDate
        ? data.followUpDate.slice(0, 10)
        : "",
      images: Array.isArray(data.images) ? data.images : [],
      dentalChart: {
        teeth: Array.isArray(data.dentalChart?.teeth)
          ? data.dentalChart.teeth
              .filter((t) => VALID_FDI_TEETH.has(t.number))
              .map((t) => ({
                number: t.number,
                status: t.status as ToothStatus,
              }))
          : [],
      },
    };
    setForm(nextForm);
    savedFormSnapshot.current = JSON.stringify(nextForm);

    // Fetch past records of this patient across the dental clinic
    if (data.patientId && doctorId) {
      setLoadingPastRecords(true);
      apiClient
        .get<RecordSummary[]>(
          `/medical-records?patientId=${data.patientId}&allDoctors=true`
        )
        .then((res) => {
          const list = Array.isArray(res.data)
            ? res.data.filter((r) => r.id !== data.id)
            : [];
          setPastRecords(list);
        })
        .catch(() => setPastRecords([]))
        .finally(() => setLoadingPastRecords(false));
    }

    setRecords((prev) => {
      if (prev.some((r) => r.id === data.id)) return prev;
      return [
        {
          id: data.id,
          patientId: data.patientId,
          appointmentId: (data as any).appointmentId ?? null,
          patientName: data.patientName,
          patientCode: data.patientCode,
          diagnosis: data.diagnosis,
          chiefComplaint: data.chiefComplaint,
          serviceName: data.serviceName,
          scheduledAt: data.scheduledAt,
          followUpDate: data.followUpDate,
          prescriptionCount: data.prescriptionCount,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        ...prev,
      ];
    });
  }, [doctorId]);

  const loadDetail = useCallback(
    async (id: string, opts?: { keepTab?: boolean }) => {
      const sequence = ++requestSequence.current;
      try {
        const res = await apiClient.get<RecordDetail>(`/medical-records/${id}`);
        if (sequence !== requestSequence.current) return;
        if (opts?.keepTab) {
          // Chỉ làm mới metadata (đơn thuốc, updatedAt) khi reload ngầm mà không xóa đè form đang nhập dở
          setDetail(res.data);
          setLoadedDetailId(id);
          setDetailError(null);
          setRecords((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    prescriptionCount: res.data.prescriptionCount,
                    updatedAt: res.data.updatedAt,
                  }
                : r,
            ),
          );
        } else {
          applyDetail(res.data, id);
          setActiveTab("OVERVIEW");
        }
      } catch (err) {
        if (sequence !== requestSequence.current) return;
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
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const selectRecord = async (id: string) => {
    if (id === selectedId) return;
    if (JSON.stringify(form) !== savedFormSnapshot.current) {
      const confirmed = await showConfirm({
        title: "Bỏ các thay đổi chưa lưu?",
        description: "Các ghi chép, sơ đồ răng hoặc kết quả AI chưa lưu sẽ bị mất.",
        confirmLabel: "Bỏ thay đổi",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    setSelectedId(id);
  };

  useEffect(() => {
    if (JSON.stringify(form) === savedFormSnapshot.current) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [form]);

  useEffect(() => {
    if (!doctorId) {
      return;
    }
    if (preSelectId && !isUuid(preSelectId)) {
      return;
    }
    if (appointmentId && !isUuid(appointmentId)) {
      return;
    }

    let cancelled = false;

    async function initRecords() {
      setListLoading(true);
      setListError(null);
      try {
        const res = await apiClient.get<RecordSummary[]>(
          `/medical-records?doctorId=${doctorId}`,
        );
        if (cancelled) return;
        let list = Array.isArray(res.data) ? res.data : [];

        let targetId: string | null = preSelectId;

        // Nếu có appointmentId được truyền vào từ Lịch hẹn hoặc Hồ sơ bệnh nhân
        if (!targetId && appointmentId) {
          // 1. Kiểm tra xem trong list đã có hồ sơ của appointment này chưa
          const matchedInList = list.find((r) => r.appointmentId === appointmentId);
          if (matchedInList) {
            targetId = matchedInList.id;
          } else {
            // 2. Thử truy vấn trực tiếp theo appointmentId
            try {
              const aptRecRes = await apiClient.get<RecordSummary[]>(
                `/medical-records?doctorId=${doctorId}&appointmentId=${appointmentId}`,
              );
              if (Array.isArray(aptRecRes.data) && aptRecRes.data.length > 0) {
                const found = aptRecRes.data[0];
                targetId = found.id;
                if (!list.some((r) => r.id === found.id)) {
                  list = [found, ...list];
                }
              }
            } catch {
              // ignore
            }

            // 3. Nếu vẫn chưa có và đây là lịch hẹn CHECKED_IN, tự động bắt đầu khám
            if (!targetId) {
              try {
                const startRes = await apiClient.patch<{
                  id: string;
                  medicalRecordId?: string | null;
                  medicalRecords?: Array<{ id: string }>;
                }>(`/appointments/${appointmentId}/start`);

                const createdRecId =
                  startRes.data.medicalRecordId ??
                  startRes.data.medicalRecords?.[0]?.id ??
                  null;

                if (createdRecId) {
                  targetId = createdRecId;
                  const refreshed = await apiClient.get<RecordSummary[]>(
                    `/medical-records?doctorId=${doctorId}`,
                  );
                  list = Array.isArray(refreshed.data) ? refreshed.data : list;
                }
              } catch {
                if (patientIdParam) {
                  const ptMatch = list.find((r) => r.patientId === patientIdParam);
                  if (ptMatch) targetId = ptMatch.id;
                }
              }
            }
          }
        }

        if (cancelled) return;
        setRecords(list);
        const finalSelected = targetId ?? list[0]?.id ?? null;
        if (finalSelected) {
          setSelectedId(finalSelected);
        }
      } catch {
        if (!cancelled) setListError("Không thể tải danh sách hồ sơ bệnh án.");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }

    void initRecords();

    return () => {
      cancelled = true;
    };
  }, [doctorId, preSelectId, appointmentId, patientIdParam]);

  useEffect(() => {
    if (!selectedId) return;
    // The state update occurs after the API promise resolves, not synchronously in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Reload đơn thuốc khi quay lại tab
  useEffect(() => {
    if (activeTab !== "PRESCRIPTIONS" || !selectedId) return;
    // Reload after navigation back from prescription editing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail(selectedId, { keepTab: true });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!selectedId) return;

    const originalFollowUp = detail?.followUpDate
      ? detail.followUpDate.slice(0, 10)
      : "";
    if (form.followUpDate && form.followUpDate !== originalFollowUp && form.followUpDate < today) {
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
          chiefComplaint: form.chiefComplaint.trim() || null,
          diagnosis: form.diagnosis.trim() || null,
          treatmentNotes: form.treatmentNotes.trim() || null,
          internalNotes: form.internalNotes.trim() || null,
          followUpDate: form.followUpDate || null,
          images: form.images,
          dentalChart: {
            teeth: (form.dentalChart?.teeth || []).filter((t) =>
              VALID_FDI_TEETH.has(t.number),
            ),
          },
          expectedUpdatedAt: detail?.updatedAt,
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
                updatedAt: res.data.updatedAt,
              }
            : r,
        ),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      const backendMsg = axios.isAxiosError(err)
        ? Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(", ")
          : err.response?.data?.message
        : null;
      setSaveError(
        status === 403
          ? "Bạn không có quyền sửa hồ sơ này."
          : status === 409
            ? "Hồ sơ vừa được cập nhật ở nơi khác. Vui lòng tải lại rồi thực hiện lại thay đổi."
          : status === 404
            ? "Không tìm thấy hồ sơ. F5 tải lại danh sách rồi chọn lại."
          : typeof backendMsg === "string"
            ? backendMsg
            : "Lưu thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const filtered = useMemo(() => {
    const raw = search.trim();
    if (!raw) return records;
    const q = raw.toLowerCase();
    const cleanQ = cleanSearchText(raw);
    return records.filter((r) => {
      const name = r.patientName.toLowerCase();
      const code = r.patientCode.toLowerCase();
      const diag = (r.diagnosis ?? "").toLowerCase();
      const service = (r.serviceName ?? "").toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        diag.includes(q) ||
        service.includes(q) ||
        cleanSearchText(name).includes(cleanQ) ||
        cleanSearchText(diag).includes(cleanQ) ||
        cleanSearchText(service).includes(cleanQ)
      );
    });
  }, [records, search]);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRecords = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    if (!selectedId) return;
    const index = filtered.findIndex((r) => r.id === selectedId);
    if (index !== -1) {
      const targetPage = Math.floor(index / pageSize) + 1;
      setPage((curr) => (curr !== targetPage ? targetPage : curr));
    }
  }, [selectedId, filtered]);

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
    <div className="bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-dark">
            Hồ sơ bệnh án điện tử
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem, ghi chép và cập nhật hồ sơ bệnh án của bệnh nhân.
          </p>
        </div>

        {(sessionError || selectionError || listError) && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {sessionError || selectionError || listError}
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {doctorId && !selectionError && listLoading ? (
                <div className="flex justify-center py-10">
                  <SpinnerGap size={24} className="animate-spin text-brand" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Không có hồ sơ nào
                </div>
              ) : (
                visibleRecords.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => void selectRecord(r.id)}
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
                        {formatDate(r.scheduledAt || r.createdAt)}
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
            {!listLoading && filtered.length > pageSize && (
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {currentPage}/{totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold disabled:opacity-40">Trước</button>
                  <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold disabled:opacity-40">Sau</button>
                </div>
              </div>
            )}
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
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-32 shadow-sm">
                <SpinnerGap size={32} className="animate-spin text-brand" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Đang tải thông tin hồ sơ bệnh án...
                </p>
              </div>
            ) : detail ? (
              <>
                {/* Patient Header Banner - Modern High-Taste Clinical Hero */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all lg:p-6">
                  {/* Subtle top accent gradient */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-sky-400 to-brand-dark" />
                  
                  {/* Ambient subtle glow */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/5 blur-3xl" />

                  <div className="relative flex flex-wrap items-start justify-between gap-5">
                    {/* Left side: Avatar + Patient identification & Clinical metadata */}
                    <div className="flex items-start gap-4 sm:items-center">
                      {/* Avatar with subtle ring and live session pulse */}
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark font-mono text-lg font-black text-white shadow-sm ring-4 ring-brand/10">
                        {initials}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          </span>
                        </span>
                      </div>

                      {/* Name, Patient Code, Status and Info Chips */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                            {detail.patientName}
                          </h2>

                          {/* Patient Code Badge with click-to-copy */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(detail.patientCode, "code")}
                            title="Bấm để sao chép mã bệnh nhân"
                            className="group inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-light px-2.5 py-0.5 font-mono text-xs font-bold text-brand-dark shadow-2xs transition-all hover:bg-brand/15 active:scale-[0.98] cursor-pointer"
                          >
                            <IdentificationCard size={13} weight="bold" className="text-brand" />
                            <span>{detail.patientCode}</span>
                            {copiedKey === "code" ? (
                              <Check size={12} weight="bold" className="text-emerald-600" />
                            ) : (
                              <Copy size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>

                          {/* Active Clinical Badge */}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đang điều trị
                          </span>
                        </div>

                        {/* Metadata row */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                          {detail.patientPhone && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(detail.patientPhone!, "phone")}
                              title="Bấm để sao chép số điện thoại"
                              className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 font-medium text-slate-700 shadow-2xs transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] cursor-pointer"
                            >
                              <Phone size={13} weight="duotone" className="text-slate-400 group-hover:text-brand transition-colors" />
                              <span className="font-mono font-semibold tracking-tight">{detail.patientPhone}</span>
                              {copiedKey === "phone" ? (
                                <Check size={12} weight="bold" className="text-emerald-600" />
                              ) : (
                                <Copy size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          )}

                          {(detail.scheduledAt || detail.createdAt) && (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 font-medium text-slate-700 shadow-2xs">
                              <Clock size={13} weight="duotone" className="text-slate-400" />
                              <span className="font-mono text-slate-600">
                                {formatDateTime(detail.scheduledAt || detail.createdAt)}
                              </span>
                            </div>
                          )}

                          {detail.serviceName && (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/80 px-2.5 py-1 font-semibold text-brand-dark shadow-2xs">
                              <Sparkle size={13} weight="fill" className="text-brand" />
                              <span>{detail.serviceName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Follow-up alert + Quick actions */}
                    <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
                      {detail.followUpDate && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-2 text-xs shadow-2xs">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <CalendarBlank size={16} weight="duotone" />
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700/80">Lịch hẹn tái khám</p>
                            <p className="font-mono text-xs font-bold text-amber-950">{formatDate(detail.followUpDate)}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {prescribeHref !== "#" && (
                          <Link
                            href={prescribeHref}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-bold text-brand transition-all hover:bg-brand hover:text-white active:scale-[0.98] cursor-pointer"
                          >
                            <Pill size={14} weight="bold" />
                            <span>Kê đơn mới</span>
                          </Link>
                        )}
                        <Link
                          href={`/doctor/patients/${detail.patientId}`}
                          onClick={(e) => void handleGuardedNavigation(e, `/doctor/patients/${detail.patientId}`)}
                          className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-brand/40 hover:bg-slate-50 hover:text-brand active:scale-[0.98] cursor-pointer"
                        >
                          <User size={14} weight="duotone" className="text-slate-400 group-hover:text-brand transition-colors" />
                          <span>Hồ sơ bệnh nhân</span>
                          <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Bar with icons and count indicators */}
                <div className="relative border-b border-border">
                  {canScrollLeft && (
                    <button
                      type="button"
                      aria-label="Cuộn tab sang trái"
                      onClick={() => scrollTabs("left")}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-brand hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      type="button"
                      aria-label="Cuộn tab sang phải"
                      onClick={() => scrollTabs("right")}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-brand hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  )}
                  <div
                    ref={tabsNavRef}
                    className="flex items-center gap-0.5 overflow-x-auto px-1 py-0.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                  >
                    {(
                      [
                        { key: "OVERVIEW" as TabKey, label: "Tổng quan", icon: FileText },
                        {
                          key: "HISTORY" as TabKey,
                          label: "Lịch sử khám",
                          count: pastRecords.length,
                          icon: ClockCounterClockwise,
                        },
                        { key: "CHART" as TabKey, label: "Sơ đồ răng", icon: Tooth },
                        {
                          key: "IMAGES" as TabKey,
                          label: "Ảnh",
                          count: form.images.length,
                          icon: ImageIcon,
                        },
                        {
                          key: "XRAY_AI" as TabKey,
                          label: "X-Quang AI",
                          icon: Sparkle,
                        },
                        {
                          key: "PRESCRIPTIONS" as TabKey,
                          label: "Đơn thuốc",
                          count: detail.prescriptions.length,
                          icon: Pill,
                        },
                        {
                          key: "AFTERCARE" as TabKey,
                          label: "Dặn dò sau khám",
                          icon: ShieldCheck,
                        },
                      ] as {
                        key: TabKey;
                        label: string;
                        count?: number;
                        icon: React.ComponentType<{
                          size?: number;
                          weight?: "bold" | "regular" | "fill" | "duotone";
                          className?: string;
                        }>;
                      }[]
                    ).map((tab) => {
                      const isActive = activeTab === tab.key;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          data-tab-key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className={cn(
                            "group -mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-[0.98]",
                            isActive
                              ? "border-brand text-brand"
                              : "border-transparent text-muted-foreground hover:border-slate-300 hover:text-slate-900",
                          )}
                        >
                          <Icon
                            size={16}
                            weight={isActive ? "bold" : "regular"}
                            className={cn(
                              "transition-colors",
                              isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-600",
                            )}
                          />
                          <span>{tab.label}</span>
                          {typeof tab.count === "number" && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold transition-colors",
                                isActive
                                  ? "bg-brand/10 text-brand"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700",
                              )}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="min-h-[400px] rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className={activeTab === "OVERVIEW" ? "space-y-5" : "hidden"}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Ghi chép lâm sàng
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
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
                    </div>

                    <ClinicalScribeReview
                      key={detail.id}
                      patientId={detail.patientId}
                      serviceName={detail.serviceName}
                      current={{
                        chiefComplaint: form.chiefComplaint,
                        diagnosis: form.diagnosis,
                        treatmentNotes: form.treatmentNotes,
                      }}
                      onApply={(values) =>
                        setForm((current) => ({ ...current, ...values }))
                      }
                    />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Lý do khám
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
                            placeholder="Lý do khám / triệu chứng chính..."
                            className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Chẩn đoán
                          </label>
                          <textarea
                            rows={2}
                            value={form.diagnosis}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                diagnosis: e.target.value,
                              }))
                            }
                            placeholder="Nhập chẩn đoán..."
                            className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-bold text-brand-dark shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <CalendarBlank size={12} /> Ngày tái khám
                          </label>
                          <input
                            type="date"
                            min={
                              form.followUpDate && form.followUpDate < today
                                ? form.followUpDate
                                : today
                            }
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
                            <Lock size={12} /> Ghi chú nội bộ phòng khám
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
                            placeholder="Chỉ bác sĩ phụ trách và quản trị viên được xem..."
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

                  <div className={activeTab === "CHART" ? "space-y-5" : "hidden"}>
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

                  <div className={activeTab === "IMAGES" ? "space-y-5" : "hidden"}>
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
                      patientId={detail?.patientId}
                      patientName={detail?.patientName}
                      value={form.images}
                      onChange={(images) =>
                        setForm((f) => ({ ...f, images }))
                      }
                      onUploaded={(images, updatedAt) => {
                        setDetail((d) =>
                          d
                            ? {
                                ...d,
                                images,
                                updatedAt: updatedAt || d.updatedAt,
                              }
                            : d,
                        );
                        setRecords((prev) =>
                          prev.map((r) =>
                            r.id === selectedId
                              ? { ...r, updatedAt: updatedAt || r.updatedAt }
                              : r,
                          ),
                        );
                        try {
                          const currentSnapshot = JSON.parse(
                            savedFormSnapshot.current,
                          );
                          currentSnapshot.images = images;
                          savedFormSnapshot.current =
                            JSON.stringify(currentSnapshot);
                        } catch {
                          // ignore
                        }
                      }}
                      onApplyAiDiagnosis={(diagnosis, treatmentNotes) => {
                        setForm((f) => {
                          const diagTag = `[X-quang AI]: ${diagnosis}`;
                          let nextDiagnosis = f.diagnosis;
                          if (!nextDiagnosis) {
                            nextDiagnosis = diagTag;
                          } else if (!nextDiagnosis.includes(diagnosis)) {
                            nextDiagnosis = `${nextDiagnosis}\n${diagTag}`;
                          }

                          let nextTreatment = f.treatmentNotes;
                          if (!nextTreatment) {
                            nextTreatment = treatmentNotes;
                          } else if (!nextTreatment.includes(treatmentNotes)) {
                            nextTreatment = `${nextTreatment}\n\n${treatmentNotes}`;
                          }

                          return {
                            ...f,
                            diagnosis: nextDiagnosis,
                            treatmentNotes: nextTreatment,
                          };
                        });
                        setActiveTab("OVERVIEW");
                      }}
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

                  <div className={activeTab === "XRAY_AI" ? "block" : "hidden"}>
                    <DentalXrayAnalyzer
                      key={detail.id}
                      patientId={detail.patientId}
                      patientImages={(form.images || [])
                        .filter((img) => img.url && (img.type === "xray" || !img.type))
                        .map((img, i) => ({
                        id: img.id || img.url,
                        url: img.url,
                        title:
                          img.caption ||
                          (img.type === "xray" || !img.type
                            ? `Phim X-quang ${i + 1}`
                            : img.type === "intraoral"
                              ? `Ảnh nội khoa ${i + 1}`
                              : `Ảnh ${i + 1}`),
                        type: img.type || "xray",
                        date: "Từ hồ sơ bệnh án",
                      }))}
                      onApplyToMedicalRecord={(summaryText) => {
                        setForm((prev) => {
                          if (!prev.treatmentNotes) return { ...prev, treatmentNotes: summaryText };
                          if (prev.treatmentNotes.includes(summaryText)) return prev;
                          return { ...prev, treatmentNotes: `${prev.treatmentNotes}\n\n${summaryText}` };
                        });
                      }}
                      onApplyDiagnosis={(diag) => {
                        setForm((prev) => {
                          const diagTag = `[X-quang AI]: ${diag}`;
                          if (!prev.diagnosis) return { ...prev, diagnosis: diagTag };
                          if (prev.diagnosis.includes(diag)) return prev;
                          return { ...prev, diagnosis: `${prev.diagnosis}\n${diagTag}` };
                        });
                      }}
                      onApplyToDentalChart={(findings) => {
                        const existingTeeth = form.dentalChart?.teeth || [];
                        const updatedTeeth = applyXrayFindingsToDentalChart(
                          existingTeeth,
                          findings
                        );

                        setForm((prev) => ({
                          ...prev,
                          dentalChart: { teeth: updatedTeeth },
                        }));
                      }}
                      onRequestUpload={() => setActiveTab("IMAGES")}
                    />
                  </div>



                  {activeTab === "PRESCRIPTIONS" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Đơn thuốc của hồ sơ này
                        </h3>
                        <Link
                          href={prescribeHref}
                          onClick={(e) => void handleGuardedNavigation(e, prescribeHref)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
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
                                <button
                                  type="button"
                                  onClick={() => setPrintingRx(rx)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                  title="In đơn thuốc ra giấy"
                                >
                                  <Printer size={12} /> In đơn
                                </button>
                                <Link
                                  href={`/doctor/prescriptions/${rx.id}/edit`}
                                  onClick={(e) => void handleGuardedNavigation(e, `/doctor/prescriptions/${rx.id}/edit`)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/10 cursor-pointer"
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

                  <div className={activeTab === "AFTERCARE" ? "space-y-5" : "hidden"}>
                    <AftercareDraft
                      key={detail.id}
                      medicalRecordId={detail.id}
                      patientName={detail.patientName}
                      currentForm={{
                        chiefComplaint: form.chiefComplaint,
                        diagnosis: form.diagnosis,
                        treatmentNotes: form.treatmentNotes,
                        followUpDate: form.followUpDate,
                      }}
                      isDirty={savedFormSnapshot.current !== JSON.stringify(form)}
                    />
                  </div>

                  {activeTab === "HISTORY" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Lịch sử các lần khám cũ của {detail.patientName}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Bác sĩ có thể xem lại chẩn đoán, thuốc và diễn biến điều trị của các lần khám trước
                          </p>
                        </div>
                        <span className="rounded-full bg-brand/10 px-3 py-1 font-mono text-xs font-bold text-brand">
                          {pastRecords.length} lần khám
                        </span>
                      </div>

                      {loadingPastRecords ? (
                        <div className="flex h-32 items-center justify-center">
                          <SpinnerGap size={24} className="animate-spin text-brand" />
                        </div>
                      ) : pastRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                          <ClockCounterClockwise size={40} className="mb-2 text-slate-300" weight="duotone" />
                          <p className="text-sm font-medium">Bệnh nhân chưa có lần khám cũ nào khác</p>
                          <p className="text-xs text-slate-400 mt-1">Đây là hồ sơ bệnh án đầu tiên của bệnh nhân này.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pastRecords.map((pastRec) => (
                            <div
                              key={pastRec.id}
                              className="rounded-2xl border border-border/80 bg-slate-50/70 p-4 transition hover:border-brand/30 hover:bg-white hover:shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-2 flex-1 min-w-[240px]">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-bold text-slate-900">
                                      <CalendarBlank size={13} className="text-brand" />
                                      {formatDateTime(pastRec.scheduledAt || pastRec.createdAt)}
                                    </span>
                                    {pastRec.serviceName && (
                                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                                        {pastRec.serviceName}
                                      </span>
                                    )}
                                    {pastRec.doctorName && (
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                          pastRec.doctorId === doctorId
                                            ? "bg-slate-100 text-slate-700"
                                            : "bg-amber-50 text-amber-800 border border-amber-200/60",
                                        )}
                                      >
                                        <User
                                          size={11}
                                          className={
                                            pastRec.doctorId === doctorId
                                              ? "text-slate-500"
                                              : "text-amber-600"
                                          }
                                        />
                                        {pastRec.doctorId === doctorId
                                          ? "Bạn phụ trách"
                                          : `BS. ${pastRec.doctorName}`}
                                      </span>
                                    )}
                                  </div>

                                  {pastRec.diagnosis && (
                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                      <p className="font-mono text-xs font-bold text-brand-dark">
                                        Chẩn đoán: {pastRec.diagnosis}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setForm((f) => ({
                                            ...f,
                                            diagnosis: pastRec.diagnosis || f.diagnosis,
                                          }));
                                          void showAlert({
                                            title: "Đã sao chép chẩn đoán",
                                            description: "Chẩn đoán từ lần khám trước đã được đưa vào bệnh án hiện tại.",
                                            tone: "success",
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-brand shadow-2xs border border-brand/20 hover:bg-brand/5 cursor-pointer"
                                        title="Sao chép chẩn đoán sang ca này"
                                      >
                                        <Copy size={10} /> Sao chép
                                      </button>
                                    </div>
                                  )}

                                  {pastRec.chiefComplaint && (
                                    <p className="text-xs text-slate-600">
                                      <span className="font-medium text-slate-700">Lý do khám:</span> {pastRec.chiefComplaint}
                                    </p>
                                  )}

                                  {pastRec.treatmentNotes && (
                                    <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-2xs space-y-1.5 mt-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                                          <FileText size={13} className="text-brand" weight="bold" />
                                          Diễn biến & Ghi chú điều trị:
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setForm((f) => ({
                                              ...f,
                                              treatmentNotes: pastRec.treatmentNotes
                                                ? f.treatmentNotes
                                                  ? `${f.treatmentNotes}\n[Lần khám cũ: ${pastRec.treatmentNotes}]`
                                                  : pastRec.treatmentNotes
                                                : f.treatmentNotes,
                                            }));
                                            void showAlert({
                                              title: "Đã chèn ghi chú điều trị",
                                              description: "Ghi chú điều trị từ lần khám trước đã được thêm vào bệnh án hiện tại.",
                                              tone: "success",
                                            });
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline cursor-pointer"
                                          title="Chèn nội dung điều trị cũ vào ca này"
                                        >
                                          <Copy size={10} /> Chèn vào ca này
                                        </button>
                                      </div>
                                      <p className="text-slate-600 whitespace-pre-line leading-relaxed text-xs">
                                        {pastRec.treatmentNotes}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                                    {pastRec.followUpDate && (
                                      <span>Tái khám: {formatDate(pastRec.followUpDate)}</span>
                                    )}
                                    {pastRec.prescriptionCount > 0 && (
                                      <span className="flex items-center gap-1 font-medium text-blue-600">
                                        <Pill size={12} /> {pastRec.prescriptionCount} đơn thuốc
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => void selectRecord(pastRec.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand cursor-pointer shrink-0"
                                >
                                  Mở bệnh án này <ArrowRight size={12} />
                                </button>
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
      {printingRx && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5 backdrop-blur-xs print:static print:bg-transparent print:p-0">
          <div className="relative flex max-h-[90vh] sm:max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:max-h-none print:w-full print:max-w-none print:shadow-none">
            <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-3.5 print:hidden">
              <div className="flex items-center gap-2">
                <Pill size={18} className="text-brand" weight="duotone" />
                <h3 className="text-sm font-bold text-slate-900">Xem trước & In đơn thuốc</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-dark active:scale-[0.98] transition cursor-pointer"
                >
                  <Printer size={15} weight="bold" /> In ra giấy
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingRx(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 text-slate-900 [scrollbar-width:thin] print:overflow-visible print:p-6" id="print-area">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-dark">PHÒNG KHÁM NHA KHOA SMART DENTAL</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 uppercase">ĐƠN THUỐC ĐIỆN TỬ</h1>
                <p className="text-xs text-slate-500 mt-0.5">Ngày kê: {formatDateTime(printingRx.createdAt)}</p>
              </div>

              <div className="my-5 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <p><span className="font-semibold text-slate-600">Họ và tên BN:</span> <span className="font-bold text-slate-900 text-sm uppercase">{detail.patientName}</span></p>
                  <p className="mt-1"><span className="font-semibold text-slate-600">Mã bệnh nhân:</span> <span className="font-mono font-bold text-slate-800">{detail.patientCode}</span></p>
                </div>
                <div>
                  <p><span className="font-semibold text-slate-600">Chẩn đoán:</span> <span className="font-semibold text-slate-900">{detail.diagnosis || "Chưa ghi nhận"}</span></p>
                  {detail.serviceName && <p className="mt-1"><span className="font-semibold text-slate-600">Dịch vụ điều trị:</span> {detail.serviceName}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Chỉ định thuốc:</p>
                <ol className="space-y-3 list-decimal list-inside text-xs">
                  {printingRx.items.map((item, idx) => (
                    <li key={item.id || idx} className="border-b border-slate-100 pb-2.5">
                      <span className="font-bold text-sm text-slate-900">{item.medicineName}</span>
                      <span className="font-semibold text-slate-700 ml-2">— {item.dosage}</span>
                      {item.duration && <span className="text-slate-500 ml-2">(× {item.duration})</span>}
                      <div className="ml-5 mt-1 text-slate-600 font-medium">
                        {item.frequency && <p>• Cách dùng: {item.frequency}</p>}
                        {item.instruction && <p className="italic text-slate-500">• Hướng dẫn: {item.instruction}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {printingRx.notes && (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
                  <span className="font-bold">Lời dặn của bác sĩ:</span> {printingRx.notes}
                </div>
              )}

              <div className="mt-8 flex justify-end text-center text-xs">
                <div className="w-56 space-y-1">
                  <p className="italic text-slate-500">{formatDate(printingRx.createdAt)}</p>
                  <p className="font-bold text-slate-900 uppercase">Bác sĩ điều trị</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-800">(Ký và ghi rõ họ tên)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
