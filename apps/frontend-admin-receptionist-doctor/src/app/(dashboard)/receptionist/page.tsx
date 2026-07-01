"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";

// --- INLINE SVGS ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);
const CalendarPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>
);
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const BellRingIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/></svg>
);
const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
);
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

// --- MOCK DATA ---
const MOCK_APPOINTMENTS = [
  { id: "AP01", time: "08:30", name: "Nguyễn Văn A", phone: "0901234567", service: "Nhổ răng khôn", doctor: "BS. Trần Sơn", status: "PENDING" },
  { id: "AP02", time: "09:00", name: "Lê Hoàng C", phone: "0987654321", service: "Tái khám niềng răng", doctor: "BS. Phạm Hà", status: "WAITING" },
  { id: "AP03", time: "10:30", name: "Đỗ Thu H", phone: "0977889900", service: "Khám tổng quát", doctor: "BS. Lê Hoàng", status: "IN_PROGRESS" },
  { id: "AP04", time: "11:00", name: "Hoàng Minh Q", phone: "0933445566", service: "Cắm Implant", doctor: "BS. Trần Sơn", status: "COMPLETED", invoicePending: true },
];

const MOCK_BILLING = [
  { id: "INV01", name: "Hoàng Minh Q", amount: "15,000,000", status: "UNPAID", time: "11:45" },
  { id: "INV02", name: "Trần Thị B", amount: "1,500,000", status: "UNPAID", time: "10:15" },
];

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'WAITING' | 'IN_PROGRESS'>('ALL');

  const filteredAppointments = MOCK_APPOINTMENTS.filter(apt => activeTab === 'ALL' || apt.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* --- 1. QUICK STATS ROW --- */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lịch hẹn hôm nay</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-bold text-brand-dark">24</span>
              <span className="text-sm font-medium text-brand mb-1">+5 lịch mới</span>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Chờ xác nhận</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-bold text-amber-600">3</span>
              <span className="text-sm font-medium text-amber-600/80 mb-1">Cần gọi điện</span>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-sm">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Khách đang chờ</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-bold text-blue-600">1</span>
              <span className="text-sm font-medium text-blue-600/80 mb-1">Đã Check-in</span>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-sm">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Chờ thanh toán</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-bold text-red-600">2</span>
              <span className="text-sm font-medium text-red-600/80 mb-1">Chưa thu tiền</span>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          
          {/* CỘT TRÁI (2/3): HÀNG CHỜ THỜI GIAN THỰC */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Thanh Tìm kiếm chung (Toolbar) */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tra cứu nhanh Bệnh nhân (Tên, SĐT, Mã hồ sơ)..."
                  className="w-full rounded-2xl border border-border bg-white py-3 pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* LIVE QUEUE LIST */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-slate-50/50 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-brand-dark">Hàng đợi Thời gian thực (Live Queue)</h2>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'PENDING', label: 'Chưa tới' },
                    { id: 'WAITING', label: 'Đã Check-in' },
                    { id: 'IN_PROGRESS', label: 'Đang khám' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px",
                        activeTab === tab.id 
                          ? "border-brand text-brand" 
                          : "border-transparent text-muted-foreground hover:text-brand-dark"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-border/50">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50">
                    
                    <div className="flex items-start gap-5">
                      <div className="flex flex-col items-center justify-center min-w-[50px] pt-1">
                        <span className="font-mono text-sm font-bold text-slate-900">{apt.time}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-brand-dark">{apt.name}</h3>
                          {apt.status === 'WAITING' && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20">Phòng chờ</span>}
                          {apt.status === 'IN_PROGRESS' && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 ring-1 ring-inset ring-purple-600/20">Đang khám</span>}
                          {apt.status === 'COMPLETED' && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Khám xong</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                          <span className="font-mono opacity-70">{apt.phone}</span>
                          <span className="flex items-center gap-1"><ActivityIcon className="h-3 w-3" /> {apt.service}</span>
                          <span className="text-slate-600">{apt.doctor}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex shrink-0 items-center justify-end gap-2 sm:w-[140px]">
                      {apt.status === 'PENDING' && (
                        <Link href="/receptionist/check-in" className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]">
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Check-in
                        </Link>
                      )}
                      {apt.status === 'WAITING' && (
                        <button className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-xs font-semibold text-brand-dark shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]">
                          <BellRingIcon className="h-3.5 w-3.5" /> Nhắc BS
                        </button>
                      )}
                      {apt.status === 'COMPLETED' && apt.invoicePending && (
                        <Link href="/receptionist/billing" className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.98] ring-2 ring-emerald-500/20 ring-offset-1">
                          <ReceiptIcon className="h-3.5 w-3.5" /> Thu tiền
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredAppointments.length === 0 && (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    Không có ca khám nào trong hàng đợi.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (1/3): THAO TÁC NHANH & HÓA ĐƠN */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Thao tác nhanh</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/receptionist/appointments" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-slate-50/50 p-4 transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]">
                  <CalendarPlusIcon className="h-6 w-6 text-brand" />
                  <span className="text-xs font-semibold text-slate-900 text-center">Lịch Hẹn & Walk-in</span>
                </Link>
                <Link href="/receptionist/patients" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-slate-50/50 p-4 transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]">
                  <UserPlusIcon className="h-6 w-6 text-brand" />
                  <span className="text-xs font-semibold text-slate-900 text-center">QL Bệnh Nhân</span>
                </Link>
                <Link href="/receptionist/billing" className="col-span-2 flex items-center justify-between rounded-xl border border-border bg-slate-50/50 p-4 transition-all hover:border-brand hover:bg-brand/5 active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <ReceiptIcon className="h-5 w-5 text-brand" />
                    <span className="text-xs font-semibold text-slate-900">Quản lý Thu ngân (Billing)</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Recent Invoices / Chờ thanh toán */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-slate-50/50 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">Phiếu chờ thu tiền</h2>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {MOCK_BILLING.length}
                </span>
              </div>
              
              <div className="divide-y divide-border/50">
                {MOCK_BILLING.map((bill) => (
                  <div key={bill.id} className="flex flex-col gap-2 p-4 transition-colors hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-brand-dark">{bill.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{bill.time}</span>
                      </div>
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/20">
                        Chưa thu
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-base font-bold text-red-600">{bill.amount} ₫</span>
                      <Link href="/receptionist/billing" className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.95]">
                        <ReceiptIcon className="h-3.5 w-3.5" /> Thu
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
