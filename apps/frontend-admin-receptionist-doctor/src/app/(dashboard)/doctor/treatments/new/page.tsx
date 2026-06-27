"use client";

import React, { useState } from "react";
import Link from "next/link";

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

export default function NewTreatmentPage() {
  const [phases, setPhases] = useState([
    { id: 1, name: "Giai đoạn 1: Khám và chuẩn bị", time: "", details: "" },
    { id: 2, name: "Giai đoạn 2: Tiến hành điều trị", time: "", details: "" }
  ]);

  const addPhase = () => {
    setPhases([...phases, { id: Date.now(), name: `Giai đoạn ${phases.length + 1}: `, time: "", details: "" }]);
  };

  const removePhase = (id: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6 space-y-4">
          <Link href="/doctor/treatments" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeftIcon /> Quay lại danh sách
          </Link>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">Tạo kế hoạch điều trị</h1>
              <p className="mt-1 text-sm text-muted-foreground">Lên phác đồ và lộ trình điều trị chi tiết cho bệnh nhân.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50">
                Hủy bỏ
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark">
                <SaveIcon className="h-4 w-4" /> Lưu phác đồ
              </button>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-6">
          
          {/* Thông tin tổng quan */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">1. Thông tin tổng quan</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-brand-dark">Tên phác đồ / Kế hoạch <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ví dụ: Kế hoạch Niềng răng mắc cài kim loại - Giai đoạn 1" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">Bệnh nhân <span className="text-red-500">*</span></label>
                <select className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">-- Chọn bệnh nhân --</option>
                  <option value="1">Lê Hoàng C - 0987654321</option>
                  <option value="2">Nguyễn Văn A - 0901234567</option>
                  <option value="3">Phạm Thị D - 0911223344</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">Thời gian dự kiến hoàn thành</label>
                <input type="text" placeholder="Ví dụ: 18 tháng, hoặc 4 tuần..." className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
            </div>
          </div>

          {/* Lộ trình điều trị */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">2. Lộ trình điều trị chi tiết</h2>
            </div>
            
            <div className="space-y-4">
              {phases.map((phase, index) => (
                <div key={phase.id} className="relative rounded-lg border border-border/80 bg-slate-50/50 p-5 transition-colors hover:border-brand/30">
                  
                  {/* Dấu gạch chéo xóa */}
                  <div className="absolute right-4 top-4">
                    <button 
                      onClick={() => removePhase(phase.id)}
                      disabled={phases.length === 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-red-100 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      title="Xóa giai đoạn này"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2 pr-8">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên buổi / Giai đoạn</label>
                      <input 
                        type="text" 
                        defaultValue={phase.name}
                        placeholder="Ví dụ: Buổi 1 - Gắn mắc cài hàm trên" 
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand font-medium" 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thời gian dự kiến</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: Tuần 1, hoặc 15/07" 
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" 
                      />
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chi tiết thực hiện</label>
                      <textarea 
                        rows={2}
                        placeholder="Mô tả các thao tác lâm sàng, vật liệu sử dụng..." 
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-y" 
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <button 
                onClick={addPhase}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-brand px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
              >
                <PlusIcon className="h-4 w-4" /> Thêm giai đoạn / buổi khám
              </button>
            </div>
          </div>

          {/* Ghi chú nội bộ */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">3. Ghi chú nội bộ (Private Notes)</h2>
            <p className="mb-3 text-xs text-muted-foreground">Chỉ bác sĩ và quản lý mới thấy ghi chú này. Bệnh nhân không thể xem.</p>
            <textarea 
              rows={3}
              placeholder="Nhập lưu ý nội bộ (ví dụ: cần xin ý kiến chuyên gia, tiên lượng khó...)"
              className="w-full rounded-md border border-amber-200 bg-amber-50/30 px-3 py-2 text-sm text-amber-900 outline-none transition-colors focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-y"
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
