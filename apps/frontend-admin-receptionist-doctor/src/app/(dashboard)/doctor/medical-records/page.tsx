"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import {
  MagnifyingGlass,
  Warning,
  Lock,
  FloppyDisk,
  ArrowRight,
  Images,
  Pill,
  CalendarBlank,
} from "@phosphor-icons/react";

type QueueStatus = "WAITING" | "EXAMINING" | "COMPLETED";

type Patient = {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  gender: string;
  age: number;
  appointmentTime: string;
  status: QueueStatus;
  reason: string;
  allergies?: string;
  notes?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  internalNotes?: string;
  followUpDate?: string;
};

const QUEUE_PATIENTS: Patient[] = [
  {
    id: "BN-23001",
    patientCode: "BN-23001",
    name: "Nguyễn Văn An",
    phone: "0901234567",
    gender: "Nam",
    age: 34,
    appointmentTime: "08:00",
    status: "COMPLETED",
    reason: "Khám định kỳ & Cạo vôi răng",
    chiefComplaint: "Khám định kỳ 6 tháng, cảm giác đau khi ăn đồ lạnh.",
    diagnosis: "[K02.1] Sâu răng vào ngà",
    treatmentNotes:
      "Cạo vôi răng siêu âm toàn hàm. Trám composite răng 36.",
    followUpDate: "2026-09-21",
  },
  {
    id: "BN-23002",
    patientCode: "BN-23002",
    name: "Trần Thị Bé",
    phone: "0911223344",
    gender: "Nữ",
    age: 29,
    appointmentTime: "09:30",
    status: "EXAMINING",
    reason: "Đau nhức răng hàm dưới",
    allergies: "Dị ứng Penicillin",
    notes: "Huyết áp thấp",
    chiefComplaint: "Đau buốt tự phát răng hàm dưới trái (R36) 3 ngày nay.",
    diagnosis: "[K04.0] Viêm tủy không hồi phục",
    treatmentNotes: "Mở tủy, làm sạch ống tủy, đặt thuốc Ca(OH)₂.",
    internalNotes: "BN lo lắng, cần tư vấn kỹ về quy trình chữa tủy.",
    followUpDate: "2026-07-28",
  },
  {
    id: "BN-23004",
    patientCode: "BN-23004",
    name: "Đỗ Thu Hà",
    phone: "0977889900",
    gender: "Nữ",
    age: 26,
    appointmentTime: "11:00",
    status: "WAITING",
    reason: "Tái khám niềng răng (Kỳ 6)",
    allergies: "Dị ứng Penicillin",
    notes: "Huyết áp thấp mãn tính",
    chiefComplaint: "Tái khám định kỳ, ê buốt nhẹ R36 và R46.",
    diagnosis: "[K08.8] Các rối loạn khác của răng và tổ chức nâng đỡ",
    treatmentNotes:
      "Thay thun, kiểm tra mắc cài. Gắn lại mắc cài R23 bị bong. Cạo vôi siêu âm.",
    internalNotes: "BN tái khám đúng hẹn, tuân thủ tốt.",
    followUpDate: "2026-08-11",
  },
];

const statusBadge: Record<QueueStatus, { label: string; dot: string }> = {
  WAITING: { label: "Đang chờ", dot: "bg-amber-400" },
  EXAMINING: { label: "Đang khám", dot: "bg-brand animate-pulse" },
  COMPLETED: { label: "Đã xong", dot: "bg-slate-400" },
};

type TabKey = "OVERVIEW" | "IMAGES" | "PRESCRIPTIONS";

