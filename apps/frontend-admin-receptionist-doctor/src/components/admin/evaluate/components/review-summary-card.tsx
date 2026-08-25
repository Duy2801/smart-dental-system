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
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:gap-12">
      <div className="flex flex-col items-center">
        <span className="font-mono text-4xl font-bold text-brand-dark">
          {averageRating}
        </span>
        <div className="mt-2">
          <StarRating rating={Math.round(Number(averageRating))} />
        </div>
        <span className="mt-1 text-sm text-muted-foreground">
          Dựa trên {totalReviews} đánh giá
        </span>
      </div>

      <div className="flex max-w-sm flex-1 flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingCounts[star as keyof RatingCounts];
          const percent = totalReviews ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-8 shrink-0 font-medium text-muted-foreground">
                {star} sao
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-muted-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
