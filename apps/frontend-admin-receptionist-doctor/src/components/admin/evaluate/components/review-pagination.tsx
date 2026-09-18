import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type ReviewPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ReviewPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: ReviewPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <span className="text-xs font-medium text-muted-foreground">
        {total} đánh giá phù hợp
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Trang trước"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <span className="min-w-20 text-center text-xs font-semibold text-slate-700">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          title="Trang sau"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
