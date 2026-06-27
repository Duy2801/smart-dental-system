"use client";

import React, { useState } from "react";
import Link from "next/link";

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

// --- MOCK DATA ---
const MOCK_APPOINTMENTS = [
  { id: "AP-1001", time: "08:00 - 08:30", name: "Nguyễn Văn A", phone: "0901234567", service: "Nhổ răng khôn", doctor: "BS. Trần Sơn", status: "Hoàn thành", isNew: true },
  { id: "AP-1002", time: "09:00 - 10:00", name: "Lê Hoàng C", phone: "0987654321", service: "Tái khám niềng răng", doctor: "BS. Phạm Hà", status: "Đang chờ", isNew: false },
  { id: "AP-1003", time: "10:30 - 11:30", name: "Đỗ Thu H", phone: "0977889900", service: "Khám tổng quát", doctor: "BS. Lê Hoàng", status: "Sắp tới", isNew: true },
  { id: "AP-1004", time: "11:00 - 12:00", name: "Hoàng Minh Q", phone: "0933445566", service: "Cắm Implant", doctor: "BS. Trần Sơn", status: "Sắp tới", isNew: false },
  { id: "AP-1005", time: "13:30 - 14:30", name: "Trần Thị B", phone: "0911223344", service: "Tẩy trắng răng", doctor: "BS. Phạm Hà", status: "Hủy", isNew: false },
  { id: "AP-1006", time: "15:00 - 16:00", name: "Lý Quí D", phone: "0922334455", service: "Bọc răng sứ", doctor: "BS. Lê Hoàng", status: "Vắng mặt", isNew: false },
];

export default function ReceptionistAppointmentsPage() {
  const [currentDate, setCurrentDate] = useState("Hôm nay, 27/06");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hoàn thành": return <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">Hoàn thành</span>;
      case "Đang chờ": return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">Phòng chờ</span>;
      case "Sắp tới": return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Sắp tới</span>;
      case "Vắng mặt": return <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/10">Vắng mặt</span>;
      case "Hủy": return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/10">Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Quản lý Lịch hẹn</h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi và sắp xếp lịch khám cho toàn bộ phòng khám.</p>
          </div>
          <Link href="/receptionist/appointments/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-dark">
            <CalendarPlusIcon className="h-4 w-4" />
            Tạo lịch hẹn mới
          </Link>
        </div>

        {/* --- FILTERS & TOOLBAR --- */}
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm tên bệnh nhân, SĐT, mã lịch hẹn..."
                className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-border bg-slate-50/50 p-1">
                <button className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm">Hôm qua</button>
                <button className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-brand shadow-sm ring-1 ring-border">Hôm nay</button>
                <button className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm">Ngày mai</button>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                27/06/2026
              </button>

              <select className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                <option value="">Tất cả bác sĩ</option>
                <option value="BS. Trần Sơn">BS. Trần Sơn</option>
                <option value="BS. Lê Hoàng">BS. Lê Hoàng</option>
                <option value="BS. Phạm Hà">BS. Phạm Hà</option>
              </select>

              <button className="inline-flex items-center justify-center rounded-lg border border-border bg-slate-50 p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground">
                <FilterIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Mã lịch / Thời gian</th>
                  <th className="px-6 py-4">Bệnh nhân</th>
                  <th className="px-6 py-4">Dịch vụ</th>
                  <th className="px-6 py-4">Bác sĩ phụ trách</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {MOCK_APPOINTMENTS.map((apt) => (
                  <tr key={apt.id} className="transition-colors hover:bg-slate-50/50 group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-muted-foreground mb-1">{apt.id}</div>
                      <div className="font-bold text-brand-dark">{apt.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground">{apt.name}</span>
                        {apt.isNew && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">Khách mới</span>}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{apt.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{apt.service}</td>
                    <td className="px-6 py-4 text-muted-foreground">{apt.doctor}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(apt.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === "Sắp tới" && (
                          <button className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                            Check-in
                          </button>
                        )}
                        <button className="rounded p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-slate-50/30">
            <span className="text-sm text-muted-foreground">
              Hiển thị <span className="font-bold text-foreground">1-6</span> trên tổng số <span className="font-bold text-foreground">24</span> lịch hẹn
            </span>
            <div className="flex items-center gap-1">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-slate-50 disabled:opacity-50">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-brand text-white font-medium">
                1
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-slate-50">
                2
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-slate-50">
                3
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-slate-50 disabled:opacity-50">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
