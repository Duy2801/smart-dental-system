"use client";

import { useMemo, useState } from "react";
import {
  BillingSupport,
  PaymentMethods,
  PaymentSummary,
  TransactionHistory,
} from "@/features/dashboard/payment";
import type {
  PaymentMethod,
  PaymentStatusFilter,
  Transaction,
} from "@/features/dashboard/payment";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { LoginRequiredPanel } from "@/features/dashboard/common/LoginRequiredPanel";
import { useAppSelector } from "@/providers";

const SUBTOTAL = 2_450_000;
const PROMO_DISCOUNT = 100_000;
const VALID_PROMO_CODE = "DENTA100";

const paymentMethods: PaymentMethod[] = [
  { id: "visa-4242", type: "visa", name: "Visa •••• 4242", detail: "Thẻ tín dụng", note: "Hết hạn 12/26" },
  { id: "momo", type: "momo", name: "Ví MoMo", detail: "090 ••• 1234", note: "Đã liên kết" },
];

const transactions: Transaction[] = [
  { id: "1", service: "Kiểm tra định kỳ & Vệ sinh răng", invoiceCode: "INV-2024-089", date: "15 Th05, 2024", amount: 850_000, status: "paid" },
  { id: "2", service: "Điều trị tủy (Răng 46)", invoiceCode: "INV-2024-072", date: "02 Th05, 2024", amount: 2_450_000, status: "pending" },
  { id: "3", service: "Chụp X-quang 3D CT Cone Beam", invoiceCode: "INV-2024-065", date: "24 Th04, 2024", amount: 1_200_000, status: "paid" },
  { id: "4", service: "Tẩy trắng răng Laser", invoiceCode: "INV-2024-058", date: "10 Th04, 2024", amount: 3_500_000, status: "failed" },
];

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export default function PaymentPage() {
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.login);
  const isLoggedIn = isAuthenticated && Boolean(accessToken);
  const [selectedMethodId, setSelectedMethodId] = useState(paymentMethods[0].id);
  const [promoCode, setPromoCode] = useState(VALID_PROMO_CODE);
  const [discount, setDiscount] = useState(PROMO_DISCOUNT);
  const [promoMessage, setPromoMessage] = useState<string | null>("Đã áp dụng mã thành công");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);

  const total = SUBTOTAL - discount;
  const visibleTransactions = useMemo(
    () => statusFilter === "all" ? transactions : transactions.filter((item) => item.status === statusFilter),
    [statusFilter],
  );

  const applyPromoCode = () => {
    const isValid = promoCode.trim().toUpperCase() === VALID_PROMO_CODE;
    setDiscount(isValid ? PROMO_DISCOUNT : 0);
    setPromoMessage(isValid ? "Đã áp dụng mã thành công" : "Mã giảm giá không hợp lệ");
  };

  const payNow = () => {
    const selectedMethod = paymentMethods.find((method) => method.id === selectedMethodId);
    setNotice(`Đang chuyển đến bước xác nhận thanh toán qua ${selectedMethod?.name ?? "phương thức đã chọn"}.`);
  };

  const downloadInvoice = (transaction: Transaction) => {
    setNotice(`Đang chuẩn bị hóa đơn ${transaction.invoiceCode}.`);
  };

  if (!isLoggedIn) {
    return (
      <LoginRequiredPanel
        title="Xem thanh toán và hóa đơn"
        description="Đăng nhập để xem hóa đơn, lịch sử giao dịch, phương thức thanh toán và các khoản cần thanh toán của bạn."
        loginLabel="Đăng nhập để xem thanh toán"
        redirectTo="/payment"
        secondaryHref="/service"
        secondaryLabel="Xem dịch vụ"
        icon="shield"
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0863c5]">Thanh toán &amp; Hóa đơn</h1>
          <p className="mt-1 text-xs text-slate-500">Quản lý tài chính nha khoa và các đặc quyền thành viên của bạn.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-semibold text-[#0863c5] sm:self-auto">
          <DashboardIcon name="sparkles" className="h-4 w-4" />
          Bảo hiểm của bạn đã giúp tiết kiệm 15% trong tháng này.
        </div>
      </div>

      <div className="mt-5 space-y-7">
        <PaymentSummary
          service="Điều trị tủy (Răng 46)"
          invoiceCode="INV-2024-072"
          subtotal={SUBTOTAL}
          discount={discount}
          total={total}
          points={1_250}
          promoCode={promoCode}
          promoMessage={promoMessage}
          onPromoCodeChange={(value) => {
            setPromoCode(value);
            setPromoMessage(null);
          }}
          onApplyPromo={applyPromoCode}
        />

        <PaymentMethods
          methods={paymentMethods}
          selectedId={selectedMethodId}
          onSelect={setSelectedMethodId}
          onAddMethod={() => setNotice("Tính năng thêm phương thức thanh toán đang được hoàn thiện.")}
        />

        <button
          type="button"
          onClick={payNow}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0756aa]"
        >
          <DashboardIcon name="shield" className="h-5 w-5" />
          Xác nhận &amp; Thanh toán ngay ({currency.format(total)})
        </button>

        {notice && (
          <div role="status" className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="shrink-0 font-bold hover:underline">Đóng</button>
          </div>
        )}

        <TransactionHistory
          transactions={visibleTransactions}
          filter={statusFilter}
          onFilterChange={setStatusFilter}
          onDownload={downloadInvoice}
        />

        <BillingSupport />
      </div>
    </main>
  );
}
