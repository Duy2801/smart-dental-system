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
const CalendarPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>
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
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
);
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

// --- MOCK DATA ---
const MOCK_APPOINTMENTS = [
  { id: "AP-1001", time: "08:00 - 08:30", name: "Nguyễn Văn A", phone: "0901234567", service: "Nhổ răng khôn", doctor: "BS. Trần Sơn", status: "COMPLETED", isNew: true },
  { id: "AP-1002", time: "09:00 - 10:00", name: "Lê Hoàng C", phone: "0987654321", service: "Tái khám niềng răng", doctor: "BS. Phạm Hà", status: "WAITING", isNew: false },
  { id: "AP-1003", time: "10:30 - 11:30", name: "Đỗ Thu H", phone: "0977889900", service: "Khám tổng quát", doctor: "BS. Lê Hoàng", status: "PENDING", isNew: true },
  { id: "AP-1004", time: "11:00 - 12:00", name: "Hoàng Minh Q", phone: "0933445566", service: "Cắm Implant", doctor: "BS. Trần Sơn", status: "PENDING", isNew: false },
  { id: "AP-1005", time: "13:30 - 14:30", name: "Trần Thị B", phone: "0911223344", service: "Tẩy trắng răng", doctor: "BS. Phạm Hà", status: "CANCELLED", isNew: false },
  { id: "AP-1006", time: "15:00 - 16:00", name: "Lý Quí D", phone: "0922334455", service: "Bọc răng sứ", doctor: "BS. Lê Hoàng", status: "NO_SHOW", isNew: false },
];

