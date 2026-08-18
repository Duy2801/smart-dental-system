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
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Keyword Search */}
        <div className="relative w-full lg:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Mã HD, bệnh nhân, bác sĩ..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as InvoiceStatusFilter)
            }
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">✅ Đã thanh toán</option>
            <option value="PARTIAL">🔷 Thanh toán 1 phần</option>
            <option value="UNPAID">⏳ Chờ thanh toán</option>
            <option value="CANCELLED">🛑 Đã hủy</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(event) =>
              onPaymentMethodFilterChange(event.target.value as PaymentMethodFilter)
            }
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
          >
            <option value="ALL">Tất cả p.thức TT</option>
            <option value="CASH">💵 Tiền mặt</option>
            <option value="BANK_TRANSFER">🏦 Chuyển khoản</option>
            <option value="VIETQR">📲 VietQR</option>
            <option value="VNPAY">💳 VNPAY</option>
            <option value="MOMO">🟣 Ví MoMo</option>
            <option value="CARD">💳 Quẹt thẻ</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={datePreset}
            onChange={(event) =>
              onDatePresetChange(event.target.value as DateRangePreset)
            }
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="TODAY">📅 Hôm nay</option>
            <option value="THIS_WEEK">📆 Tuần này</option>
            <option value="THIS_MONTH">🗓️ Tháng này</option>
            <option value="CUSTOM">⚙️ Tùy chỉnh ngày</option>
          </select>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.98]"
          >
            <span>📊</span> Xuất Báo Cáo Excel
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker inputs when datePreset === 'CUSTOM' */}
      {datePreset === "CUSTOM" && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm font-medium text-slate-700 animate-in fade-in duration-150">
          <span className="text-xs font-bold text-slate-500 uppercase">Khoảng ngày:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold outline-none focus:border-brand"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold outline-none focus:border-brand"
            />
          </div>
        </div>
      )}
    </div>
  );
}
