"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import {
  Plus,
  Pill,
  SpinnerGap,
  Warning,
  CaretDown,
  CaretRight,
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

export default function PrescriptionsPage() {
  const doctorId = getUserInfo().doctorId;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(!!doctorId);
  const [error, setError] = useState<string | null>(
    !doctorId ? "Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại." : null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId) return;
    apiClient
      .get<Prescription[]>(`/prescriptions?doctorId=${doctorId}`)
      .then((res) => setPrescriptions(res.data))
      .catch(() => setError("Không thể tải danh sách đơn thuốc."))
      .finally(() => setLoading(false));
  }, [doctorId]);

  return (
    <>
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

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
            <SpinnerGap size={28} className="animate-spin text-brand" />
          </div>
        ) : !error && prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
            <Pill size={48} className="mb-4 text-slate-300" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              Chưa có đơn thuốc nào
            </p>
            <Link
              href="/doctor/prescriptions/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Kê đơn mới
            </Link>
          </div>
        ) : !error ? (
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
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
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
                      </tr>
                      {expandedId === rx.id && (
                        <tr
                          key={`${rx.id}-detail`}
                          className="border-b border-border/50 bg-slate-50/80"
                        >
                          <td />
                          <td colSpan={5} className="px-5 py-4">
                            <div className="rounded-xl border border-border bg-white overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  <tr>
                                    <th className="px-4 py-2.5">Tên thuốc</th>
                                    <th className="px-4 py-2.5">Liều dùng</th>
                                    <th className="px-4 py-2.5">Tần suất</th>
                                    <th className="px-4 py-2.5">Thời gian</th>
                                    <th className="px-4 py-2.5">Hướng dẫn</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                  {rx.items.map((item) => (
                                    <tr key={item.id}>
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
        ) : null}
      </div>
    </>
  );
}
