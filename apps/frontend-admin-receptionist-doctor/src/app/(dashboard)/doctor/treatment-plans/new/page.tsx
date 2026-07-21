"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  Plus,
  Trash,
  Check,
  FloppyDisk,
  Lightning,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";

type Phase = {
  id: number;
  title: string;
  targetTooth: string;
  estimatedCost: string;
  expectedDate: string;
  description: string;
  status: "PENDING" | "COMPLETED";
};

export default function NewTreatmentPlanPage() {
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: 1,
      title: "",
      targetTooth: "",
      estimatedCost: "",
      expectedDate: "",
      description: "",
      status: "PENDING",
    },
  ]);

  const addPhase = () => {
    setPhases((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        targetTooth: "",
        estimatedCost: "",
        expectedDate: "",
        description: "",
        status: "PENDING",
      },
    ]);
  };

  const removePhase = (id: number) => {
    if (phases.length > 1) {
      setPhases((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const toggleStatus = (id: number) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "PENDING" ? "COMPLETED" : "PENDING" }
          : p,
      ),
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPhases((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === phases.length - 1) return;
    setPhases((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb & Header */}
        <div className="mb-6 space-y-4">
          <Link
            href="/doctor/treatment-plans"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">
                Lập kế hoạch điều trị
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Xây dựng lộ trình các bước điều trị theo trình tự.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-brand-dark shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-[0.98]">
                <FloppyDisk size={15} />
                Lưu nháp
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98]">
                <Lightning size={15} weight="fill" />
                Kích hoạt
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. Thông tin tổng quát */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-base font-semibold text-brand-dark">
              1. Thông tin tổng quát
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">
                  Tên kế hoạch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Niềng răng mắc cài kim loại..."
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm font-medium text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">
                  Bệnh nhân <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm font-medium text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand">
                  <option value="">-- Chọn bệnh nhân --</option>
                  <option value="pt-001">Nguyễn Văn A — BN-2001</option>
                  <option value="pt-002">Trần Thị B — BN-2002</option>
                  <option value="pt-003">Phạm Dũng — BN-2003</option>
                  <option value="pt-006">Đỗ Thu Hà — BN-2006</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Ngày kết thúc dự kiến
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Hình thức thanh toán
                </label>
                <select className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm font-medium text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand">
                  <option value="PAY_AT_COUNTER">Thanh toán tại quầy</option>
                  <option value="DEPOSIT_30_PERCENT">Đặt cọc 30%</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  % Đặt cọc
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="30"
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">
                  Mô tả tổng quát
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Kế hoạch niềng răng mắc cài kim loại, dự kiến nhổ 4 răng..."
                  className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* 2. Phases Builder */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border bg-slate-50/50 p-6">
              <h2 className="text-base font-semibold text-brand-dark">
                2. Trình xây dựng giai đoạn
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lập danh sách các bước điều trị theo trình tự thời gian.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="relative ml-3 space-y-8 border-l-2 border-muted pb-4 md:ml-4">
                {phases.map((phase, index) => {
                  const isCompleted = phase.status === "COMPLETED";
                  return (
                    <div key={phase.id} className="group relative pl-8">
                      <button
                        onClick={() => toggleStatus(phase.id)}
                        className={cn(
                          "absolute -left-[11px] top-4 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full ring-4 ring-white transition-all active:scale-95",
                          isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted-foreground/30 text-transparent hover:bg-brand hover:text-white",
                        )}
                        title="Đánh dấu hoàn thành"
                      >
                        <Check size={11} weight="bold" />
                      </button>

                      <div
                        className={cn(
                          "rounded-xl border p-5 shadow-sm transition-all duration-200",
                          isCompleted
                            ? "border-green-200 bg-green-50/30"
                            : "border-border bg-white hover:border-brand/30 hover:shadow-md",
                        )}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3
                            className={cn(
                              "text-sm font-bold uppercase tracking-wider",
                              isCompleted
                                ? "text-green-700"
                                : "text-brand-dark",
                            )}
                          >
                            Bước {index + 1}
                            {isCompleted && " ✓"}
                          </h3>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted disabled:opacity-0"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => moveDown(index)}
                              disabled={index === phases.length - 1}
                              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted disabled:opacity-0"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => removePhase(phase.id)}
                              disabled={phases.length === 1}
                              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 disabled:opacity-0"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-12">
                          <div className="space-y-1.5 md:col-span-6">
                            <label className="text-xs font-semibold text-slate-900">
                              Tên bước <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Ví dụ: Cắm trụ Implant"
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-3">
                            <label className="text-xs font-semibold text-slate-900">
                              Vị trí răng
                            </label>
                            <input
                              type="text"
                              placeholder="R46, R47"
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 font-mono text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-3">
                            <label className="text-xs font-semibold text-slate-900">
                              Ngày dự kiến
                            </label>
                            <input
                              type="date"
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-6">
                            <label className="text-xs font-semibold text-slate-900">
                              Mô tả bước
                            </label>
                            <input
                              type="text"
                              placeholder="Mô tả ngắn..."
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-6">
                            <label className="text-xs font-semibold text-slate-900">
                              Chi phí ước tính (VNĐ)
                            </label>
                            <input
                              type="number"
                              placeholder="5,000,000"
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="relative pl-8 pt-2">
                  <button
                    onClick={addPhase}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-all hover:border-brand hover:bg-brand/5 hover:text-brand active:scale-[0.99]"
                  >
                    <Plus size={18} weight="bold" />
                    Thêm bước điều trị mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
