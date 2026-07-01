"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";

// Inline SVGs
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const SaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export default function NewTreatmentPlanPage() {
  const [phases, setPhases] = useState([
    { id: 1, service: "", tooth: "", date: "", status: "PENDING" },
  ]);

  const addPhase = () => {
    setPhases([...phases, { id: Date.now(), service: "", tooth: "", date: "", status: "PENDING" }]);
  };

  const removePhase = (id: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter(p => p.id !== id));
    }
  };

  const toggleStatus = (id: number) => {
    setPhases(phases.map(p => {
      if (p.id === id) return { ...p, status: p.status === "PENDING" ? "COMPLETED" : "PENDING" };
      return p;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6 space-y-4">
          <Link href="/doctor/treatment-plans" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark">
            <ArrowLeftIcon /> Quay lại danh sách
          </Link>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">Lập Kế hoạch Điều trị</h1>
              <p className="mt-1 text-sm text-muted-foreground">Xây dựng lộ trình (phases) cho các dịch vụ phức tạp.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-brand-dark shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-[0.98]">
                Lưu nháp
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98]">
                <SaveIcon className="h-4 w-4" /> Kích hoạt Kế hoạch
              </button>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-8">
          
          {/* 1. Thông tin tổng quan (treatment_plans) */}
          <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
            <h2 className="mb-6 text-base font-semibold text-brand-dark">1. Thông tin Tổng quát</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Bệnh nhân <span className="text-red-500">*</span></label>
                <select className="w-full rounded-lg border-transparent bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none font-medium">
                  <option value="">-- Chọn bệnh nhân từ Hồ sơ --</option>
                  <option value="1">Lê Hoàng C - 0987654321</option>
                  <option value="2">Nguyễn Văn A - 0901234567</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">Ngày bắt đầu dự kiến</label>
                <input type="date" className="w-full rounded-lg border-transparent bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">Ngày kết thúc dự kiến</label>
                <input type="date" className="w-full rounded-lg border-transparent bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none" />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Ghi chú lâm sàng chung</label>
                <textarea 
                  rows={2} 
                  placeholder="Ví dụ: Kế hoạch niềng răng mắc cài kim loại, dự kiến nhổ 4 răng 4..." 
                  className="w-full rounded-lg border-transparent bg-slate-50 px-4 py-2.5 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none resize-y" 
                />
              </div>
            </div>
          </div>

          {/* 2. Trình xây dựng Giai đoạn (Phases Builder) */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-border bg-slate-50/50 p-6">
              <h2 className="text-base font-semibold text-brand-dark">2. Trình Xây dựng Giai đoạn (Phases Builder)</h2>
              <p className="text-sm text-muted-foreground mt-1">Lập danh sách các bước điều trị theo trình tự thời gian (Milestones).</p>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="relative border-l-2 border-muted ml-3 md:ml-4 space-y-8 pb-4">
                
                {phases.map((phase, index) => {
                  const isCompleted = phase.status === "COMPLETED";
                  return (
                    <div key={phase.id} className="relative pl-8 group">
                      
                      {/* Timeline Dot (Status Indicator) */}
                      <button 
                        onClick={() => toggleStatus(phase.id)}
                        className={cn(
                          "absolute -left-[11px] top-4 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white transition-all cursor-pointer active:scale-95",
                          isCompleted ? "bg-green-500 text-white" : "bg-muted-foreground/30 hover:bg-brand text-transparent hover:text-white"
                        )}
                        title={isCompleted ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                      >
                        <CheckIcon className="w-3 h-3" />
                      </button>
                      
                      <div className={cn("p-5 rounded-xl border transition-all duration-200 bg-white", isCompleted ? "border-green-200 shadow-sm" : "border-border shadow-sm hover:border-brand/30 hover:shadow-md")}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={cn("text-sm font-bold uppercase tracking-wider", isCompleted ? "text-green-700" : "text-brand-dark")}>
                            Giai đoạn {index + 1} {isCompleted && "✓"}
                          </h3>
                          <button 
                            onClick={() => removePhase(phase.id)}
                            disabled={phases.length === 1}
                            className="text-muted-foreground opacity-30 group-hover:opacity-100 hover:text-red-600 disabled:opacity-0 transition-opacity p-1 rounded"
                            title="Xóa giai đoạn"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-12">
                          <div className="md:col-span-6 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-900">Dịch vụ (Service) <span className="text-red-500">*</span></label>
                            <select className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none">
                              <option value="">Chọn dịch vụ...</option>
                              <option value="1">Khám tổng quát</option>
                              <option value="2">Cắm trụ Implant</option>
                              <option value="3">Gắn Abutment & Mão sứ</option>
                              <option value="4">Nhổ răng khôn</option>
                              <option value="5">Siết mắc cài định kỳ</option>
                            </select>
                          </div>
                          
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-900">Vị trí Răng</label>
                            <input 
                              type="text" 
                              placeholder="VD: R46, R47" 
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 font-mono text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none" 
                            />
                          </div>
                          
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-900">Ngày hẹn kiến</label>
                            <input 
                              type="date" 
                              className="w-full rounded-lg border-transparent bg-slate-50 px-3 py-2 text-sm text-brand-dark outline-none transition-all focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand shadow-none" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Nút thêm giai đoạn (Dashed box) */}
                <div className="relative pl-8 pt-2">
                  <button 
                    onClick={addPhase}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-all hover:border-brand hover:text-brand hover:bg-brand/5 active:scale-[0.99]"
                  >
                    <PlusIcon className="h-5 w-5" /> Thêm Bước điều trị mới
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
