"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";

// --- INLINE SVGS ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);
const MoreHorizontalIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);

// --- MOCK DATA ---
const MOCK_PATIENTS = [
  { id: "BN-23001", name: "Nguyễn Văn An", phone: "0901234567", dob: "12/05/1990", gender: "MALE", lastVisit: "20/06/2026", medicalAlerts: ["Cao huyết áp", "Dị ứng Penicillin"], totalVisits: 5, avatarColor: "bg-blue-100 text-blue-700 ring-blue-600/20" },
  { id: "BN-23002", name: "Trần Thị Bé", phone: "0911223344", dob: "08/11/1995", gender: "FEMALE", lastVisit: "Hôm nay", medicalAlerts: [], totalVisits: 2, avatarColor: "bg-pink-100 text-pink-700 ring-pink-600/20" },
  { id: "BN-23003", name: "Lê Hoàng Công", phone: "0987654321", dob: "25/01/1985", gender: "MALE", lastVisit: "Chưa khám", medicalAlerts: ["Máu khó đông"], totalVisits: 0, avatarColor: "bg-amber-100 text-amber-700 ring-amber-600/20" },
  { id: "BN-23004", name: "Đỗ Thu Hà", phone: "0977889900", dob: "14/09/2000", gender: "FEMALE", lastVisit: "15/06/2026", medicalAlerts: [], totalVisits: 12, avatarColor: "bg-emerald-100 text-emerald-700 ring-emerald-600/20" },
  { id: "BN-23005", name: "Phạm Văn Dũng", phone: "0933445566", dob: "02/03/1980", gender: "MALE", lastVisit: "01/05/2026", medicalAlerts: ["Tiểu đường Type 2"], totalVisits: 8, avatarColor: "bg-indigo-100 text-indigo-700 ring-indigo-600/20" },
];

export default function ReceptionistPatientsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Quản lý Bệnh nhân</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tra cứu hồ sơ, lịch sử điều trị và thông tin y tế của khách hàng.</p>
          </div>
          <Link href="/receptionist/patients/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]">
            <UserPlusIcon className="h-4 w-4" />
            + Bệnh Nhân Mới
          </Link>
        </div>

        {/* --- FILTERS & TOOLBAR (Sticky) --- */}
        <div className="sticky top-0 z-10 rounded-2xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Search */}
            <div className="relative flex-1 max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nhập tên, số điện thoại, hoặc mã bệnh nhân (VD: BN-23001)..."
                className="w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none shadow-sm transition-all focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer">
                <option value="">Phân loại Nhóm khách</option>
                <option value="NEW">Khách mới chưa khám</option>
                <option value="RETURNING">Đang điều trị</option>
                <option value="VIP">Khách VIP (Niềng răng/Implant)</option>
              </select>

              {/* Lọc nâng cao (Advanced Filter) */}
              <div className="relative group/filter">
                <button className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.95]">
                  <FilterIcon className="h-5 w-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 hidden w-64 flex-col rounded-2xl border border-border bg-white p-4 shadow-xl group-hover/filter:flex z-30">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Lọc nâng cao</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900">Tiền sử bệnh lý (Alerts)</label>
                      <select className="w-full rounded-lg border border-border bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer">
                        <option>Tất cả</option>
                        <option>Có cảnh báo Y tế</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <button className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                      Xóa lọc
                    </button>
                    <button className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-dark transition-all">
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- HIGH-DENSITY DATA TABLE --- */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-border bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Bệnh Nhân</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4 w-64">Cảnh báo Y tế</th>
                  <th className="px-6 py-4">Tương tác cuối</th>
                  <th className="px-6 py-4 text-center">Số Ca Khám</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {MOCK_PATIENTS.map((patient, idx) => (
                  <tr key={patient.id} className={cn("group transition-colors hover:bg-slate-50", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                    
                    {/* Patient Name & Avatar */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-inset", patient.avatarColor)}>
                          {patient.name.split(" ").pop()?.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/receptionist/patients/${patient.id}`} className="font-bold text-slate-900 hover:text-brand hover:underline underline-offset-2 transition-colors">
                            {patient.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-muted-foreground">{patient.id}</span>
                            <span className="text-[10px] text-muted-foreground border-l border-border pl-2">{patient.gender === 'MALE' ? 'Nam' : 'Nữ'} • {patient.dob}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Contact */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 pt-1">
                        <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{patient.phone}</span>
                      </div>
                    </td>
                    
                    {/* Medical Alerts */}
                    <td className="px-6 py-4 align-top whitespace-normal">
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {patient.medicalAlerts.length > 0 ? (
                          patient.medicalAlerts.map((alert, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/20">
                              <HeartIcon className="h-3 w-3" /> {alert}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Không có ghi nhận</span>
                        )}
                      </div>
                    </td>
                    
                    {/* Last Visit */}
                    <td className="px-6 py-4 align-top">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset pt-1 mt-1", 
                        patient.lastVisit === "Hôm nay" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : 
                        patient.lastVisit === "Chưa khám" ? "bg-slate-100 text-slate-600 ring-slate-500/20" : 
                        "bg-transparent text-slate-700 ring-transparent"
                      )}>
                        {patient.lastVisit}
                      </span>
                    </td>

                    {/* Total Visits */}
                    <td className="px-6 py-4 align-top text-center pt-5">
                      <span className="font-mono font-bold text-slate-900">{patient.totalVisits}</span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 align-top text-right pt-3.5">
                      <div className="flex items-center justify-end gap-3 h-full">
                        <Link href="/receptionist/appointments/new" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-brand active:scale-[0.95]">
                          + Lịch
                        </Link>
                        
                        <div className="relative group/menu">
                          <button className="p-1.5 text-muted-foreground hover:bg-slate-200 hover:text-slate-900 transition-colors rounded-md active:scale-[0.95]">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>
                          
                          <div className="absolute right-0 top-full mt-1 hidden w-40 flex-col rounded-xl border border-border bg-white p-1.5 shadow-lg group-hover/menu:flex z-20">
                            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left">
                              Xem Hồ Sơ Bệnh Án
                            </button>
                            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left">
                              Chỉnh sửa thông tin
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-slate-50/50">
            <span className="text-sm font-medium text-muted-foreground">
              Hiển thị <span className="font-bold text-slate-900">1-5</span> trên tổng số <span className="font-bold text-slate-900">1,248</span> bệnh nhân
            </span>
            <div className="flex items-center gap-1.5">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 disabled:opacity-30">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand bg-brand text-white font-bold shadow-sm">
                1
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900">
                2
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900">
                3
              </button>
              <span className="px-1 text-muted-foreground">...</span>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900">
                25
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
