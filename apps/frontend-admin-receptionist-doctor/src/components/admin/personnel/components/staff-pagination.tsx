import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

type StaffPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  roleFilter: string;
  onPageChange: (page: number) => void;
};

export function StaffPagination({
  page,
  totalPages,
  total,
  limit,
  roleFilter,
  onPageChange,
}: StaffPaginationProps) {
  if (total === 0) return null;

  const roleLabel =
    roleFilter === "DOCTOR"
      ? "bác sĩ"
      : roleFilter === "RECEPTIONIST"
        ? "lễ tân"
        : roleFilter === "ADMIN"
          ? "quản trị viên"
          : "nhân sự";

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(page - 1);
      pages.push(page);
      pages.push(page + 1);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row">
      <span className="text-xs font-medium text-muted-foreground">
        Hiển thị{" "}
        <span className="font-bold text-slate-800">
          {start}-{end}
        </span>{" "}
        / <span className="font-bold text-slate-800">{total}</span> {roleLabel}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title="Trang trước"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        {pages.map((item, idx) =>
          item === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-8 w-6 items-center justify-center text-xs font-semibold text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors",
                page === item
                  ? "border border-brand bg-brand text-white shadow-xs"
                  : "border border-border bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          title="Trang sau"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
