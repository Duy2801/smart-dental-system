"use client";

import React, { useState } from "react";
import Link from "next/link";

// --- INLINE SVGS ---
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

const QrCodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
);

export default function CheckInPage() {
  const [isScanningQR, setIsScanningQR] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}} />
      <div className="mx-auto max-w-2xl">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/receptionist/appointments" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-dark">
            <ArrowLeftIcon /> Quay lại Lịch hẹn
          </Link>
          
          <button 
            onClick={() => setIsScanningQR(!isScanningQR)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.95]"
          >
            <QrCodeIcon className="h-4 w-4" /> 
            {isScanningQR ? "Hủy quét QR" : "Quét mã QR Bệnh nhân"}
          </button>
        </div>

        {isScanningQR ? (
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            <div className="mx-auto h-64 w-64 overflow-hidden rounded-2xl border-2 border-dashed border-brand bg-slate-50 relative">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p className="text-sm font-semibold">Camera đang mở...</p>
              </div>
              <div className="absolute left-0 h-1 w-full bg-brand/60 shadow-[0_0_15px_rgba(14,165,233,0.8)] animate-scan" />
            </div>
            <h2 className="mt-6 text-lg font-bold text-slate-900">Đưa mã QR của bệnh nhân vào khung hình</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Khách hàng có thể mở mã QR trên Zalo Mini App hoặc Email xác nhận.
            </p>
            <button 
              onClick={() => setIsScanningQR(false)}
              className="mt-6 font-bold text-brand hover:underline"
            >
              Quay lại xác nhận thủ công
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            {/* Main Check-in Card */}
            <div className="bg-brand/5 border-b border-border px-6 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand mb-4">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-brand-dark">Xác nhận Check-in</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Xác nhận bệnh nhân đã có mặt tại phòng khám để hệ thống chuyển trạng thái sang phòng chờ cho Bác sĩ.
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              {/* Info Summary */}
              <div className="rounded-xl border border-border bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Đỗ Thu H</h3>
                      <p className="font-mono text-xs text-muted-foreground">0977 889 900</p>
                    </div>
                  </div>
                  <span className="rounded bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase text-brand ring-1 ring-inset ring-brand/20">
                    Lịch đặt trước
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dịch vụ</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      <ActivityIcon className="h-4 w-4 text-brand" /> Khám tổng quát
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Giờ hẹn</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      <ClockIcon className="h-4 w-4 text-brand" /> 10:30 - 11:30
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Bác sĩ phụ trách</span>
                    <div className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                      BS. Lê Hoàng
                    </div>
                  </div>
                </div>
              </div>

              {/* Health check / Note */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900">Kiểm tra thông tin y tế (Tùy chọn)</label>
                <label className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">Bệnh nhân không có thay đổi về tiền sử bệnh lý</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Xác nhận nhanh thông tin dị ứng / huyết áp vẫn như hồ sơ cũ.</span>
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cập nhật Ghi chú Lễ tân (Tùy chọn)</label>
                <textarea 
                  rows={2} 
                  placeholder="VD: Bệnh nhân đến trễ 15 phút, đang ngồi tại sảnh chờ số 1..." 
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-sm resize-y" 
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <Link href="/receptionist/appointments" className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Hủy
                </Link>
                <Link href="/receptionist/appointments" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-emerald-600/20 transition-all hover:bg-emerald-600 hover:shadow-md active:scale-[0.98]">
                  <CheckCircleIcon className="h-4 w-4" /> Hoàn tất Check-in
                </Link>
              </div>

            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
