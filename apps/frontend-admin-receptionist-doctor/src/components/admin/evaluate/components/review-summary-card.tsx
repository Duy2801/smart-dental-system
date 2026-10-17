"use client";

import { Star } from "@phosphor-icons/react";
import type { RatingCounts } from "../types";
import { StarRating } from "./star-rating";

type ReviewSummaryCardProps = {
  averageRating: string;
  ratingCounts: RatingCounts;
  totalReviews: number;
};

export function ReviewSummaryCard({
  averageRating,
  ratingCounts,
  totalReviews,
}: ReviewSummaryCardProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:gap-10">
      <div className="flex flex-col items-center rounded-2xl bg-linear-to-br from-amber-50 to-orange-50 px-8 py-5 ring-1 ring-amber-100">
        <span className="flex items-center gap-1.5 text-4xl font-extrabold tracking-tight text-slate-900">
          {averageRating}
          <Star size={26} weight="fill" className="text-amber-400" />
        </span>
        <div className="mt-2">
          <StarRating rating={Math.round(Number(averageRating))} />
        </div>
        <span className="mt-1.5 text-xs font-medium text-slate-500">{totalReviews} đánh giá</span>
      </div>

      <div className="flex max-w-md flex-1 flex-col gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingCounts[star as keyof RatingCounts];
          const percent = totalReviews ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="flex w-10 shrink-0 items-center gap-1 font-semibold text-slate-600">
                {star}
                <Star size={12} weight="fill" className="text-amber-400" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-400" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
