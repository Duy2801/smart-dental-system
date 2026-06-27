"use client";

import React, { useState } from "react";

// --- INLINE SVGS ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

const PrinterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

export default function CheckInPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPatientFound, setIsPatientFound] = useState(false);

  // Mock Handle Search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Giả lập tìm thấy khi gõ đúng SĐT này
    if (e.target.value === "0901234567" || e.target.value.toLowerCase() === "nguyen van a") {
      setIsPatientFound(true);
    } else {
      setIsPatientFound(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Tiếp nhận & Check-in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Xử lý nhanh khách hàng vừa đến phòng khám.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-brand bg-brand/5 px-4 py-2.5 text-sm font-bold text-brand shadow-sm transition-colors hover:bg-brand hover:text-white">
            <UserPlusIcon className="h-4 w-4" />
            Đăng ký khách mới
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          
          {/* --- CỘT TRÁI: TÌM KIẾM & THÔNG TIN --- */}
          <div className="space-y-6 lg:col-span-7">
            
            {/* Box Tìm kiếm */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-foreground">1. Nhận diện khách hàng</h2>
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Nhập SĐT (thử '0901234567') hoặc Tên..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-4 pl-14 pr-4 text-lg font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  autoFocus
                />
              </div>
            </div>

            {/* Box Kết quả / Thông tin bệnh nhân */}
            <div className={`rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 ${!isPatientFound ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-foreground">2. Thông tin bệnh nhân</h2>
                {isPatientFound && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Đã tìm thấy hồ sơ</span>}
              </div>
              
              <div className="flex items-start gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <UserIcon className="h-10 w-10" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-brand-dark">Nguyễn Văn A</h3>
                    <span className="font-mono text-sm text-muted-foreground">#BN-2026-001</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><PhoneIcon className="h-4 w-4" /> 0901 234 567</span>
                    <span>Nam, 32 tuổi</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 border border-amber-100">
                    <div className="font-bold">Lịch hẹn hôm nay: 08:30</div>
                    <div>Dịch vụ: Nhổ răng khôn - Bác sĩ: Trần Sơn</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: LÝ DO KHÁM & CHỈ ĐỊNH --- */}
          <div className={`space-y-6 lg:col-span-5 transition-all duration-300 ${!isPatientFound ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-foreground">3. Chỉ định tiếp nhận</h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-dark">Lý do khám / Dịch vụ yêu cầu</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20">
                    <option value="appointment">Theo lịch hẹn (Nhổ răng khôn)</option>
                    <option value="khám">Khám tổng quát / Tư vấn</option>
                    <option value="cấp_cứu">Cấp cứu nha khoa (Đau nhức)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-dark">Bác sĩ phụ trách</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20">
                    <option value="BS Trần Sơn">BS. Trần Sơn (Có lịch hẹn)</option>
                    <option value="BS Lê Hoàng">BS. Lê Hoàng (Đang rảnh)</option>
                    <option value="BS Phạm Hà">BS. Phạm Hà</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-dark">Ghi chú cho Bác sĩ (Nếu có)</label>
                  <textarea 
                    rows={2}
                    placeholder="Ví dụ: Bệnh nhân rất sợ đau..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-600 hover:shadow-lg active:scale-[0.98]">
                  <CheckCircleIcon className="h-5 w-5" />
                  Xác nhận Check-in & Vào phòng chờ
                </button>
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-muted-foreground hover:bg-slate-50 transition-colors">
                  <PrinterIcon className="h-4 w-4" />
                  In số thứ tự
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
