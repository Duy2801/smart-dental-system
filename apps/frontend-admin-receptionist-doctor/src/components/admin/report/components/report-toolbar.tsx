import type { ReportTimeFilter } from "../types";

type ReportToolbarProps = {
  disabled?: boolean;
  onExport: () => void;
  timeFilter: ReportTimeFilter;
  onTimeFilterChange: (value: ReportTimeFilter) => void;
};

export function ReportToolbar({
  disabled = false,
  onExport,
  timeFilter,
  onTimeFilterChange,
}: ReportToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <h2 className="text-lg font-semibold text-brand-dark">
          Tong quan thong ke
        </h2>
      </div>

      <div className="flex gap-3">
        <select
          value={timeFilter}
          onChange={(event) =>
            onTimeFilterChange(event.target.value as ReportTimeFilter)
          }
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option value="this_month">Thang nay</option>
          <option value="last_month">Thang truoc</option>
          <option value="this_quarter">Quy nay</option>
          <option value="this_year">Nam nay</option>
        </select>
        <button
          type="button"
          disabled={disabled}
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <svg
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Xuat bao cao
        </button>
      </div>
    </div>
  );
}
