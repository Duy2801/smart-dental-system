"use client";

import React, { useState } from "react";

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

// --- MOCK DATA ---
const MOCK_APPOINTMENTS = [
  { id: "AP01", time: "08:30", name: "Nguyễn Văn A", phone: "0901234567", service: "Nhổ răng khôn", doctor: "BS. Trần Sơn", status: "WAITING" },
  { id: "AP02", time: "09:00", name: "Lê Hoàng C", phone: "0987654321", service: "Tái khám niềng răng", doctor: "BS. Phạm Hà", status: "IN_PROGRESS" },
  { id: "AP03", time: "10:30", name: "Đỗ Thu H", phone: "0977889900", service: "Khám tổng quát", doctor: "BS. Lê Hoàng", status: "INCOMING" },
  { id: "AP04", time: "11:00", name: "Hoàng Minh Q", phone: "0933445566", service: "Cắm Implant", doctor: "BS. Trần Sơn", status: "INCOMING" },
];

const MOCK_BILLING = [
  { id: "INV01", name: "Trần Thị B", amount: "1,500,000", service: "Tẩy trắng răng Laser" },
  { id: "INV02", name: "Phạm Văn D", amount: "500,000", service: "Trám răng thẩm mỹ" },
];

const MOCK_DOCTORS = [
  { id: "D1", name: "BS. Trần Sơn", room: "Phòng 01", status: "AVAILABLE", nextApt: "10:30" },
  { id: "D2", name: "BS. Lê Hoàng", room: "Phòng 02", status: "IN_PROGRESS", nextApt: "11:00" },
  { id: "D3", name: "BS. Phạm Hà", room: "Phòng 03", status: "AVAILABLE", nextApt: "Chiều" },
];

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOMING' | 'WAITING' | 'IN_PROGRESS'>('ALL');

  const filteredAppointments = MOCK_APPOINTMENTS.filter(apt => activeTab === 'ALL' || apt.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* --- HEADER: TÌM KIẾM & QUICK ACTIONS --- */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm bệnh nhân (Tên, SĐT, Mã hồ sơ)..."
              className="w-full rounded-xl border border-border bg-white py-3 pl-12 pr-4 text-base shadow-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              autoFocus
            />
          </div>
          
          <div className="flex shrink-0 items-center gap-3">
            <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-5 font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50">
              <CalendarPlusIcon className="h-5 w-5 text-brand" />
              Lịch Walk-in
            </button>
            <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-medium text-white shadow-sm transition-colors hover:bg-brand-dark">
              <UserPlusIcon className="h-5 w-5" />
              Tạo hồ sơ mới
            </button>
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          
          {/* CỘT TRÁI (2/3): HÀNG CHỜ & KẾ TOÁN */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* 1. HÀNG CHỜ VÀ TIẾP ĐÓN */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-slate-50/50 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-brand-dark">Hàng chờ & Tiếp đón hôm nay</h2>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    {MOCK_APPOINTMENTS.length} Ca khám
                  </span>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'INCOMING', label: 'Sắp tới' },
                    { id: 'WAITING', label: 'Đang chờ khám' },
                    { id: 'IN_PROGRESS', label: 'Đang khám' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-white text-foreground shadow-sm ring-1 ring-border' 
                          : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-border/50">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/50">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 p-2 text-center min-w-[64px]">
                        <span className="text-sm font-bold text-brand-dark">{apt.time}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          {apt.name}
                          {apt.status === 'WAITING' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">Phòng chờ</span>}
                          {apt.status === 'IN_PROGRESS' && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">Đang khám</span>}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="font-mono text-xs">{apt.phone}</span>
                          <span className="flex items-center gap-1.5"><ActivityIcon className="h-3.5 w-3.5" /> {apt.service}</span>
                          <span className="font-medium text-brand-dark">{apt.doctor}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-2">
                      {apt.status === 'INCOMING' && (
                        <>
                          <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-50">
                            <BellRingIcon className="h-4 w-4" /> Nhắc lịch
                          </button>
                          <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600">
                            <CheckCircleIcon className="h-4 w-4" /> Check-in
                          </button>
                        </>
                      )}
                      {apt.status === 'WAITING' && (
                        <button className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50">
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredAppointments.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Không có bệnh nhân nào trong danh sách này.
                  </div>
                )}
              </div>
            </div>

            {/* 2. KẾ TOÁN & THANH TOÁN */}
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-slate-50/50 px-6 py-4">
                <h2 className="text-lg font-bold text-brand-dark">Chờ thanh toán</h2>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  {MOCK_BILLING.length} Phiếu
                </span>
              </div>
              
              <div className="divide-y divide-border/50">
                {MOCK_BILLING.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50/50">
                    <div>
                      <h3 className="font-bold text-foreground">{bill.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{bill.service}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tạm tính</p>
                        <p className="font-mono text-lg font-bold text-red-600">{bill.amount}đ</p>
                      </div>
                      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
                        <ReceiptIcon className="h-4 w-4" /> Thu tiền
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (1/3): TRẠNG THÁI BÁC SĨ */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden sticky top-8">
              <div className="border-b border-border bg-slate-50/50 px-5 py-4">
                <h2 className="text-lg font-bold text-brand-dark">Trạng thái Bác sĩ</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Theo dõi để sắp xếp lịch Walk-in</p>
              </div>
              
              <div className="p-2">
                {MOCK_DOCTORS.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                          doc.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <span className="font-bold text-sm">{doc.name.split(' ').pop()?.charAt(0)}</span>
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            doc.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}></span>
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{doc.name}</h4>
                          <p className="text-xs font-medium text-muted-foreground">{doc.room}</p>
                        </div>
                      </div>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {doc.status === 'AVAILABLE' ? 'Đang rảnh' : 'Đang khám'}
                      </span>
                    </div>
                    {doc.status === 'AVAILABLE' && (
                      <div className="rounded-lg bg-slate-50 p-2 text-xs text-muted-foreground flex items-center justify-between">
                        <span>Lịch tiếp theo:</span>
                        <span className="font-bold text-brand-dark">{doc.nextApt}</span>
                      </div>
                    )}
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
