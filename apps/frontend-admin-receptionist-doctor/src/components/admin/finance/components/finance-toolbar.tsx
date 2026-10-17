"use client";

import { CalendarBlank, CreditCard, FileXls } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFilterSelect,
  AdminSearchInput,
  AdminToolbar,
  adminControlClass,
  adminControlTone,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type {
  DateRangePreset,
  InvoiceStatusFilter,
  PaymentMethodFilter,
} from "../types";

type FinanceToolbarProps = {
  search: string;
  statusFilter: InvoiceStatusFilter;
  paymentMethodFilter: PaymentMethodFilter;
  datePreset: DateRangePreset;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: InvoiceStatusFilter) => void;
  onPaymentMethodFilterChange: (value: PaymentMethodFilter) => void;
  onDatePresetChange: (value: DateRangePreset) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onExportExcel: () => void;
};

export function FinanceToolbar({
  search,
  statusFilter,
  paymentMethodFilter,
  datePreset,
  startDate,
  endDate,
  onSearchChange,
  onStatusFilterChange,
  onPaymentMethodFilterChange,
  onDatePresetChange,
  onStartDateChange,
  onEndDateChange,
  onExportExcel,
}: FinanceToolbarProps) {
  return (
    <div className="space-y-3">
      <AdminToolbar
        actions={
          <AdminButton
            variant="plain"
            onClick={onExportExcel}
            className="bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700"
          >
            <FileXls size={17} weight="bold" />
            Xuất Excel
          </AdminButton>
        }
      >
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Mã HĐ, bệnh nhân, bác sĩ..."
          className="w-full sm:max-w-xs"
        />
        <AdminFilterSelect
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as InvoiceStatusFilter)}
          aria-label="Lọc theo trạng thái"
          wrapperClassName="w-full sm:w-48"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="PARTIAL">Thanh toán một phần</option>
          <option value="UNPAID">Chờ thanh toán</option>
          <option value="CANCELLED">Đã hủy</option>
        </AdminFilterSelect>
        <AdminFilterSelect
          value={paymentMethodFilter}
          onChange={(event) => onPaymentMethodFilterChange(event.target.value as PaymentMethodFilter)}
          aria-label="Lọc theo phương thức thanh toán"
          icon={<CreditCard size={15} />}
          wrapperClassName="w-full sm:w-48"
        >
          <option value="ALL">Mọi phương thức</option>
          <option value="CASH">Tiền mặt</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="VIETQR">VietQR</option>
          <option value="VNPAY">VNPAY</option>
          <option value="MOMO">Ví MoMo</option>
          <option value="CARD">Quẹt thẻ</option>
        </AdminFilterSelect>
        <AdminFilterSelect
          value={datePreset}
          onChange={(event) => onDatePresetChange(event.target.value as DateRangePreset)}
          aria-label="Lọc theo thời gian"
          icon={<CalendarBlank size={15} />}
          wrapperClassName="w-full sm:w-44"
        >
          <option value="ALL">Mọi thời gian</option>
          <option value="TODAY">Hôm nay</option>
          <option value="THIS_WEEK">Tuần này</option>
          <option value="THIS_MONTH">Tháng này</option>
          <option value="CUSTOM">Tùy chỉnh ngày</option>
        </AdminFilterSelect>
      </AdminToolbar>

      {datePreset === "CUSTOM" ? (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <CalendarBlank size={14} />
            Khoảng ngày
          </span>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Từ ngày
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={cn(adminControlClass, adminControlTone(), "h-10 w-44")}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Đến ngày
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={cn(adminControlClass, adminControlTone(), "h-10 w-44")}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
