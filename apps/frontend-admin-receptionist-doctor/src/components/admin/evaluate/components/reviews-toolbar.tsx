import type { RatingFilter, VisibilityFilter } from "../types";

type ReviewsToolbarProps = {
  search: string;
  ratingFilter: RatingFilter;
  visibilityFilter: VisibilityFilter;
  onSearchChange: (value: string) => void;
  onRatingFilterChange: (value: RatingFilter) => void;
  onVisibilityFilterChange: (value: VisibilityFilter) => void;
};

export function ReviewsToolbar({
  search,
  ratingFilter,
  visibilityFilter,
  onSearchChange,
  onRatingFilterChange,
  onVisibilityFilterChange,
}: ReviewsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-md">
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
          placeholder="Tim theo ten benh nhan hoac noi dung..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <div className="flex gap-3">
        <select
          value={ratingFilter}
          onChange={(event) =>
            onRatingFilterChange(event.target.value as RatingFilter)
          }
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option value="ALL">Moi so sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">Tu 3 sao tro xuong</option>
        </select>
        <select
          value={visibilityFilter}
          onChange={(event) =>
            onVisibilityFilterChange(event.target.value as VisibilityFilter)
          }
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option value="ALL">Tat ca trang thai</option>
          <option value="VISIBLE">Dang hien thi</option>
          <option value="HIDDEN">Da an</option>
        </select>
      </div>
    </div>
  );
}