export default function ReceptionistAppointmentsPage() {
  const [currentDate, setCurrentDate] = useState("Hôm nay, 27/06");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Hoàn thành</span>;
      case "WAITING": return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20">Đã Check-in</span>;
      case "PENDING": return <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-600/20">Chờ xác nhận</span>;
      case "NO_SHOW": return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/10">Vắng mặt</span>;
      case "CANCELLED": return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-inset ring-slate-500/10">Đã hủy</span>;
      default: return null;
    }
  };

  const getDoctorBadge = (doctorName: string) => {
    // Generate different colors based on doctor name for visual distinction
    if (doctorName.includes("Sơn")) return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
    if (doctorName.includes("Hà")) return "bg-purple-50 text-purple-700 ring-purple-600/20";
    return "bg-cyan-50 text-cyan-700 ring-cyan-600/20";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Quản lý Lịch hẹn (Toàn phòng khám)</h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi, điều phối và chèn lịch cho tất cả Bác sĩ.</p>
          </div>
          <Link href="/receptionist/appointments/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]">
            <CalendarPlusIcon className="h-4 w-4" />
            + Lịch Hẹn / Walk-in
          </Link>
        </div>

        {/* --- FILTERS & TOOLBAR (Sticky) --- */}
        <div className="sticky top-0 z-10 rounded-2xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm tên bệnh nhân, SĐT, mã lịch hẹn..."
                className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border bg-slate-50 p-1">
                <button className="rounded-lg px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-slate-900">Hôm qua</button>
                <button className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-brand shadow-sm ring-1 ring-border">Hôm nay</button>
                <button className="rounded-lg px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-slate-900">Ngày mai</button>
              </div>

              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]">
                <CalendarIcon className="h-4 w-4 text-brand" />
                27/06/2026
              </button>

              <select className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none shadow-sm transition-all focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer">
                <option value="">Tất cả bác sĩ</option>
                <option value="BS. Trần Sơn">BS. Trần Sơn</option>
                <option value="BS. Lê Hoàng">BS. Lê Hoàng</option>
                <option value="BS. Phạm Hà">BS. Phạm Hà</option>
              </select>

              {/* Lọc nâng cao (Advanced Filter) */}
              <div className="relative group/filter">
                <button className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.95]">
                  <FilterIcon className="h-4 w-4" />
                </button>
                
                <div className="absolute right-0 top-full mt-2 hidden w-64 flex-col rounded-2xl border border-border bg-white p-4 shadow-xl group-hover/filter:flex z-30">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Lọc nâng cao</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900">Trạng thái Lịch hẹn</label>
                      <select className="w-full rounded-lg border border-border bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer transition-colors hover:bg-slate-50">
                        <option>Tất cả trạng thái</option>
                        <option>Chờ xác nhận (Pending)</option>
                        <option>Đã Check-in (Waiting)</option>
                        <option>Hoàn thành (Completed)</option>
                        <option>Đã Hủy / Vắng mặt</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900">Phân loại Bệnh nhân</label>
                      <div className="flex items-center gap-2">
                        <label className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                          <input type="checkbox" className="h-3 w-3 rounded text-brand focus:ring-brand" defaultChecked />
                          <span className="text-[11px] font-bold text-slate-700">Khách mới</span>
                        </label>
                        <label className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                          <input type="checkbox" className="h-3 w-3 rounded text-brand focus:ring-brand" defaultChecked />
                          <span className="text-[11px] font-bold text-slate-700">Tái khám</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <button className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                      Xóa lọc
                    </button>
                    <button className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-dark transition-all active:scale-[0.95]">
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
                  <th className="px-6 py-4 w-40">Mã Lịch / Thời Gian</th>
                  <th className="px-6 py-4">Bệnh Nhân</th>
                  <th className="px-6 py-4">Dịch Vụ</th>
                  <th className="px-6 py-4">Bác Sĩ</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {MOCK_APPOINTMENTS.map((apt, idx) => (
                  <tr key={apt.id} className={cn("group transition-colors hover:bg-slate-50", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                    
                    {/* Time */}
                    <td className="px-6 py-4 align-top">
                      <div className="font-mono text-[10px] text-muted-foreground mb-0.5">{apt.id}</div>
                      <div className="font-mono text-[13px] font-bold text-slate-900">{apt.time}</div>
                    </td>
                    
                    {/* Patient */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{apt.name}</span>
                        {apt.isNew && <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand ring-1 ring-inset ring-brand/20">Khách mới</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <PhoneIcon className="h-3 w-3" />
                        <span className="font-mono opacity-80">{apt.phone}</span>
                      </div>
                    </td>
                    
                    {/* Service */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {apt.service}
                      </div>
                    </td>
                    
                    {/* Doctor */}
                    <td className="px-6 py-4 align-top">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset", getDoctorBadge(apt.doctor))}>
                        {apt.doctor}
                      </span>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 align-top">
                      {getStatusBadge(apt.status)}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-3 h-full">
                        
                        {/* Hover Edit Action */}
                        <Link href="/receptionist/appointments/new" className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:bg-slate-200 hover:text-slate-900" title="Chỉnh sửa lịch">
                          <EditIcon className="h-4 w-4" />
                        </Link>

                        {/* Primary Inline Action based on status */}
                        {apt.status === "PENDING" && (
                          <button className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.95]">
                            <PhoneIcon className="h-3.5 w-3.5" /> Gọi Xác Nhận
                          </button>
                        )}
                        {apt.status === "WAITING" && (
                          <Link href="/receptionist/check-in" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.95]">
                            Check-in
                          </Link>
                        )}
                        
                        {/* More Options Menu (3 dots) */}
                        <div className="relative group/menu">
                          <button className="p-1.5 text-muted-foreground hover:bg-slate-200 hover:text-slate-900 transition-colors rounded-md active:scale-[0.95]">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>
                          
                          {/* Dropdown Menu (Hiển thị khi hover) */}
                          <div className="absolute right-0 top-full mt-1 hidden w-44 flex-col rounded-xl border border-border bg-white p-1.5 shadow-lg group-hover/menu:flex z-20">
                            <Link href="/receptionist/patients/new" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left">
                              Xem Hồ sơ Khách
                            </Link>
                            <Link href="/receptionist/appointments/new" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left">
                              Dời lịch hẹn
                            </Link>
                            <div className="my-1 mx-2 h-px bg-slate-100"></div>
                            {apt.status !== "CANCELLED" && (
                              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left">
                                Khách báo hủy
                              </button>
                            )}
                            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left">
                              Đánh dấu Vắng mặt
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
              Hiển thị <span className="font-bold text-slate-900">1-6</span> trên tổng số <span className="font-bold text-slate-900">24</span> lịch hẹn
            </span>
            <div className="flex items-center gap-1.5">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand bg-brand text-white font-bold shadow-sm">
                1
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900 transition-colors">
                2
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
