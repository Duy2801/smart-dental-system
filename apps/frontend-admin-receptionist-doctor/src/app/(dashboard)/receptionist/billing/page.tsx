"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import {
  MagnifyingGlass,
  Receipt,
  ReceiptX,
  Printer,
  CheckCircle,
  QrCode,
  Money,
  WarningCircle,
  Warning,
  Tag,
  X,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceLine {
  name: string;
  qty: number;
  price: number;
}

interface Invoice {
  id: string;
  patient: string;
  patientInitials: string;
  doctor: string;
  total: number;
  date: string;
  status: "UNPAID" | "PAID";
  services: ServiceLine[];
  paymentOption?: "DEPOSIT_30_PERCENT" | "PAY_AT_COUNTER";
}

type PaymentMethod = "TRANSFER" | "CASH";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {type === "success" ? (
        <CheckCircle size={16} weight="fill" className="shrink-0 text-emerald-600" />
      ) : (
        <Warning size={16} weight="fill" className="shrink-0 text-red-500" />
      )}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice list item
// ---------------------------------------------------------------------------

function InvoiceItem({
  inv,
  selected,
  onClick,
}: {
  inv: Invoice;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl p-4 transition-all border active:scale-[0.98]",
        selected
          ? "border-brand bg-white shadow-[0_0_0_2px_rgba(0,151,255,0.2)]"
          : "border-border bg-white hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand-dark">
            {inv.patientInitials}
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-bold truncate", selected ? "text-brand-dark" : "text-slate-900")}>
              {inv.patient}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">{inv.id}</p>
          </div>
        </div>
        <p className={cn("font-mono text-sm font-bold shrink-0", inv.status === "UNPAID" ? "text-red-600" : "text-emerald-600")}>
          {formatVND(inv.total)}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
        <p className="text-[11px] font-medium text-muted-foreground">{inv.doctor}</p>
        {inv.paymentOption === "DEPOSIT_30_PERCENT" && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Tag size={9} weight="fill" /> Đặt cọc 30%
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"UNPAID" | "PAID">("UNPAID");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [discountCode, setDiscountCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // fetch invoices
  useEffect(() => {
    const mapInv = (
      inv: {
        id: string;
        patient_name?: string;
        final_amount?: number;
        issued_at?: string;
        status?: string;
        items?: { description?: string; qty?: number; unit_price?: number }[];
      },
      forceStatus?: "UNPAID" | "PAID",
    ): Invoice => {
      const name = inv.patient_name ?? "—";
      return {
        id: inv.id,
        patient: name,
        patientInitials: getInitials(name),
        doctor: "—",
        total: Number(inv.final_amount ?? 0),
        date: inv.issued_at
          ? new Date(inv.issued_at).toLocaleDateString("vi-VN")
          : "",
        status:
          forceStatus ??
          (inv.status === "PAID" ? "PAID" : "UNPAID"),
        services: (inv.items ?? []).map((it) => ({
          name: it.description ?? "Dịch vụ",
          qty: Number(it.qty ?? 1),
          price: Number(it.unit_price ?? 0),
        })),
      };
    };

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const [unpaidRes, paidRes] = await Promise.all([
          apiClient.get(`/invoices?status=UNPAID`),
          apiClient.get(`/invoices?status=PAID`),
        ]);
        const unpaid = (Array.isArray(unpaidRes.data) ? unpaidRes.data : []).map(
          (i: Parameters<typeof mapInv>[0]) => mapInv(i, "UNPAID"),
        );
        const paid = (Array.isArray(paidRes.data) ? paidRes.data : []).map(
          (i: Parameters<typeof mapInv>[0]) => mapInv(i, "PAID"),
        );
        const all = [...unpaid, ...paid];
        setInvoices(all);
        setSelected(all.find((i) => i.status === "UNPAID") ?? all[0] ?? null);
      } catch {
        setInvoices([]);
        setSelected(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // derived
  const filtered = invoices.filter((inv) => {
    if (inv.status !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.patient.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q)
    );
  });

  const unpaidCount = invoices.filter((i) => i.status === "UNPAID").length;

  // confirm payment — backend payments chưa có, cập nhật local khi API lỗi
  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiClient.post("/payments", {
        invoiceId: selected.id,
        method: paymentMethod === "TRANSFER" ? "BANK_TRANSFER" : "CASH",
        amount: selected.total,
      });
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selected.id ? { ...inv, status: "PAID" } : inv
        )
      );
      setSelected((prev) => (prev ? { ...prev, status: "PAID" } : prev));
      showToast("Đã thu tiền thành công!", "success");
    } catch {
      showToast("API thanh toán chưa sẵn sàng trên backend.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (tab: "UNPAID" | "PAID") => {
    setActiveTab(tab);
    const first = invoices.find((i) => i.status === tab);
    if (first) setSelected(first);
  };

  return (
    <>
      <Header
        title="Thanh toán"
        description="Thu tiền khách hàng sau điều trị và xuất hóa đơn."
      />

      <div className="bg-muted min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">

            {/* ── DANH SÁCH HÓA ĐƠN (4/12) ─────────────────────── */}
            <div className="lg:col-span-4 rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)]">

              {/* Search + Tabs */}
              <div className="border-b border-border p-4 space-y-3">
                <div className="relative">
                  <MagnifyingGlass
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tên khách, mã hóa đơn..."
                    className="w-full rounded-lg border border-border bg-muted py-2 pl-8 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 gap-1">
                  <button
                    onClick={() => switchTab("UNPAID")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all",
                      activeTab === "UNPAID"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                        : "text-muted-foreground hover:text-slate-900"
                    )}
                  >
                    Chờ thu
                    {unpaidCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                        {unpaidCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => switchTab("PAID")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all",
                      activeTab === "PAID"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                        : "text-muted-foreground hover:text-slate-900"
                    )}
                  >
                    Đã thu xong
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl animate-pulse bg-slate-100" />
                  ))
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <ReceiptX size={32} className="text-slate-300" />
                    <p className="text-sm font-medium">Không có hóa đơn nào</p>
                  </div>
                ) : (
                  filtered.map((inv) => (
                    <InvoiceItem
                      key={inv.id}
                      inv={inv}
                      selected={selected?.id === inv.id}
                      onClick={() => setSelected(inv)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── CHI TIẾT HÓA ĐƠN (8/12) ──────────────────────── */}
            <div className="lg:col-span-8">
              {!selected ? (
                <div className="rounded-2xl border border-border bg-white shadow-sm flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                  <ReceiptX size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">Chọn hóa đơn để xem chi tiết</p>
                </div>
              ) : (
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">

                {/* Header chi tiết */}
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Chi tiết phiếu thu</h2>
                    <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                      {selected.id} · {selected.date}
                    </p>
                  </div>
                  {selected.status === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <CheckCircle size={14} weight="fill" /> Đã thanh toán
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20 animate-pulse">
                      <WarningCircle size={14} weight="fill" /> Chờ thanh toán
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-6">

                  {/* Khách hàng + Bác sĩ */}
                  <div className="grid grid-cols-2 gap-px rounded-xl border border-border overflow-hidden bg-border">
                    <div className="bg-white px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Khách hàng</p>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                          {selected.patientInitials}
                        </div>
                        <p className="font-bold text-slate-900">{selected.patient}</p>
                      </div>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Bác sĩ điều trị</p>
                      <span className="inline-flex items-center rounded-md bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark ring-1 ring-inset ring-brand/20">
                        {selected.doctor}
                      </span>
                    </div>
                  </div>

                  {/* Bảng dịch vụ */}
                  <div>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="border-b border-border bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3">Dịch vụ</th>
                            <th className="px-5 py-3 text-center w-16">SL</th>
                            <th className="px-5 py-3 text-right">Đơn giá</th>
                            <th className="px-5 py-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {selected.services.map((svc, i) => (
                            <tr key={i} className="transition-colors hover:bg-muted/40">
                              <td className="px-5 py-3.5 font-semibold text-slate-900">{svc.name}</td>
                              <td className="px-5 py-3.5 text-center font-mono text-sm text-slate-600">{svc.qty}</td>
                              <td className="px-5 py-3.5 text-right font-mono text-sm text-slate-600">{formatVND(svc.price)}</td>
                              <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-slate-900">{formatVND(svc.qty * svc.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Phương thức + Tổng tiền */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {/* Phương thức thanh toán */}
                    <div className={cn(selected.status === "PAID" && "pointer-events-none opacity-50 grayscale")}>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Phương thức thanh toán
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: "TRANSFER", label: "Chuyển khoản", icon: QrCode },
                            { id: "CASH", label: "Tiền mặt", icon: Money },
                          ] as const
                        ).map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            onClick={() => setPaymentMethod(id)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all active:scale-[0.98]",
                              paymentMethod === id
                                ? "border-brand bg-brand text-white shadow-sm"
                                : "border-border bg-white text-slate-600 hover:border-brand/40 hover:bg-brand/5"
                            )}
                          >
                            <Icon size={18} weight={paymentMethod === id ? "fill" : "regular"} />
                            <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* QR preview */}
                      {paymentMethod === "TRANSFER" && selected.status === "UNPAID" && (
                        <div className="mt-3 flex items-center gap-4 rounded-xl border border-dashed border-border bg-muted p-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-white shadow-sm">
                            <QrCode size={28} className="text-brand" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Mã QR thanh toán</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Yêu cầu khách mở App ngân hàng để quét.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tổng tiền — bg-brand-dark thay vì slate-900 */}
                    <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-5 shadow-lg">
                      {/* Decorative orb */}
                      <div
                        className={cn(
                          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-30",
                          selected.status === "UNPAID" ? "bg-rose-400" : "bg-brand"
                        )}
                      />

                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 font-medium">Tổng cộng</span>
                          <span className="font-mono font-bold text-slate-200">{formatVND(selected.total)}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 font-medium">Khuyến mãi</span>
                          {selected.status === "UNPAID" ? (
                            <input
                              type="text"
                              placeholder="Mã giảm giá"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value)}
                              className="w-28 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-right font-mono text-xs text-white outline-none placeholder:text-slate-600 focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                            />
                          ) : (
                            <span className="font-mono font-bold text-emerald-400">0đ</span>
                          )}
                        </div>

                        {/* Dashed separator */}
                        <div className="relative my-2 border-t border-dashed border-slate-700/60 pt-4">
                          <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-muted" />
                          <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-muted" />

                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Thành tiền</p>
                              <p className="text-xs font-bold text-slate-300 mt-0.5">Khách cần trả</p>
                            </div>
                            <span
                              className={cn(
                                "font-mono text-3xl font-black tracking-tighter",
                                selected.status === "UNPAID" ? "text-rose-400" : "text-emerald-400"
                              )}
                            >
                              {formatVND(selected.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-muted active:scale-[0.98]">
                      <Printer size={15} />
                      In hóa đơn
                    </button>
                    {selected.status === "UNPAID" && (
                      <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Receipt size={16} weight="fill" />
                        {submitting ? "Đang xử lý..." : "Xác nhận đã thu tiền"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
