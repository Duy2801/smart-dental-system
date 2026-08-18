import type { PromotionStatusFilter } from "../types";

type PromotionToolbarProps = {
  search: string;
  statusFilter: PromotionStatusFilter;
  onAddClick: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: PromotionStatusFilter) => void;
};

export function PromotionToolbar({
  search,
  statusFilter,
  onAddClick,
  onSearchChange,
  onStatusFilterChange,
}: PromotionToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
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
            placeholder="Tìm theo mã hoặc tên voucher..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm font-medium outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as PromotionStatusFilter)
          }
          className="rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[180px] shadow-xs"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">⚡ Đang diễn ra</option>
          <option value="EXPIRED">🛑 Đã kết thúc / Hết lượt</option>
          <option value="PAUSED">⏸️ Tạm ngưng</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onAddClick}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow active:scale-[0.98]"
      >
        <span>➕</span> Tạo mã Voucher mới
      </button>
    </div>
  );
}
