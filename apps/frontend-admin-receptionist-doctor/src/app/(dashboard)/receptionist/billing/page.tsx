"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils/cn";

// --- INLINE SVGS ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
);
const PrinterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const QrCodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
);
const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);
const BanknoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
);
const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

// --- MOCK DATA ---
const MOCK_INVOICES = [
  { id: "HD-2606-001", patient: "Trần Thị B", doctor: "BS. Phạm Hà", total: 1500000, date: "27/06/2026", status: "UNPAID", services: [{ name: "Tẩy trắng răng Laser", qty: 1, price: 1500000 }] },
  { id: "HD-2606-002", patient: "Phạm Văn D", doctor: "BS. Lê Hoàng", total: 500000, date: "27/06/2026", status: "UNPAID", services: [{ name: "Trám răng composite", qty: 2, price: 250000 }] },
  { id: "HD-2606-003", patient: "Nguyễn Văn A", doctor: "BS. Trần Sơn", total: 800000, date: "27/06/2026", status: "UNPAID", services: [{ name: "Nhổ răng khôn", qty: 1, price: 800000 }] },
  { id: "HD-2606-004", patient: "Lê Hoàng C", doctor: "BS. Phạm Hà", total: 20000000, date: "26/06/2026", status: "PAID", services: [{ name: "Niềng răng mắc cài (Kỳ 1)", qty: 1, price: 20000000 }] },
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [selectedInvoice, setSelectedInvoice] = useState(MOCK_INVOICES[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('TRANSFER');
  const [discountCode, setDiscountCode] = useState("");

  const filteredInvoices = MOCK_INVOICES.filter(inv => inv.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Thanh toán & Hóa đơn</h1>
            <p className="mt-1 text-sm text-muted-foreground">Thu tiền khách hàng sau khi điều trị và xuất hóa đơn.</p>
          </div>
        </div>

        {/* --- SPLIT LAYOUT --- */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          
          {/* CỘT TRÁI: DANH SÁCH HÓA ĐƠN (1/3) */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden lg:col-span-4 lg:sticky lg:top-8 lg:h-[calc(100vh-8rem)] flex flex-col">
            
            <div className="p-4 border-b border-border bg-white z-10 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm Tên, Mã hóa đơn..."
                  className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  onClick={() => { setActiveTab('UNPAID'); setSelectedInvoice(MOCK_INVOICES.find(i => i.status === 'UNPAID') || MOCK_INVOICES[0]) }}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-bold transition-all",
                    activeTab === 'UNPAID' ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-slate-900"
                  )}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    Chờ thanh toán <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">3</span>
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab('PAID'); setSelectedInvoice(MOCK_INVOICES.find(i => i.status === 'PAID') || MOCK_INVOICES[0]) }}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-bold transition-all",
                    activeTab === 'PAID' ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-slate-900"
                  )}
                >
                  Đã thu xong
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-2 bg-slate-50/30">
              {filteredInvoices.map((inv) => (
                <button 
                  key={inv.id} 
                  onClick={() => setSelectedInvoice(inv)}
                  className={cn(
                    "w-full text-left rounded-xl p-4 transition-all border block active:scale-[0.98]",
                    selectedInvoice.id === inv.id 
                      ? "border-brand bg-white shadow-[0_0_0_1px_rgba(14,165,233,0.5)]" 
                      : "border-border bg-white hover:border-slate-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={cn("font-bold", selectedInvoice.id === inv.id ? "text-brand-dark" : "text-slate-900")}>
                      {inv.patient}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">{inv.id}</span>
                  </div>
                  <div className="flex items-end justify-between mt-3 border-t border-dashed border-slate-200 pt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{inv.doctor}</p>
                    <p className={cn("font-bold font-mono text-sm", inv.status === 'UNPAID' ? "text-red-600" : "text-emerald-600")}>
                      {inv.total.toLocaleString()}đ
                    </p>
                  </div>
                </button>
              ))}
              {filteredInvoices.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                  <CheckCircleIcon className="h-8 w-8 text-slate-300 mb-2" />
                  Không có hóa đơn nào.
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT HÓA ĐƠN & THANH TOÁN (2/3) */}
          <div className="lg:col-span-8">
            {selectedInvoice ? (
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[calc(100vh-8rem)]">
                
                {/* Header chi tiết */}
                <div className="flex items-center justify-between border-b border-border bg-slate-50/50 p-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Chi Tiết Phiếu Thu</h2>
                    <p className="font-mono text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">Mã PT: {selectedInvoice.id} • Ngày: {selectedInvoice.date}</p>
                  </div>
                  {selectedInvoice.status === 'PAID' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm">
                      <CheckCircleIcon className="h-4 w-4" /> Đã thanh toán
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20 shadow-sm animate-pulse">
                      <AlertCircleIcon className="h-4 w-4" /> Chờ thanh toán
                    </span>
                  )}
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  
                  {/* Thông tin Khách & Bác sĩ */}
                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 border border-border shadow-sm mb-8">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Khách hàng</p>
                      <p className="font-bold text-slate-900 text-base">{selectedInvoice.patient}</p>
                    </div>
                    <div className="border-l border-border pl-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Bác sĩ điều trị</p>
                      <p className="font-bold text-slate-900 text-base">{selectedInvoice.doctor}</p>
                    </div>
                  </div>

                  {/* Bảng dịch vụ */}
                  <div className="mb-8 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Danh mục dịch vụ</h3>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="border-b border-border bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3">Tên Dịch Vụ</th>
                            <th className="px-5 py-3 text-center">SL</th>
                            <th className="px-5 py-3 text-right">Đơn Giá</th>
                            <th className="px-5 py-3 text-right">Thành Tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 bg-white">
                          {selectedInvoice.services.map((svc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4 font-semibold text-slate-900">{svc.name}</td>
                              <td className="px-5 py-4 text-center font-mono font-medium text-slate-600">{svc.qty}</td>
                              <td className="px-5 py-4 text-right font-mono font-medium text-slate-600">{svc.price.toLocaleString()}đ</td>
                              <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">{(svc.qty * svc.price).toLocaleString()}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tổng kết & Form thanh toán */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-auto border-t border-border pt-8">
                    
                    {/* Phương thức thanh toán (Bên trái) */}
                    <div className={selectedInvoice.status === 'PAID' ? 'opacity-60 pointer-events-none grayscale' : ''}>
                      <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Phương thức thanh toán</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('TRANSFER')}
                          className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all active:scale-[0.95]", paymentMethod === 'TRANSFER' ? 'border-brand bg-brand text-white shadow-md' : 'border-border bg-white text-slate-600 hover:border-brand/50')}
                        >
                          <QrCodeIcon className="h-5 w-5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Chuyển khoản</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('CASH')}
                          className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all active:scale-[0.95]", paymentMethod === 'CASH' ? 'border-brand bg-brand text-white shadow-md' : 'border-border bg-white text-slate-600 hover:border-brand/50')}
                        >
                          <BanknoteIcon className="h-5 w-5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Tiền mặt</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('CARD')}
                          className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all active:scale-[0.95]", paymentMethod === 'CARD' ? 'border-brand bg-brand text-white shadow-md' : 'border-border bg-white text-slate-600 hover:border-brand/50')}
                        >
                          <CreditCardIcon className="h-5 w-5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Quẹt thẻ</span>
                        </button>
                      </div>

                      {paymentMethod === 'TRANSFER' && selectedInvoice.status === 'UNPAID' && (
                        <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-4 flex gap-4 items-center shadow-sm">
                          <div className="h-20 w-20 bg-white border border-border rounded-lg shadow-sm flex items-center justify-center shrink-0">
                            <QrCodeIcon className="h-8 w-8 text-brand" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Mã QR Thanh toán</p>
                            <p className="text-xs text-muted-foreground mt-1">Yêu cầu khách hàng mở App Ngân hàng để quét mã QR này.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cột tính tiền (Bên phải) */}
                    <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl relative overflow-hidden border border-slate-800">
                      {/* Decorative glowing orb */}
                      <div className={cn(
                        "absolute -top-20 -right-20 h-48 w-48 rounded-full blur-[3rem] opacity-30 pointer-events-none transition-colors duration-500", 
                        selectedInvoice.status === 'UNPAID' ? "bg-rose-500" : "bg-emerald-500"
                      )}></div>
                      
                      <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-400">Tổng cộng:</span>
                          <span className="font-mono font-bold text-slate-200">{selectedInvoice.total.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-400">Khuyến mãi:</span>
                          {selectedInvoice.status === 'UNPAID' ? (
                            <input 
                              type="text" 
                              placeholder="Mã Code" 
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value)}
                              className="w-28 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-right font-mono text-xs font-bold text-white outline-none focus:border-brand focus:bg-slate-800 transition-all placeholder:text-slate-600 shadow-inner" 
                            />
                          ) : (
                            <span className="font-mono font-bold text-emerald-400">0đ</span>
                          )}
                        </div>
                        
                        {/* Ticket separator effect */}
                        <div className="relative border-t border-dashed border-slate-700/70 pt-6 mt-6">
                          {/* Cutouts to look like a receipt ticket */}
                          <div className="absolute -left-8 -top-2.5 h-5 w-5 rounded-full bg-white shadow-inner"></div>
                          <div className="absolute -right-8 -top-2.5 h-5 w-5 rounded-full bg-white shadow-inner"></div>
                          
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">Thành tiền</span>
                              <span className="font-bold text-slate-200 text-sm">KHÁCH CẦN TRẢ</span>
                            </div>
                            <span className={cn(
                              "font-mono text-4xl font-black tracking-tighter drop-shadow-md", 
                              selectedInvoice.status === 'UNPAID' ? "text-rose-400" : "text-emerald-400"
                            )}>
                              {selectedInvoice.total.toLocaleString()}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
                    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
                      <PrinterIcon className="h-4 w-4" />
                      In hóa đơn
                    </button>
                    {selectedInvoice.status === 'UNPAID' && (
                      <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-md ring-1 ring-inset ring-white/20 transition-all hover:bg-brand-dark hover:shadow-lg active:scale-[0.98]">
                        <ReceiptIcon className="h-5 w-5" />
                        Xác nhận đã thu tiền
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-border bg-white">
                <p className="text-muted-foreground font-medium">Chọn một hóa đơn để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
