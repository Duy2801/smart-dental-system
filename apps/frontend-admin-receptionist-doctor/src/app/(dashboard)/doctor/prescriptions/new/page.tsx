"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash,
  Printer,
  FloppyDisk,
} from "@phosphor-icons/react";

type MedItem = {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
};

export default function NewPrescriptionPage() {
  const [medications, setMedications] = useState<MedItem[]>([
    {
      id: 1,
      medicineName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instruction: "",
    },
  ]);

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: Date.now(),
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instruction: "",
      },
    ]);
  };

  const removeMedication = (id: number) => {
    if (medications.length > 1) {
      setMedications((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb & Header */}
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
                Tạo và xuất đơn thuốc điện tử cho bệnh nhân.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-brand-dark shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-[0.98]">
                <FloppyDisk size={15} />
                Lưu nháp
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98]">
                <Printer size={15} />
                Lưu & Xuất PDF
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Thông tin chẩn đoán */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-brand-dark">
              1. Thông tin chẩn đoán
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">
                  Bệnh nhân <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">-- Chọn bệnh nhân --</option>
                  <option value="pt-001">Nguyễn Văn A — BN-2001</option>
                  <option value="pt-002">Trần Thị B — BN-2002</option>
                  <option value="pt-003">Phạm Dũng — BN-2003</option>
                  <option value="pt-004">Hoàng Thị Oanh — BN-2004</option>
                  <option value="pt-005">Lê Minh Cường — BN-2005</option>
                  <option value="pt-006">Đỗ Thu Hà — BN-2006</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">
                  Lịch hẹn liên quan
                </label>
                <select className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">-- Chọn lịch hẹn --</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-brand-dark">
                  Chẩn đoán lâm sàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: [K04.0] Viêm tủy không hồi phục răng 38..."
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-brand-dark">
                  Ghi chú đơn thuốc
                </label>
                <textarea
                  rows={2}
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
                      key={med.id}
                      className="group transition-colors hover:bg-slate-50/50"
                    >
                      <td className="py-2.5 pr-2 text-center text-xs font-medium text-muted-foreground/70">
                        {index + 1}
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          placeholder="Paracetamol 500mg"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          placeholder="500mg"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          placeholder="3 lần/ngày"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          placeholder="5 ngày"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          placeholder="Uống sau ăn"
                          className="w-full rounded-lg border-transparent bg-slate-50/80 px-3 py-2 text-sm text-brand-dark outline-none placeholder:text-muted-foreground/50 transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => removeMedication(med.id)}
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
