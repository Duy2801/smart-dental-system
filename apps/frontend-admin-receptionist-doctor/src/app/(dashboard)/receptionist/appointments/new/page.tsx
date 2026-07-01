"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";

// --- INLINE SVGS ---
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

// --- MOCK DATA ---
const DOCTORS = [
  { id: "D1", name: "BS. Trần Sơn", spec: "Tiểu phẫu / Implant", status: "AVAILABLE" },
  { id: "D2", name: "BS. Lê Hoàng", spec: "Tổng quát / Phục hình", status: "BUSY" },
  { id: "D3", name: "BS. Phạm Hà", spec: "Chỉnh nha", status: "AVAILABLE" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export default function NewAppointmentPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6 space-y-4">
          <Link href="/receptionist/appointments" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-dark">
            <ArrowLeftIcon /> Quay lại Lịch hẹn
          </Link>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">Tạo Lịch Hẹn Mới / Walk-in</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sắp xếp ca khám cho bệnh nhân mới hoặc tái khám.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-[0.98]">
                Hủy bỏ
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:bg-brand-dark hover:shadow-md active:scale-[0.98]">
                <CheckIcon className="h-4 w-4" /> Xác nhận Đặt lịch
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Main Form Area */}
          <div className="space-y-6 lg:col-span-8">
            
            {/* 1. Thông tin Bệnh nhân */}
            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900">1. Thông tin Bệnh nhân</h2>
                <button className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-dark transition-colors">
                  <UserPlusIcon className="h-4 w-4" /> Thêm mới nhanh
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tìm kiếm Khách hàng (Tên / SĐT) <span className="text-red-500">*</span></label>
                  <select className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 shadow-none cursor-pointer">
                    <option value="">-- Chọn hoặc gõ để tìm kiếm --</option>
                    <option value="1">Nguyễn Văn A - 0901234567 (BN Cũ)</option>
                    <option value="2">Trần Thị B - 0911223344 (BN Cũ)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Dịch vụ & Thời gian */}
            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900">2. Dịch vụ & Thời gian</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dịch vụ yêu cầu <span className="text-red-500">*</span></label>
                  <select className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 shadow-none cursor-pointer">
                    <option value="">-- Chọn nhóm dịch vụ --</option>
                    <option value="1">Khám tổng quát / Tư vấn</option>
                    <option value="2">Nhổ răng khôn / Tiểu phẫu</option>
                    <option value="3">Tái khám Niềng răng</option>
                    <option value="4">Cắm Implant</option>
                  </select>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ngày hẹn <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="date" 
                        defaultValue="2026-06-27"
                        className="w-full rounded-xl border-transparent bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 shadow-none" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trạng thái Check-in</label>
                    <select className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 shadow-none cursor-pointer">
                      <option value="PENDING">Chờ xác nhận (Đặt trước)</option>
                      <option value="WAITING">Đã đến nơi (Walk-in)</option>
                    </select>
                  </div>
                </div>

                {/* Khung chọn Giờ */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chọn Khung giờ (Dự kiến)</label>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "rounded-lg border py-2 text-xs font-bold font-mono transition-all active:scale-[0.95]",
                          selectedTime === time 
                            ? "border-brand bg-brand text-white shadow-md ring-1 ring-inset ring-brand-dark/20" 
                            : "border-border bg-white text-slate-700 hover:border-brand/50 hover:bg-slate-50"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Ghi chú */}
            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">3. Ghi chú cho Bác sĩ</h2>
              <textarea 
                rows={3} 
                placeholder="Ví dụ: Bệnh nhân sợ đau, yêu cầu bác sĩ làm nhẹ tay..." 
                className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 shadow-none resize-y" 
              />
            </div>

          </div>

          {/* Sidebar Area: Chọn Bác Sĩ */}
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sticky top-8">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Phân công Bác sĩ</h2>
              
              <div className="space-y-3">
                {DOCTORS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc.id)}
                    className={cn(
                      "w-full flex flex-col items-start gap-2 rounded-xl border p-4 transition-all text-left group active:scale-[0.99]",
                      selectedDoctor === doc.id
                        ? "border-brand bg-brand/5 shadow-sm ring-1 ring-inset ring-brand/20"
                        : "border-border bg-white hover:border-brand/50 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={cn("font-bold", selectedDoctor === doc.id ? "text-brand-dark" : "text-slate-900")}>
                        {doc.name}
                      </span>
                      <span className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        doc.status === "AVAILABLE" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"
                      )} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{doc.spec}</span>
                    
                    {doc.status === "AVAILABLE" ? (
                      <span className="mt-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Đang rảnh</span>
                    ) : (
                      <span className="mt-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Đang kẹt ca</span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-dashed border-border text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Lễ tân có thể xem xét trạng thái (Đang rảnh/Kẹt ca) để chèn khách Walk-in hợp lý.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
