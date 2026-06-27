"use client";

import React, { useState } from "react";

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
          
          {/* LEO TRÁI: DANH SÁCH HÓA ĐƠN (1/3) */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden lg:col-span-4 lg:sticky lg:top-8 lg:h-[calc(100vh-8rem)] flex flex-col">
            
            <div className="p-4 border-b border-border bg-slate-50/50">
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm Tên, Mã hóa đơn..."
                  className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('UNPAID')}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-colors ${
                    activeTab === 'UNPAID' ? 'bg-brand text-white shadow-sm' : 'bg-slate-200/50 text-muted-foreground hover:bg-slate-200'
                  }`}
                >
                  Chưa thu (3)
                </button>
                <button
                  onClick={() => setActiveTab('PAID')}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-colors ${
                    activeTab === 'PAID' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200/50 text-muted-foreground hover:bg-slate-200'
                  }`}
                >
                  Đã thu
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {filteredInvoices.map((inv) => (
                <div 
                  key={inv.id} 
                  onClick={() => setSelectedInvoice(inv)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedInvoice.id === inv.id 
                      ? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand' 
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold ${selectedInvoice.id === inv.id ? 'text-brand-dark' : 'text-foreground'}`}>
                      {inv.patient}
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{inv.doctor}</p>
                    <p className={`font-bold font-mono ${inv.status === 'UNPAID' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {inv.total.toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))}
              {filteredInvoices.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Không có hóa đơn nào.
                </div>
              )}
            </div>
          </div>

          {/* LEO PHẢI: CHI TIẾT HÓA ĐƠN & THANH TOÁN (2/3) */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              
              {/* Header chi tiết */}
              <div className="flex items-center justify-between border-b border-border p-6">
                <div>
                  <h2 className="text-xl font-bold text-brand-dark">Chi tiết Phiếu thu</h2>
                  <p className="font-mono text-sm text-muted-foreground mt-1">Mã PT: {selectedInvoice.id} • Ngày: {selectedInvoice.date}</p>
                </div>
                {selectedInvoice.status === 'PAID' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <CheckCircleIcon className="h-4 w-4" /> Đã thanh toán
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                    Chưa thanh toán
                  </span>
                )}
              </div>

              <div className="p-6 space-y-8">
                
                {/* Thông tin */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Khách hàng</p>
                    <p className="font-medium text-foreground">{selectedInvoice.patient}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Bác sĩ điều trị</p>
                    <p className="font-medium text-foreground">{selectedInvoice.doctor}</p>
                  </div>
                </div>

                {/* Bảng dịch vụ */}
                <div>
                  <h3 className="text-base font-bold text-foreground mb-4">Danh sách dịch vụ</h3>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-slate-50 font-bold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Tên dịch vụ</th>
                          <th className="px-4 py-3 text-center">SL</th>
                          <th className="px-4 py-3 text-right">Đơn giá</th>
                          <th className="px-4 py-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedInvoice.services.map((svc, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium text-foreground">{svc.name}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{svc.qty}</td>
                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">{svc.price.toLocaleString()}đ</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-brand-dark">{(svc.qty * svc.price).toLocaleString()}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tổng kết & Form thanh toán (Chỉ hiện nếu UNPAID) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Phương thức thanh toán */}
                  <div className={selectedInvoice.status === 'PAID' ? 'opacity-50 pointer-events-none' : ''}>
                    <h3 className="text-base font-bold text-foreground mb-4">Phương thức thanh toán</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('TRANSFER')}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${paymentMethod === 'TRANSFER' ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand' : 'border-border bg-white text-muted-foreground hover:bg-slate-50'}`}
                      >
                        <QrCodeIcon className="h-6 w-6" />
                        <span className="text-xs font-bold">Chuyển khoản</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${paymentMethod === 'CASH' ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand' : 'border-border bg-white text-muted-foreground hover:bg-slate-50'}`}
                      >
                        <BanknoteIcon className="h-6 w-6" />
                        <span className="text-xs font-bold">Tiền mặt</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('CARD')}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${paymentMethod === 'CARD' ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand' : 'border-border bg-white text-muted-foreground hover:bg-slate-50'}`}
                      >
                        <CreditCardIcon className="h-6 w-6" />
                        <span className="text-xs font-bold">Quẹt thẻ</span>
                      </button>
                    </div>

                    {paymentMethod === 'TRANSFER' && selectedInvoice.status === 'UNPAID' && (
                      <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-4 text-center">
                        <div className="mx-auto h-24 w-24 bg-white border rounded shadow-sm flex items-center justify-center mb-2">
                          <QrCodeIcon className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-xs text-muted-foreground">Yêu cầu khách hàng quét mã QR trên màn hình hoặc mã in sẵn tại quầy.</p>
                      </div>
                    )}
                  </div>

                  {/* Cột tính tiền */}
                  <div className="rounded-xl bg-slate-50 p-5 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Tổng cộng:</span>
                      <span className="font-mono font-medium text-foreground">{selectedInvoice.total.toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="font-medium text-muted-foreground">Khuyến mãi / Mã giảm:</span>
                      {selectedInvoice.status === 'UNPAID' ? (
                        <input type="text" placeholder="Nhập mã..." className="w-24 rounded border border-border px-2 py-1 text-right font-mono text-sm outline-none focus:border-brand" />
                      ) : (
                        <span className="font-mono font-medium text-foreground">0đ</span>
                      )}
                    </div>
                    <div className="border-t border-slate-200 pt-4 flex justify-between items-end">
                      <span className="font-bold text-brand-dark">Khách cần trả:</span>
                      <span className="font-mono text-2xl font-bold text-red-600">{selectedInvoice.total.toLocaleString()}đ</span>
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 border-t border-border pt-6">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-slate-50">
                    <PrinterIcon className="h-4 w-4" />
                    In hóa đơn
                  </button>
                  {selectedInvoice.status === 'UNPAID' && (
                    <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg">
                      <ReceiptIcon className="h-4 w-4" />
                      Xác nhận đã thu tiền
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