export default function MedicalRecordsPage() {
  const [selectedId, setSelectedId] = useState<string>("BN-23002");
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");
  const [search, setSearch] = useState("");

  const patient = QUEUE_PATIENTS.find((p) => p.id === selectedId)!;

  const filteredQueue = QUEUE_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patientCode.toLowerCase().includes(search.toLowerCase()),
  );

  const initials = patient.name
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("");

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-dark">
            Hồ sơ bệnh án điện tử
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn bệnh nhân trong hàng đợi để ghi chép và lưu bệnh án.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          {/* LEFT: Queue */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm xl:sticky xl:top-6 xl:col-span-3 xl:h-[calc(100vh-8rem)]">
            <div className="border-b border-border bg-slate-50/50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
                Hàng đợi khám (Hôm nay)
              </p>
              <div className="relative">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {filteredQueue.map((pt) => {
                const badge = statusBadge[pt.status];
                return (
                  <button
                    key={pt.id}
                    onClick={() => {
                      setSelectedId(pt.id);
                      setActiveTab("OVERVIEW");
                    }}
                    className={cn(
                      "block w-full rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
                      selectedId === pt.id
                        ? "border-brand bg-brand/5 shadow-[0_0_0_1px_rgba(0,151,255,0.3)]"
                        : "border-border bg-white hover:border-slate-300 hover:shadow-sm",
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className={cn(
                          "font-bold",
                          selectedId === pt.id
                            ? "text-brand-dark"
                            : "text-slate-900",
                        )}
                      >
                        {pt.name}
                      </span>
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          badge.dot,
                        )}
                      />
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {pt.patientCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {pt.gender}, {pt.age}T
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {pt.appointmentTime}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-slate-600">
                      &ldquo;{pt.reason}&rdquo;
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: EMR Panel — binds to selected patient */}
          <div className="flex flex-col gap-6 xl:col-span-9">
            {/* Hero patient card */}
            <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-6 text-white shadow-xl">
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand/30 blur-[4rem]" />

              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20">
                    {initials}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <h2 className="text-2xl font-bold">{patient.name}</h2>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                        {patient.patientCode}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span>
                        {patient.gender}, {patient.age} tuổi
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      <span className="font-mono">{patient.phone}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      <span>{patient.appointmentTime} — {patient.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {patient.allergies && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 ring-1 ring-red-500/20">
                      <Warning size={14} className="shrink-0 text-red-400" weight="fill" />
                      <span className="text-xs font-bold text-red-100">
                        {patient.allergies}
                      </span>
                    </div>
                  )}
                  {patient.notes && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/20">
                      <Warning size={14} className="shrink-0 text-amber-400" weight="fill" />
                      <span className="text-xs font-bold text-amber-100">
                        {patient.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border px-1">
              {(
                [
                  { key: "OVERVIEW", label: "Khám & Điều trị" },
                  { key: "IMAGES", label: "X-Quang & Hình ảnh" },
                  { key: "PRESCRIPTIONS", label: "Đơn thuốc" },
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
            <div className="min-h-[500px] rounded-2xl border border-border bg-white p-6 shadow-sm">
              {activeTab === "OVERVIEW" && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Left: EMR form */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Ghi chép lâm sàng
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Lý do khám (Chief Complaint)
                        </label>
                        <textarea
                          rows={2}
                          defaultValue={patient.chiefComplaint}
                          key={`cc-${patient.id}`}
                          className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Chẩn đoán (ICD-10)
                        </label>
                        <input
                          type="text"
                          defaultValue={patient.diagnosis}
                          key={`dx-${patient.id}`}
                          className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-bold text-brand-dark shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Ghi chú điều trị
                        </label>
                        <textarea
                          rows={5}
                          defaultValue={patient.treatmentNotes}
                          key={`tn-${patient.id}`}
                          className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm text-slate-800 shadow-inner outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Lock size={12} /> Ghi chú nội bộ
                        </label>
                        <textarea
                          rows={2}
                          defaultValue={patient.internalNotes}
                          key={`in-${patient.id}`}
                          placeholder="Chỉ bác sĩ xem được..."
                          className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 italic"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <CalendarBlank size={12} /> Ngày tái khám
                        </label>
                        <input
                          type="date"
                          defaultValue={patient.followUpDate}
                          key={`fu-${patient.id}`}
                          className="rounded-xl border border-border bg-white px-4 py-2 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
                          <FloppyDisk size={14} className="mr-1.5 inline" />
                          Lưu nháp
                        </button>
                        <Link
                          href="/doctor/prescriptions/new"
                          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                        >
                          Hoàn thành & Kê đơn
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right: Treatment history */}
                  <div className="border-l border-border pl-8">
                    <h3 className="mb-6 text-base font-bold text-slate-900">
                      Lịch sử điều trị
                    </h3>
                    <div className="relative ml-3 space-y-8 border-l-2 border-slate-200">
                      {[
                        {
                          date: "15/05/2026 • BS. Lê Hoàng",
                          title: "Tái khám định kỳ (Kỳ 5)",
                          note: "Thay dây cung NA 0.16. Kéo đóng khoảng R14, 24.",
                        },
                        {
                          date: "10/04/2026 • BS. Lê Hoàng",
                          title: "Tái khám định kỳ (Kỳ 4)",
                          note: "Thay thun chuỗi. Vệ sinh mắc cài.",
                        },
                        {
                          date: "05/03/2026 • BS. Lê Hoàng",
                          title: "Tái khám định kỳ (Kỳ 3)",
                          note: "Siết dây cung. Chụp ảnh kiểm tra tiến độ.",
                        },
                      ].map((h, i) => (
                        <div key={i} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-slate-300" />
                          <p className="mb-1 text-xs font-bold text-muted-foreground">
                            {h.date}
                          </p>
                          <div className="rounded-xl border border-border bg-slate-50 p-4">
                            <p className="mb-2 text-sm font-bold text-slate-900">
                              {h.title}
                            </p>
                            <p className="font-mono text-sm text-slate-600">
                              {h.note}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "IMAGES" && (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400">
                    <Images size={40} weight="duotone" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    Chưa có X-Quang & Hình ảnh
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Tải lên phim Pano, Ceph hoặc hình chụp trong miệng để theo
                    dõi điều trị.
                  </p>
                  <button className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]">
                    + Tải ảnh lên
                  </button>
                </div>
              )}

              {activeTab === "PRESCRIPTIONS" && (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 text-blue-500">
                    <Pill size={40} weight="duotone" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    Đơn thuốc & Hướng dẫn
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Kê toa thuốc hoặc in giấy hướng dẫn chăm sóc răng miệng
                    sau điều trị.
                  </p>
                  <Link
                    href="/doctor/prescriptions/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
                  >
                    <Pill size={16} />
                    Kê đơn thuốc mới
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
