"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/src/components/layout/header";
import {
  Plus,
  Pill,
  SpinnerGap,
  Warning,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Printer,
  X,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

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
  patientId: string;
  patientName: string;
  patientCode: string;
  diagnosis: string | null;
  scheduledAt: string | null;
  notes: string | null;
  itemCount: number;
  items: PrescriptionItem[];
  createdAt: string;
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
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatDateFull(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function MonthYearFilter({
  value,
  onChange,
}: {
  value: string; // "YYYY-MM" hoặc ""
  onChange: (v: string) => void;
}) {
  const [month, setMonth] = useState(value ? value.slice(5) : "");
  const [year, setYear] = useState(value ? value.slice(0, 4) : String(currentYear));

  const commit = (m: string, y: string) => {
    onChange(m ? `${y}-${m}` : "");
  };

  const handleMonth = (m: string) => { setMonth(m); commit(m, year); };
  const handleYear = (y: string) => { setYear(y); if (month) commit(month, y); };
  const handleClear = () => { setMonth(""); onChange(""); };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={month}
        onChange={(e) => handleMonth(e.target.value)}
        className="rounded-xl border border-border bg-white py-2.5 pl-3 pr-7 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
      >
        <option value="">-- Tháng --</option>
        {MONTHS.map((label, i) => {
          const val = String(i + 1).padStart(2, "0");
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
      <select
        value={year}
        onChange={(e) => handleYear(e.target.value)}
        className="rounded-xl border border-border bg-white py-2.5 pl-3 pr-7 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      {month && (
        <button
          onClick={handleClear}
          title="Xóa bộ lọc tháng"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// Modal xác nhận xóa
function DeleteModal({
  rx,
  onConfirm,
  onCancel,
  deleting,
}: {
  rx: Prescription;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark">Xóa đơn thuốc?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Đơn thuốc của <strong>{rx.patientName}</strong> kê ngày{" "}
              {formatDateFull(rx.scheduledAt ?? rx.createdAt)} sẽ bị xóa vĩnh
              viễn và không thể khôi phục.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <SpinnerGap size={14} className="animate-spin" />}
            Xóa đơn thuốc
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal in đơn thuốc
function PrintModal({
  rx,
  onClose,
}: {
  rx: Prescription;
  onClose: () => void;
}) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden">
      <div className="mx-4 flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-white shadow-xl">
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 print:hidden">
          <h3 className="font-semibold text-brand-dark">Xem trước đơn thuốc</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              <Printer size={15} weight="bold" />
              In đơn
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nội dung đơn */}
        <div
          id="print-area"
          className="overflow-y-auto p-8 text-sm text-slate-800"
        >
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Phòng khám nha khoa
            </p>
            <h2 className="mt-1 text-xl font-bold text-brand-dark">
              ĐƠN THUỐC ĐIỆN TỬ
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ngày kê: {formatDateFull(rx.scheduledAt ?? rx.createdAt)}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-slate-50/60 p-4 text-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bệnh nhân
              </span>
              <p className="mt-0.5 font-semibold">{rx.patientName}</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mã BN
              </span>
              <p className="mt-0.5 font-mono font-semibold">{rx.patientCode}</p>
            </div>
            {rx.diagnosis && (
              <div className="col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Chẩn đoán
                </span>
                <p className="mt-0.5">{rx.diagnosis}</p>
              </div>
            )}
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Tên thuốc</th>
                <th className="pb-2 pr-3">Liều dùng</th>
                <th className="pb-2 pr-3">Tần suất</th>
                <th className="pb-2 pr-3">Thời gian</th>
                <th className="pb-2">Hướng dẫn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rx.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-3 font-medium">{item.medicineName}</td>
                  <td className="py-2 pr-3">{item.dosage}</td>
                  <td className="py-2 pr-3">{item.frequency ?? "—"}</td>
                  <td className="py-2 pr-3">{item.duration ?? "—"}</td>
                  <td className="py-2 italic text-slate-500">
                    {item.instruction ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rx.notes && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Lời dặn
              </p>
              <p className="mt-1 text-sm text-amber-900">{rx.notes}</p>
            </div>
          )}

          <div className="mt-8 text-right text-sm">
            <p className="text-muted-foreground">
              Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{" "}
              {new Date().getFullYear()}
            </p>
            <p className="mt-1 font-medium">Bác sĩ điều trị</p>
            <p className="mt-10 text-xs text-muted-foreground">
              (Ký và ghi rõ họ tên)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const doctorId = getUserInfo().doctorId;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(!!doctorId);
  const [error, setError] = useState<string | null>(
    !doctorId
      ? "Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại."
      : null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search & filter
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(""); // "YYYY-MM"

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Print
  const [printTarget, setPrintTarget] = useState<Prescription | null>(null);

  useEffect(() => {
    if (!doctorId) return;
    apiClient
      .get<Prescription[]>(`/prescriptions?doctorId=${doctorId}`)
      .then((res) => setPrescriptions(res.data))
      .catch(() => setError("Không thể tải danh sách đơn thuốc."))
      .finally(() => setLoading(false));
  }, [doctorId]);

  // Lọc dữ liệu theo search + tháng
  const filtered = useMemo(() => {
    let data = prescriptions;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (rx) =>
          rx.patientName.toLowerCase().includes(q) ||
          rx.patientCode.toLowerCase().includes(q) ||
          (rx.diagnosis ?? "").toLowerCase().includes(q),
      );
    }
    if (filterMonth) {
      data = data.filter((rx) => {
        const d = new Date(rx.scheduledAt ?? rx.createdAt);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return ym === filterMonth;
      });
    }
    return data;
  }, [prescriptions, search, filterMonth]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/prescriptions/${deleteTarget.id}`);
      setPrescriptions((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
    } catch {
      setError("Xóa đơn thuốc thất bại. Vui lòng thử lại.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Modals */}
      {deleteTarget && (
        <DeleteModal
          rx={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      {printTarget && (
        <PrintModal rx={printTarget} onClose={() => setPrintTarget(null)} />
      )}

      <Header
        title="Đơn thuốc điện tử"
        description="Kê đơn và theo dõi đơn thuốc cho bệnh nhân"
      >
        <Link
          href="/doctor/prescriptions/new"
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          Kê đơn mới
        </Link>
      </Header>

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Search & Filter bar */}
        {!loading && !error && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Tìm kiếm */}
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên bệnh nhân, mã BN, chẩn đoán..."
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Lọc tháng/năm — dùng select tránh vấn đề locale trình duyệt */}
            <MonthYearFilter value={filterMonth} onChange={setFilterMonth} />
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
            <SpinnerGap size={28} className="animate-spin text-brand" />
          </div>
        ) : !error && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
            <Pill size={48} className="mb-4 text-slate-300" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              {prescriptions.length === 0
                ? "Chưa có đơn thuốc nào"
                : "Không tìm thấy đơn thuốc phù hợp"}
            </p>
            {prescriptions.length === 0 && (
              <Link
                href="/doctor/prescriptions/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Kê đơn mới
              </Link>
            )}
            {prescriptions.length > 0 && (
              <button
                onClick={() => { setSearch(""); setFilterMonth(""); }}
                className="mt-3 text-sm text-brand hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : !error ? (
          <>
            {/* Tổng kết */}
            <p className="mb-3 text-xs text-muted-foreground">
              Hiển thị{" "}
              <strong className="text-brand-dark">{filtered.length}</strong> /{" "}
              {prescriptions.length} đơn thuốc
            </p>

            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="w-8 px-3 py-3.5" />
                      <th className="px-5 py-3.5">Ngày kê</th>
                      <th className="px-5 py-3.5">Bệnh nhân</th>
                      <th className="px-5 py-3.5">Chẩn đoán</th>
                      <th className="px-5 py-3.5 text-center">Số thuốc</th>
                      <th className="px-5 py-3.5">Ghi chú</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rx) => (
                      <>
                        <tr
                          key={rx.id}
                          className="cursor-pointer border-b border-border/50 transition-colors hover:bg-slate-50/50"
                          onClick={() =>
                            setExpandedId((prev) =>
                              prev === rx.id ? null : rx.id,
                            )
                          }
                        >
                          <td className="pl-4 pr-0 py-4">
                            {expandedId === rx.id ? (
                              <CaretDown
                                size={13}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <CaretRight
                                size={13}
                                className="text-muted-foreground"
                              />
                            )}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {formatDate(rx.scheduledAt ?? rx.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900">
                              {rx.patientName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rx.patientCode}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {rx.diagnosis ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                              {rx.itemCount}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm italic text-slate-500">
                            {rx.notes ?? "—"}
                          </td>
                          <td className="px-5 py-4">
                            {/* Action buttons — ngăn event bubble */}
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  router.push(
                                    `/doctor/prescriptions/${rx.id}/edit`,
                                  )
                                }
                                title="Sửa đơn thuốc"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand"
                              >
                                <PencilSimple size={14} />
                              </button>
                              <button
                                onClick={() => setPrintTarget(rx)}
                                title="In đơn thuốc"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Printer size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(rx)}
                                title="Xóa đơn thuốc"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedId === rx.id && (
                          <tr
                            key={`${rx.id}-detail`}
                            className="border-b border-border/50 bg-slate-50/80"
                          >
                            <td />
                            <td colSpan={6} className="px-5 py-4">
                              <div className="overflow-hidden rounded-xl border border-border bg-white">
                                <table className="w-full text-sm">
                                  <thead className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                      <th className="px-4 py-2.5">#</th>
                                      <th className="px-4 py-2.5">Tên thuốc</th>
                                      <th className="px-4 py-2.5">Liều dùng</th>
                                      <th className="px-4 py-2.5">Tần suất</th>
                                      <th className="px-4 py-2.5">Thời gian</th>
                                      <th className="px-4 py-2.5">Hướng dẫn</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {rx.items.map((item, i) => (
                                      <tr key={item.id}>
                                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                          {i + 1}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-slate-900">
                                          {item.medicineName}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                          {item.dosage}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                          {item.frequency ?? "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                          {item.duration ?? "—"}
                                        </td>
                                        <td className="px-4 py-2.5 italic text-slate-500">
                                          {item.instruction ?? "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
