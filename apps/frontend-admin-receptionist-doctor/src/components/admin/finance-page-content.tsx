"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";

// --- Types & Mock Data based on db.md ---
type InvoiceItem = {
  service_id: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
};

type InvoiceStatus = "PAID" | "UNPAID" | "CANCELLED";
type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE";

type Invoice = {
  id: string;
  invoice_code: string;
  patient_name: string;
  issued_at: string;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  status: InvoiceStatus;
  payment_method?: PaymentMethod;
  items: InvoiceItem[];
};

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoice_code: "HD260601",
    patient_name: "Nguyễn Văn A",
    issued_at: "2026-06-28T08:30:00Z",
    subtotal: 500000,
    discount_amount: 0,
    final_amount: 500000,
    status: "PAID",
    payment_method: "BANK_TRANSFER",
    items: [{ service_id: "s1", description: "Trám răng thẩm mỹ", qty: 1, unit_price: 500000, amount: 500000 }]
  },
  {
    id: "2",
    invoice_code: "HD260602",
    patient_name: "Trần Thị B",
    issued_at: "2026-06-28T10:15:00Z",
    subtotal: 3500000,
    discount_amount: 500000,
    final_amount: 3000000,
    status: "PAID",
    payment_method: "CASH",
    items: [
      { service_id: "s2", description: "Nhổ răng khôn mọc lệch", qty: 1, unit_price: 3500000, amount: 3500000 }
    ]
  },
  {
    id: "3",
    invoice_code: "HD260603",
    patient_name: "Lê Văn C",
    issued_at: "2026-06-29T09:00:00Z",
    subtotal: 200000,
    discount_amount: 0,
    final_amount: 200000,
    status: "UNPAID",
    items: [{ service_id: "s3", description: "Khám định kỳ", qty: 1, unit_price: 200000, amount: 200000 }]
  },
  {
    id: "4",
    invoice_code: "HD260604",
    patient_name: "Phạm Thị D",
    issued_at: "2026-06-29T14:30:00Z",
    subtotal: 150000,
    discount_amount: 0,
    final_amount: 150000,
    status: "CANCELLED",
    items: [{ service_id: "s4", description: "Chụp X-quang", qty: 1, unit_price: 150000, amount: 150000 }]
  }
];

const statusConfig: Record<InvoiceStatus, { label: string, color: string }> = {
  PAID: { label: "Đã thanh toán", color: "border-green-200 bg-green-50 text-green-700" },
  UNPAID: { label: "Chờ thanh toán", color: "border-amber-200 bg-amber-50 text-amber-700" },
  CANCELLED: { label: "Đã hủy", color: "border-gray-200 bg-gray-50 text-gray-500" },
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  ONLINE: "Thẻ / Online",
};

