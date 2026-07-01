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
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
const PillIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
);
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);

// --- MOCK DATA ---
const MOCK_PATIENTS = [
  { id: "BN-23001", name: "Nguyễn Văn An", phone: "0901234567", gender: "Nam", age: 34, lastVisit: "20/06/2026", status: "WAITING", reason: "Khám định kỳ & Cạo vôi răng" },
  { id: "BN-23002", name: "Trần Thị Bé", phone: "0911223344", gender: "Nữ", age: 29, lastVisit: "Hôm nay", status: "EXAMINING", reason: "Đau nhức răng hàm dưới" },
  { id: "BN-23004", name: "Đỗ Thu Hà", phone: "0977889900", gender: "Nữ", age: 26, lastVisit: "15/06/2026", status: "WAITING", reason: "Tái khám niềng răng mắc cài (Kỳ 6)" },
];

export default function MedicalRecordsDashboardPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("BN-23004");
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'XRAY' | 'PRESCRIPTIONS'>('OVERVIEW');

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        
        {/* --- HEADER --- */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Bệnh án Điện tử (Clinical Dashboard)</h1>
            <p className="mt-1 text-sm text-muted-foreground">Truy cập hồ sơ bệnh lý, phim X-Quang và kế hoạch điều trị.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          
          {/* CỘT TRÁI: DANH SÁCH BỆNH NHÂN TRONG NGÀY (3/12) */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden xl:col-span-3 xl:sticky xl:top-8 xl:h-[calc(100vh-8rem)] flex flex-col">
            
            <div className="p-4 border-b border-border bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Hàng đợi khám (Hôm nay)</h2>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm BN..."
                  className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {MOCK_PATIENTS.map((pt) => (
                <button 
                  key={pt.id} 
                  onClick={() => setSelectedPatientId(pt.id)}
                  className={cn(
                    "w-full text-left rounded-xl p-4 transition-all border block active:scale-[0.98]",
                    selectedPatientId === pt.id 
                      ? "border-brand bg-brand/5 shadow-[0_0_0_1px_rgba(14,165,233,0.5)]" 
                      : "border-border bg-white hover:border-slate-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className={cn("font-bold", selectedPatientId === pt.id ? "text-brand-dark" : "text-slate-900")}>
                      {pt.name}
                    </h3>
                    {pt.status === "EXAMINING" ? (
                      <span className="flex h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse"></span>
                    ) : (
                      <span className="flex h-2 w-2 rounded-full bg-amber-400"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">{pt.id}</span>
                    <span className="text-[10px] text-muted-foreground">{pt.gender}, {pt.age}T</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic text-slate-600">
                    "{pt.reason}"
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: KHÔNG GIAN ĐIỀU TRỊ (9/12) */}
          <div className="xl:col-span-9 flex flex-col gap-6">
            
            {/* THẺ TỔNG QUAN BỆNH NHÂN (Hero Patient Card) */}
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Decorative Background */}
              <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand/20 blur-[4rem] pointer-events-none"></div>
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
                  <UserIcon className="h-8 w-8 text-brand-light" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold tracking-tight">Đỗ Thu Hà</h2>
                    <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300 ring-1 ring-white/10">BN-23004</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Nữ, 26 tuổi</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                    <span className="font-mono">0977 889 900</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                    <span>Tái khám niềng răng (Kỳ 6)</span>
                  </div>
                </div>
              </div>

              {/* Medical Alerts (Critical Info) */}
              <div className="relative z-10 flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 ring-1 ring-red-500/20 backdrop-blur-md">
                  <HeartIcon className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-xs font-bold text-red-100">Dị ứng Penicillin</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/20 backdrop-blur-md">
                  <ActivityIcon className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-100">Huyết áp thấp</span>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION CHUYÊN SÂU */}
            <div className="flex items-center gap-2 border-b border-border px-2">
              <button 
                onClick={() => setActiveTab('OVERVIEW')}
                className={cn("flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2", activeTab === 'OVERVIEW' ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-slate-900 hover:border-slate-300")}
              >
                <FileTextIcon className="h-4 w-4" /> Khám & Điều trị
              </button>
              <button 
                onClick={() => setActiveTab('XRAY')}
                className={cn("flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2", activeTab === 'XRAY' ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-slate-900 hover:border-slate-300")}
              >
                <ImageIcon className="h-4 w-4" /> X-Quang & Hình ảnh
              </button>
              <button 
                onClick={() => setActiveTab('PRESCRIPTIONS')}
                className={cn("flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2", activeTab === 'PRESCRIPTIONS' ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-slate-900 hover:border-slate-300")}
              >
                <PillIcon className="h-4 w-4" /> Đơn thuốc & Dặn dò
              </button>
            </div>

            {/* NỘI DUNG TAB (Content Area) */}
            <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm p-6 min-h-[500px]">
              
              {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form Ghi chép lâm sàng */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-base font-bold text-slate-900">Ghi chép Lâm sàng (Hôm nay)</h3>
                      <button className="text-xs font-bold text-brand hover:underline">Sử dụng Mẫu (Templates)</button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Triệu chứng (Lý do khám)</label>
                        <textarea rows={2} defaultValue="Tái khám định kỳ niềng răng. Bệnh nhân báo ê buốt nhẹ răng 36, 46 khi uống nước lạnh." className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-sm resize-y" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chẩn đoán (ICD-10)</label>
                        <input type="text" defaultValue="[K08.8] Các rối loạn khác được chỉ định của răng và tổ chức nâng đỡ" className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-bold text-brand-dark outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chi tiết Điều trị (Procedures)</label>
                        <textarea rows={5} defaultValue="- Thay thun, kiểm tra mắc cài.&#13;&#10;- Gắn lại mắc cài răng 23 bị bong.&#13;&#10;- Cạo vôi răng siêu âm.&#13;&#10;- Quét Flour chống ê buốt răng 36, 46." className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-mono text-slate-800 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-inner resize-y leading-relaxed" />
                      </div>
                      
                      <div className="pt-4 flex justify-end gap-3">
                        <Link href="/doctor/treatment-plans/new" className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 border border-border hover:bg-slate-50 transition-colors">
                          Cập nhật Kế hoạch (Phases)
                        </Link>
                        <button className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-white/20 hover:bg-brand-dark transition-all active:scale-[0.98]">
                          Lưu Bệnh án
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử điều trị cũ (History) */}
                  <div className="border-l border-border pl-8 space-y-6">
                    <h3 className="text-base font-bold text-slate-900 mb-6">Lịch sử Điều trị</h3>
                    
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                      {/* Cột mốc 1 */}
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-slate-300"></div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">15/05/2026 • BS. Lê Hoàng</p>
                        <div className="rounded-xl border border-border bg-slate-50 p-4">
                          <p className="font-bold text-slate-900 text-sm mb-2">Tái khám định kỳ (Kỳ 5)</p>
                          <p className="text-sm text-slate-600 font-mono">Thay dây cung NA 0.16. Kéo đóng khoảng răng 14, 24.</p>
                        </div>
                      </div>
                      {/* Cột mốc 2 */}
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-slate-300"></div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">10/04/2026 • BS. Lê Hoàng</p>
                        <div className="rounded-xl border border-border bg-slate-50 p-4">
                          <p className="font-bold text-slate-900 text-sm mb-2">Tái khám định kỳ (Kỳ 4)</p>
                          <p className="text-sm text-slate-600 font-mono">Thay thun chuỗi. Vệ sinh mắc cài.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'XRAY' && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="h-24 w-24 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-6 border-2 border-dashed border-slate-300">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có dữ liệu Hình ảnh / X-Quang</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Tải lên file ảnh Pano, Ceph hoặc hình chụp trong miệng để theo dõi quá trình điều trị.</p>
                  <button className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98]">
                    + Tải ảnh lên
                  </button>
                </div>
              )}

              {activeTab === 'PRESCRIPTIONS' && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="h-24 w-24 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500 mb-6">
                    <PillIcon className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Đơn thuốc & Hướng dẫn</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Kê toa thuốc tự động hoặc in giấy hướng dẫn chăm sóc răng miệng sau điều trị.</p>
                  <Link href="/doctor/prescriptions/new" className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark transition-all active:scale-[0.98]">
                    Kê đơn thuốc mới
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
