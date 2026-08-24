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
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
      <div className="divide-y divide-slate-100">
        {loading ? (
          <SkeletonRows count={5} hasAvatar />
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground">
            Không tìm thấy đánh giá nào phù hợp.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                "group relative flex flex-col p-5 transition-colors",
                !review.is_visible && "bg-slate-50/70",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                    {getInitials(review.patient_name)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-dark">
                        {review.patient_name}
                      </span>
                      {!review.is_visible ? (
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                          Đã ẩn
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-0.5 text-xs text-muted-foreground font-medium">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-xs transition-opacity sm:opacity-90 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    title={review.is_visible ? "Ẩn bình luận" : "Hiện lại"}
                    onClick={() => onToggleVisibility(review.id)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                  >
                    {review.is_visible ? "Ẩn" : "Hiện"}
                  </button>
                  <div className="h-4 w-[1px] bg-slate-200" />
                  <button
                    type="button"
                    title="Xóa"
                    onClick={() => onDelete(review.id)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div className="mt-3 pl-13">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    Bác sĩ: {review.doctor_name}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    !review.is_visible
                      ? "text-slate-400 line-through decoration-slate-300"
                      : "text-brand-dark font-medium",
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
