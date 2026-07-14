import { SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatPromotionValue,
  getPromotionStatus,
  getPromotionUsageProgress,
} from "../promotion-utils";
import type { Promotion } from "../types";

type PromotionListProps = {
  loading?: boolean;
  promotions: Promotion[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
};

export function PromotionList({
  loading = false,
  promotions,
  onDelete,
  onToggleStatus,
}: PromotionListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="hidden items-center border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
        <div className="w-[30%]">Ma & Chuong trinh</div>
        <div className="w-[15%]">Muc giam</div>
        <div className="w-[20%]">Luot dung</div>
        <div className="w-[20%]">Thoi han</div>
        <div className="w-[15%] pr-4 text-right">Trang thai</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={5} />
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Khong tim thay chuong trinh khuyen mai nao.
          </div>
        ) : (
          promotions.map((promotion) => (
            <PromotionRow
              key={promotion.id}
              promotion={promotion}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PromotionRow({
  promotion,
  onDelete,
  onToggleStatus,
}: {
  promotion: Promotion;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}) {
  const status = getPromotionStatus(promotion);
  const progress = getPromotionUsageProgress(promotion);

  return (
    <div className="group relative flex flex-col gap-3 p-5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:gap-0">
      <div className="flex shrink-0 flex-col pr-4 sm:w-[30%]">
        <span className="inline-block w-fit rounded border border-border bg-muted px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-brand-dark">
          {promotion.code}
        </span>
        <span className="mt-2 text-sm font-medium text-brand-dark">
          {promotion.name}
        </span>
        <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {promotion.description}
        </span>
      </div>

      <div className="flex shrink-0 items-center sm:w-[15%]">
        <span className="font-mono text-sm font-semibold text-brand">
          {formatPromotionValue(
            promotion.discount_type,
            promotion.discount_value,
          )}
        </span>
      </div>

      <div className="flex shrink-0 flex-col pr-6 sm:w-[20%]">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">
            Da dung: {promotion.used_count}
          </span>
          <span className="font-medium text-brand-dark">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress >= 100 ? "bg-red-500" : "bg-brand",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col text-xs text-muted-foreground sm:w-[20%]">
        <span>
          Bat dau:{" "}
          <span className="font-medium text-brand-dark">
            {formatDate(promotion.start_date)}
          </span>
        </span>
        <span className="mt-1">
          Ket thuc:{" "}
          <span className="font-medium text-brand-dark">
            {formatDate(promotion.end_date)}
          </span>
        </span>
      </div>

      <div className="flex shrink-0 sm:w-[15%] sm:justify-end sm:pr-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-center text-xs font-medium",
            status.color,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          title="Sua"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand"
        >
          Sua
        </button>
        <button
          type="button"
          title={promotion.is_active ? "Tam ngung" : "Kich hoat lai"}
          onClick={() => onToggleStatus(promotion.id)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-orange-50 hover:text-orange-600"
        >
          {promotion.is_active ? "Dung" : "Bat"}
        </button>
        <div className="mx-1 h-4 w-[1px] bg-border" />
        <button
          type="button"
          title="Xoa voucher"
          onClick={() => onDelete(promotion.id)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          Xoa
        </button>
      </div>
    </div>
  );
}
