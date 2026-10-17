"use client";

import { HourglassMedium, Receipt, Wallet, XCircle } from "@phosphor-icons/react";
import { AdminStatCard } from "@/src/components/admin/common";
import { formatVND } from "../finance-utils";

type FinanceSummaryCardsProps = {
  cancelledCount: number;
  pendingCount: number;
  totalRevenue: number;
  totalInvoices?: number;
};

export function FinanceSummaryCards({
  cancelledCount,
  pendingCount,
  totalRevenue,
  totalInvoices = 0,
}: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard
        label="Doanh thu thực thu"
        value={formatVND(totalRevenue)}
        hint="Theo bộ lọc hiện tại"
        icon={<Wallet size={22} weight="duotone" />}
        tone="emerald"
      />
      <AdminStatCard
        label="Chờ / chưa thu xong"
        value={pendingCount}
        suffix="hóa đơn"
        hint="Cần theo dõi công nợ"
        icon={<HourglassMedium size={22} weight="duotone" />}
        tone="amber"
      />
      <AdminStatCard
        label="Hóa đơn đã hủy"
        value={cancelledCount}
        suffix="hóa đơn"
        icon={<XCircle size={22} weight="duotone" />}
        tone="slate"
      />
      <AdminStatCard
        label="Tổng số hóa đơn"
        value={totalInvoices}
        suffix="hóa đơn"
        icon={<Receipt size={22} weight="duotone" />}
        tone="brand"
      />
    </div>
  );
}
