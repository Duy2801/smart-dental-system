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

const ArrowDownUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
);

// --- MOCK DATA ---
const MOCK_PATIENTS = [
  { id: "BN-2026-001", name: "Nguyễn Văn An", phone: "0901234567", gender: "Nam", age: 32, lastVisit: "27/06/2026", debt: 0, group: "Thường xuyên" },
  { id: "BN-2026-002", name: "Lê Thị Bích Hạnh", phone: "0987654321", gender: "Nữ", age: 25, lastVisit: "26/06/2026", debt: 1500000, group: "Niềng răng" },
  { id: "BN-2026-003", name: "Trần Minh Tùng", phone: "0911223344", gender: "Nam", age: 45, lastVisit: "15/05/2026", debt: 0, group: "Mới" },
  { id: "BN-2026-004", name: "Phạm Hoàng Oanh", phone: "0933445566", gender: "Nữ", age: 28, lastVisit: "10/06/2026", debt: 500000, group: "Bọc sứ" },
  { id: "BN-2026-005", name: "Vũ Hải Đăng", phone: "0977889900", gender: "Nam", age: 15, lastVisit: "27/06/2026", debt: 0, group: "Trẻ em" },
  { id: "BN-2026-006", name: "Đinh Phương Thảo", phone: "0922334455", gender: "Nữ", age: 38, lastVisit: "02/04/2026", debt: 0, group: "Thường xuyên" },
];

export default function ReceptionistPatientsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Hồ sơ Bệnh nhân</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quản lý danh sách, thông tin liên lạc và lịch sử khám bệnh.</p>
          </div>
          <Link href="/receptionist/patients/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-dark">
            <UserPlusIcon className="h-4 w-4" />
            Thêm bệnh nhân mới
          </Link>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Tổng số bệnh nhân</p>
            <p className="mt-2 text-2xl font-bold text-foreground">1,248</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Khách hàng mới (Tháng này)</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">+85</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Có lịch hẹn hôm nay</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">24</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Tổng công nợ cần thu</p>
            <p className="mt-2 text-2xl font-bold text-red-600">42,500,000đ</p>
          </div>
        </div>

        {/* --- FILTERS & TOOLBAR --- */}
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm bệnh nhân (Tên, SĐT, Mã HS)..."
                className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                <option value="">Tất cả nhóm khách</option>
                <option value="moi">Khách mới</option>
                <option value="thuong_xuyen">Thường xuyên</option>
                <option value="vip">VIP</option>
              </select>

              <select className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                <option value="">Trạng thái công nợ</option>
                <option value="co_no">Có công nợ</option>
                <option value="khong_no">Không nợ</option>
              </select>

              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50">
                <ArrowDownUpIcon className="h-4 w-4 text-muted-foreground" />
                Sắp xếp
              </button>

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
                  <th className="px-6 py-4">Mã HS / Họ và tên</th>
                  <th className="px-6 py-4">Thông tin</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Lần khám cuối</th>
                  <th className="px-6 py-4">Công nợ</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {MOCK_PATIENTS.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-slate-50/50 group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-muted-foreground mb-1">{patient.id}</div>
                      <div className="font-bold text-brand-dark flex items-center gap-2">
                        {patient.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{patient.gender}, {patient.age} tuổi</div>
                      <div className="mt-1">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">{patient.group}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-foreground">{patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {patient.lastVisit}
                    </td>
                    <td className="px-6 py-4">
                      {patient.debt > 0 ? (
                        <span className="font-bold text-red-600">{patient.debt.toLocaleString()}đ</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="rounded bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand hover:text-white transition-colors">
                          Chi tiết
                        </button>
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
              Hiển thị <span className="font-bold text-foreground">1-6</span> trên tổng số <span className="font-bold text-foreground">1,248</span> bệnh nhân
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
