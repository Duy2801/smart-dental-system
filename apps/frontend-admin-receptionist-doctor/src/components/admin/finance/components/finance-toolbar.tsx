import type { InvoiceStatusFilter } from "../types";

type FinanceToolbarProps = {
  search: string;
  statusFilter: InvoiceStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: InvoiceStatusFilter) => void;
};

export function FinanceToolbar({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: FinanceToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
            placeholder="Tim ma hoa don, benh nhan..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as InvoiceStatusFilter)
          }
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[180px]"
        >
          <option value="ALL">Tat ca trang thai</option>
          <option value="PAID">Da thanh toan</option>
          <option value="UNPAID">Cho thanh toan</option>
          <option value="CANCELLED">Da huy</option>
        </select>
      </div>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
      >
        Xuat Excel
      </button>
    </div>
  );
}
