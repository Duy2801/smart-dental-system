"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  SpinnerGap,
  Copy,
} from "@phosphor-icons/react";

interface ServiceLine {
  name: string;
  qty: number;
  price: number;
}

interface Invoice {
  id: string;
  code: string;
  patient: string;
  patientInitials: string;
  doctor: string;
  total: number;
  discount: number;
  date: string;
  status: "UNPAID" | "PAID";
  services: ServiceLine[];
  paymentOption?: "DEPOSIT_30_PERCENT" | "PAY_AT_COUNTER";
}

type PaymentMethod = "TRANSFER" | "CASH";

type TransferSession = {
  paymentId: string;
  qrImageUrl: string;
  transferContent: string;
  bankAccountNo: string;
  bankAccountName: string;
  bankName: string;
  amount: number;
};

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

function doctorLabel(name: string) {
  if (!name || name === "—") return "—";
  return /^bs\.?\s/i.test(name) ? name : `BS. ${name}`;
}

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
          : "border-red-200 bg-red-50 text-red-800",
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
        "w-full rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
        selected
          ? "border-brand bg-white shadow-[0_0_0_2px_rgba(0,151,255,0.2)]"
          : "border-border bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand-dark">
            {inv.patientInitials}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-bold",
                selected ? "text-brand-dark" : "text-slate-900",
              )}
            >
              {inv.patient}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {inv.code}
            </p>
          </div>
        </div>
        <p
          className={cn(
            "shrink-0 font-mono text-sm font-bold",
            inv.status === "UNPAID" ? "text-red-600" : "text-emerald-600",
          )}
        >
          {formatVND(inv.total)}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
        <p className="text-[11px] font-medium text-muted-foreground">
          {doctorLabel(inv.doctor)}
        </p>
        {inv.paymentOption === "DEPOSIT_30_PERCENT" && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Tag size={9} weight="fill" /> Đặt cọc
          </span>
        )}
      </div>
    </button>
  );
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"UNPAID" | "PAID">("UNPAID");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [discountCode, setDiscountCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transfer, setTransfer] = useState<TransferSession | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const mapInv = useCallback(
    (
      inv: {
        id: string;
        invoice_code?: string;
        patient_name?: string;
        doctor_name?: string | null;
        final_amount?: number;
        discount_amount?: number;
        issued_at?: string;
        status?: string;
        payment_option?: "DEPOSIT_30_PERCENT" | "PAY_AT_COUNTER";
        items?: { description?: string; qty?: number; unit_price?: number }[];
      },
      forceStatus?: "UNPAID" | "PAID",
    ): Invoice => {
      const name = inv.patient_name ?? "—";
      return {
        id: inv.id,
        code: inv.invoice_code ?? inv.id.slice(0, 8).toUpperCase(),
        patient: name,
        patientInitials: getInitials(name),
        doctor: inv.doctor_name ?? "—",
        total: Number(inv.final_amount ?? 0),
        discount: Number(inv.discount_amount ?? 0),
        date: inv.issued_at
          ? new Date(inv.issued_at).toLocaleDateString("vi-VN")
          : "",
        status: forceStatus ?? (inv.status === "PAID" ? "PAID" : "UNPAID"),
        paymentOption: inv.payment_option,
        services: (inv.items ?? []).map((it) => ({
          name: it.description ?? "Dịch vụ",
          qty: Number(it.qty ?? 1),
          price: Number(it.unit_price ?? 0),
        })),
      };
    },
    [],
  );

  const fetchInvoices = useCallback(async () => {
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
      setSelected((prev) => {
        if (prev) {
          const fresh = all.find((i) => i.id === prev.id);
          if (fresh) return fresh;
        }
        return all.find((i) => i.status === "UNPAID") ?? all[0] ?? null;
      });
    } catch {
      setInvoices([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [mapInv]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPoll(), []);

  const markLocalPaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "PAID" as const } : inv,
      ),
    );
    setSelected((prev) =>
      prev?.id === invoiceId ? { ...prev, status: "PAID" } : prev,
    );
    setTransfer(null);
    stopPoll();
  };

  const startTransfer = async (invoice: Invoice, promo?: string) => {
    setTransferLoading(true);
    setTransfer(null);
    try {
      const res = await apiClient.post<{
        id: string;
        qrImageUrl: string;
        transferContent: string;
        bankAccountNo: string;
        bankAccountName: string;
        bankName: string;
        amount: number;
        status: string;
      }>("/payments", {
        invoiceId: invoice.id,
        method: "BANK_TRANSFER",
        amount: invoice.total,
        promotionCode: promo?.trim() || undefined,
      });
      const data = res.data;
      if (!data?.id) throw new Error("missing payment");
      if (data.status === "SUCCESS") {
        markLocalPaid(invoice.id);
        showToast("Thanh toán đã được ghi nhận!", "success");
        return;
      }
      setTransfer({
        paymentId: data.id,
        qrImageUrl: data.qrImageUrl,
        transferContent: data.transferContent,
        bankAccountNo: data.bankAccountNo,
        bankAccountName: data.bankAccountName,
        bankName: data.bankName,
        amount: Number(data.amount),
      });

      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const st = await apiClient.get<{ status: string }>(
            `/payments/${data.id}`,
          );
          if (st.data?.status === "SUCCESS") {
            markLocalPaid(invoice.id);
            showToast("SePay xác nhận đã nhận tiền!", "success");
            void fetchInvoices();
          }
        } catch {
          // ignore poll errors
        }
      }, 4000);
    } catch {
      showToast("Không tạo được QR chuyển khoản SePay.", "error");
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    stopPoll();
    setTransfer(null);
    setDiscountCode("");
    if (
      selected?.status === "UNPAID" &&
      paymentMethod === "TRANSFER"
    ) {
      void startTransfer(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, paymentMethod]);

  const handleConfirm = async () => {
    if (!selected || selected.status !== "UNPAID") return;
    setSubmitting(true);
    try {
      if (paymentMethod === "CASH") {
        await apiClient.post("/payments", {
          invoiceId: selected.id,
          method: "CASH",
          amount: selected.total,
          promotionCode: discountCode.trim() || undefined,
        });
        markLocalPaid(selected.id);
        showToast("Đã thu tiền mặt thành công!", "success");
        void fetchInvoices();
      } else if (transfer?.paymentId) {
        await apiClient.patch(`/payments/${transfer.paymentId}/confirm`);
        markLocalPaid(selected.id);
        showToast("Đã xác nhận chuyển khoản thành công!", "success");
        void fetchInvoices();
      } else {
        await startTransfer(selected, discountCode);
        showToast("Đã tạo QR. Chờ SePay hoặc bấm xác nhận sau khi nhận tiền.", "success");
      }
    } catch {
      showToast("Thu tiền thất bại. Thử lại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const applyPromo = async () => {
    if (!selected || !discountCode.trim() || paymentMethod !== "TRANSFER") {
      return;
    }
    await startTransfer(selected, discountCode);
  };

  const filtered = invoices.filter((inv) => {
    if (inv.status !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.patient.toLowerCase().includes(q) ||
      inv.code.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q)
    );
  });

  const unpaidCount = invoices.filter((i) => i.status === "UNPAID").length;

  const switchTab = (tab: "UNPAID" | "PAID") => {
    setActiveTab(tab);
    const first = invoices.find((i) => i.status === tab);
    if (first) setSelected(first);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Đã sao chép", "success");
    } catch {
      showToast("Không sao chép được", "error");
    }
  };

  return (
    <>
      <Header
        title="Thanh toán"
        description="Thu tiền khách hàng — tiền mặt hoặc chuyển khoản SePay."
      />

      <div className="min-h-screen bg-muted p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm lg:col-span-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)]">
              <div className="space-y-3 border-b border-border p-4">
                <div className="relative">
                  <MagnifyingGlass
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tên khách, mã hóa đơn..."
                    className="w-full rounded-lg border border-border bg-muted py-2 pl-8 pr-4 text-sm font-medium outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <button
                    onClick={() => switchTab("UNPAID")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all",
                      activeTab === "UNPAID"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                        : "text-muted-foreground hover:text-slate-900",
                    )}
                  >
                    Chờ thu
                    {unpaidCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
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
                        : "text-muted-foreground hover:text-slate-900",
                    )}
                  >
                    Đã thu xong
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-xl bg-slate-100"
                    />
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

            <div className="lg:col-span-8">
              {!selected ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-white py-24 text-muted-foreground shadow-sm">
                  <ReceiptX size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">
                    Chọn hóa đơn để xem chi tiết
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Chi tiết phiếu thu
                      </h2>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {selected.code} · {selected.date}
                      </p>
                    </div>
                    {selected.status === "PAID" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircle size={14} weight="fill" /> Đã thanh toán
                      </span>
                    ) : (
                      <span className="inline-flex animate-pulse items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                        <WarningCircle size={14} weight="fill" /> Chờ thanh toán
                      </span>
                    )}
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                      <div className="bg-white px-5 py-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Khách hàng
                        </p>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                            {selected.patientInitials}
                          </div>
                          <p className="font-bold text-slate-900">
                            {selected.patient}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white px-5 py-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Bác sĩ điều trị
                        </p>
                        <span className="inline-flex items-center rounded-md bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark ring-1 ring-inset ring-brand/20">
                          {doctorLabel(selected.doctor)}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="border-b border-border bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3">Dịch vụ</th>
                            <th className="w-16 px-5 py-3 text-center">SL</th>
                            <th className="px-5 py-3 text-right">Đơn giá</th>
                            <th className="px-5 py-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {selected.services.map((svc, i) => (
                            <tr key={i} className="hover:bg-muted/40">
                              <td className="px-5 py-3.5 font-semibold text-slate-900">
                                {svc.name}
                              </td>
                              <td className="px-5 py-3.5 text-center font-mono text-sm text-slate-600">
                                {svc.qty}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-sm text-slate-600">
                                {formatVND(svc.price)}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-slate-900">
                                {formatVND(svc.qty * svc.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div
                        className={cn(
                          selected.status === "PAID" &&
                            "pointer-events-none opacity-50 grayscale",
                        )}
                      >
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Phương thức thanh toán
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { id: "TRANSFER", label: "Chuyển khoản SePay", icon: QrCode },
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
                                  : "border-border bg-white text-slate-600 hover:border-brand/40 hover:bg-brand/5",
                              )}
                            >
                              <Icon
                                size={18}
                                weight={
                                  paymentMethod === id ? "fill" : "regular"
                                }
                              />
                              <span className="text-center text-[10px] font-bold leading-tight">
                                {label}
                              </span>
                            </button>
                          ))}
                        </div>

                        {paymentMethod === "TRANSFER" &&
                          selected.status === "UNPAID" && (
                            <div className="mt-3 space-y-3 rounded-xl border border-dashed border-border bg-muted p-4">
                              {transferLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <SpinnerGap
                                    size={18}
                                    className="animate-spin text-brand"
                                  />
                                  Đang tạo QR SePay...
                                </div>
                              ) : transfer ? (
                                <>
                                  <div className="flex items-start gap-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={transfer.qrImageUrl}
                                      alt="QR chuyển khoản SePay"
                                      className="h-28 w-28 rounded-lg border border-border bg-white object-contain"
                                    />
                                    <div className="min-w-0 space-y-1.5 text-xs">
                                      <p className="text-sm font-bold text-slate-900">
                                        Quét QR VietQR (SePay)
                                      </p>
                                      <p className="text-muted-foreground">
                                        {transfer.bankName} ·{" "}
                                        {transfer.bankAccountNo}
                                      </p>
                                      <p className="font-medium text-slate-700">
                                        {transfer.bankAccountName}
                                      </p>
                                      <p className="font-mono font-bold text-brand-dark">
                                        {formatVND(transfer.amount)}
                                      </p>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground">
                                          ND:
                                        </span>
                                        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold">
                                          {transfer.transferContent}
                                        </code>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void copyText(
                                              transfer.transferContent,
                                            )
                                          }
                                          className="text-brand hover:text-brand-dark"
                                        >
                                          <Copy size={12} />
                                        </button>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground">
                                        Tự cập nhật khi SePay gửi webhook, hoặc
                                        bấm xác nhận thủ công.
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Không tạo được QR. Kiểm tra cấu hình SePay.
                                </p>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-5 shadow-lg">
                        <div
                          className={cn(
                            "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl",
                            selected.status === "UNPAID"
                              ? "bg-rose-400"
                              : "bg-brand",
                          )}
                        />
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-400">
                              Tổng cộng
                            </span>
                            <span className="font-mono font-bold text-slate-200">
                              {formatVND(selected.total + selected.discount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-400">
                              Khuyến mãi
                            </span>
                            {selected.status === "UNPAID" ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Mã giảm giá"
                                  value={discountCode}
                                  onChange={(e) =>
                                    setDiscountCode(e.target.value)
                                  }
                                  className="w-24 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-right font-mono text-xs text-white outline-none placeholder:text-slate-600 focus:border-brand"
                                />
                                {paymentMethod === "TRANSFER" && (
                                  <button
                                    type="button"
                                    onClick={() => void applyPromo()}
                                    className="rounded-lg bg-brand px-2 py-1.5 text-[10px] font-bold text-white"
                                  >
                                    Áp
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-emerald-400">
                                {formatVND(selected.discount)}
                              </span>
                            )}
                          </div>
                          <div className="relative my-2 border-t border-dashed border-slate-700/60 pt-4">
                            <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-muted" />
                            <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-muted" />
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                  Thành tiền
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-slate-300">
                                  Khách cần trả
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "font-mono text-3xl font-black tracking-tighter",
                                  selected.status === "UNPAID"
                                    ? "text-rose-400"
                                    : "text-emerald-400",
                                )}
                              >
                                {formatVND(
                                  transfer?.amount ?? selected.total,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-muted"
                      >
                        <Printer size={15} />
                        In hóa đơn
                      </button>
                      {selected.status === "UNPAID" && (
                        <button
                          onClick={() => void handleConfirm()}
                          disabled={
                            submitting ||
                            (paymentMethod === "TRANSFER" &&
                              !transfer &&
                              transferLoading)
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Receipt size={16} weight="fill" />
                          {submitting
                            ? "Đang xử lý..."
                            : paymentMethod === "CASH"
                              ? "Xác nhận thu tiền mặt"
                              : "Xác nhận đã nhận CK"}
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
