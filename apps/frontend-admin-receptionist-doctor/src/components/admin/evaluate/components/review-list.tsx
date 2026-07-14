import { SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import { getInitials } from "../review-utils";
import type { Review } from "../types";
import { StarRating } from "./star-rating";

type ReviewListProps = {
  loading?: boolean;
  reviews: Review[];
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
};

export function ReviewList({
  loading = false,
  reviews,
  onDelete,
  onToggleVisibility,
}: ReviewListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={5} hasAvatar />
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Khong tim thay danh gia nao phu hop.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                "group relative flex flex-col p-5 transition-colors",
                !review.is_visible && "bg-muted/30",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                    {getInitials(review.patient_name)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-brand-dark">
                        {review.patient_name}
                      </span>
                      {!review.is_visible ? (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-700">
                          Da an
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    title={review.is_visible ? "An binh luan" : "Hien lai"}
                    onClick={() => onToggleVisibility(review.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-orange-50 hover:text-orange-600"
                  >
                    {review.is_visible ? "An" : "Hien"}
                  </button>
                  <div className="mx-1 h-4 w-[1px] bg-border" />
                  <button
                    type="button"
                    title="Xoa"
                    onClick={() => onDelete(review.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    Xoa
                  </button>
                </div>
              </div>

              <div className="mt-3 pl-13">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {review.doctor_name}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    !review.is_visible
                      ? "text-muted-foreground line-through decoration-muted-foreground/50"
                      : "text-brand-dark",
                  )}
                >
                  {review.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
