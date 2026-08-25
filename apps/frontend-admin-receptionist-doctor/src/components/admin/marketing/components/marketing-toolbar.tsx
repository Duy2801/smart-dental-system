import type { BannerStatusFilter } from "../types";

type BannerToolbarProps = {
  onAddClick: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: BannerStatusFilter) => void;
  search: string;
  statusFilter: BannerStatusFilter;
};

export function MarketingToolbar({
  onAddClick,
  onSearchChange,
  onStatusFilterChange,
  search,
  statusFilter,
}: BannerToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative w-full sm:max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung banner..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-border/80 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as BannerStatusFilter)
          }
          className="rounded-xl border border-border/80 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 min-w-[170px]"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hiển thị</option>
          <option value="INACTIVE">Đã tạm ẩn</option>
        </select>
      </div>

      {/* Add Banner Button */}
      <button
        type="button"
        onClick={onAddClick}
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-dark hover:shadow-md active:scale-[0.98]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Thêm Banner Mới
      </button>
    </div>
  );
}