export function FinancePageContent() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || inv.invoice_code.toLowerCase().includes(q) || inv.patient_name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter]);

  // Derived Stats
  const totalRevenue = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.final_amount, 0);
  const pendingCount = invoices.filter(i => i.status === "UNPAID").length;
  const cancelledCount = invoices.filter(i => i.status === "CANCELLED").length;

  return (
    <div className="space-y-6 p-6 md:p-8">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Doanh thu (Đã thu)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-2xl font-semibold text-brand-dark">{formatVND(totalRevenue)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Hóa đơn chờ thu</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-amber-600">{pendingCount}</p>
            <span className="text-sm text-muted-foreground">hóa đơn</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Hóa đơn đã hủy</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-500">{cancelledCount}</p>
            <span className="text-sm text-muted-foreground">hóa đơn</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, bệnh nhân..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "ALL")}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[180px]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="UNPAID">Chờ thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Xuất Excel
        </button>
      </div>

      {/* Invoice List */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="bg-muted/50 px-5 py-3 border-b border-border hidden sm:flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-[20%]">Mã Hóa Đơn</div>
          <div className="w-[25%]">Bệnh Nhân</div>
          <div className="w-[20%]">Trạng Thái</div>
          <div className="w-[20%] text-right pr-4">Tổng Tiền</div>
        </div>
        <div className="divide-y divide-border">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy hóa đơn nào phù hợp.
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div key={inv.id} className="group relative flex flex-col sm:flex-row sm:items-center p-4 hover:bg-muted/20 transition-colors gap-2 sm:gap-0">
                
                {/* ID & Date */}
                <div className="flex flex-col sm:w-[20%] shrink-0">
                  <span className="font-semibold text-brand-dark">{inv.invoice_code}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{formatDate(inv.issued_at)}</span>
                </div>
                
                {/* Patient */}
                <div className="flex flex-col sm:w-[25%] shrink-0">
                  <span className="font-medium text-brand-dark">{inv.patient_name}</span>
                  {inv.payment_method && (
                    <span className="text-xs text-muted-foreground mt-0.5">TT: {paymentLabels[inv.payment_method]}</span>
                  )}
                </div>
                
                {/* Status */}
                <div className="flex sm:w-[20%] shrink-0 items-center">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", statusConfig[inv.status].color)}>
                    {statusConfig[inv.status].label}
                  </span>
                </div>
                
                {/* Amount */}
                <div className="flex sm:w-[20%] shrink-0 sm:justify-end sm:pr-4">
                  <span className="font-mono font-medium text-brand-dark">{formatVND(inv.final_amount)}</span>
                </div>
                
                {/* Row Actions - Visible on Hover */}
                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white shadow-sm border border-border rounded-lg p-1">
                  <button 
                    type="button" 
                    title="Xem chi tiết"
                    onClick={() => setSelectedInvoice(inv)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-light hover:text-brand transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <div className="w-[1px] h-4 bg-border mx-1" />
                  <button 
                    type="button" 
                    title="In hóa đơn"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-brand-dark transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedInvoice(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white shadow-xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-dark">Chi tiết Hóa đơn</h3>
                <p className="text-sm text-muted-foreground font-mono">{selectedInvoice.invoice_code}</p>
              </div>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", statusConfig[selectedInvoice.status].color)}>
                {statusConfig[selectedInvoice.status].label}
              </span>
            </div>
            
            {/* Body */}
            <div className="overflow-y-auto px-6 py-4 space-y-6">
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bệnh nhân</p>
                  <p className="font-medium text-brand-dark">{selectedInvoice.patient_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày lập</p>
                  <p className="font-medium text-brand-dark">{formatDate(selectedInvoice.issued_at)}</p>
                </div>
                {selectedInvoice.payment_method && (
                  <div>
                    <p className="text-muted-foreground">Phương thức</p>
                    <p className="font-medium text-brand-dark">{paymentLabels[selectedInvoice.payment_method]}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-brand-dark mb-3">Dịch vụ điều trị</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b border-border flex text-xs font-semibold text-muted-foreground">
                    <div className="flex-1">Tên dịch vụ</div>
                    <div className="w-12 text-center">SL</div>
                    <div className="w-24 text-right">Đơn giá</div>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedInvoice.items.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 flex text-sm items-center">
                        <div className="flex-1 font-medium text-brand-dark line-clamp-2 pr-2">{item.description}</div>
                        <div className="w-12 text-center text-muted-foreground">{item.qty}</div>
                        <div className="w-24 text-right font-mono text-brand-dark">{formatVND(item.unit_price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính (Subtotal)</span>
                  <span className="font-mono">{formatVND(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá (Voucher)</span>
                  <span className="font-mono">-{formatVND(selectedInvoice.discount_amount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-brand-dark text-base pt-2 border-t border-border border-dashed">
                  <span>Thành tiền</span>
                  <span className="font-mono">{formatVND(selectedInvoice.final_amount)}</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-muted/20 rounded-b-2xl">
              <button type="button" onClick={() => setSelectedInvoice(null)} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]">
                Đóng
              </button>
              <button type="button" className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                In hóa đơn
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
