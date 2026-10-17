"use client";

import { ChatCircleText, Eye, EyeSlash, Stethoscope, Trash } from "@phosphor-icons/react";
import {
  AdminEmptyState,
  AdminIconButton,
  AdminIconButtonDivider,
  AdminIconButtonGroup,
  SkeletonRows,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import { getInitials } from "../review-utils";
import type { Review } from "../types";
import { StarRating } from "./star-rating";

type ReviewListProps = {
  loading?: boolean;
  reviews: Review[];
  pendingReviewIds?: string[];
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
};

export function ReviewList({
  loading = false,
  reviews,
  pendingReviewIds = [],
  onDelete,
  onToggleVisibility,
}: ReviewListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="divide-y divide-slate-100">
        {loading ? (
          <SkeletonRows count={5} hasAvatar />
        ) : reviews.length === 0 ? (
          <AdminEmptyState
            icon={<ChatCircleText size={24} weight="duotone" />}
            title="Không tìm thấy đánh giá nào phù hợp"
            description="Thử đổi từ khóa hoặc bộ lọc số sao."
          />
        ) : (
          reviews.map((review) => {
            const pending = pendingReviewIds.includes(review.id);
            return (
              <article
                key={review.id}
                className={cn(
                  "flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-start",
                  !review.is_visible ? "bg-slate-50/70" : "hover:bg-slate-50/50",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-light to-sky-100 text-sm font-extrabold text-brand ring-2 ring-white shadow-sm">
                  {getInitials(review.patient_name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold text-slate-900">{review.patient_name}</span>
                    {!review.is_visible ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        <EyeSlash size={11} weight="bold" />
                        Đã ẩn
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-400">· {formatDate(review.created_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                    <StarRating rating={review.rating} />
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      <Stethoscope size={12} />
                      BS. {review.doctor_name}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      review.is_visible ? "text-slate-700" : "text-slate-400 line-through decoration-slate-300",
                    )}
                  >
                    {review.comment}
                  </p>
                </div>

                <div className="shrink-0">
                  <AdminIconButtonGroup>
                    <AdminIconButton
                      label={review.is_visible ? "Ẩn đánh giá" : "Hiện lại đánh giá"}
                      tone={review.is_visible ? "amber" : "emerald"}
                      disabled={pending}
                      onClick={() => onToggleVisibility(review.id)}
                    >
                      {review.is_visible ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </AdminIconButton>
                    <AdminIconButtonDivider />
                    <AdminIconButton label="Xóa đánh giá" tone="red" disabled={pending} onClick={() => onDelete(review.id)}>
                      <Trash size={16} />
                    </AdminIconButton>
                  </AdminIconButtonGroup>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
