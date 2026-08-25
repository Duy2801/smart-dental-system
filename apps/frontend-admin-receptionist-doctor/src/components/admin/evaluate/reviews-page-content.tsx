"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
import {
  filterReviews,
  getAverageRating,
  getRatingCounts,
} from "./review-utils";
import { ReviewList } from "./components/review-list";
import { ReviewSummaryCard } from "./components/review-summary-card";
import { ReviewsToolbar } from "./components/reviews-toolbar";
import {
  deleteReview as deleteReviewApi,
  getReviews,
  updateReviewVisibility,
} from "./review-api";
import type { RatingFilter, VisibilityFilter } from "./types";

export function ReviewsPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("ALL");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.reviews(
      ratingFilter,
      visibilityFilter,
      search,
    ),
    queryFn: () =>
      getReviews({
        search,
        rating: ratingFilter,
        visibility: visibilityFilter,
      }),
  });

  const invalidateReviews = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      updateReviewVisibility(id, isVisible),
    onSuccess: invalidateReviews,
    onError: () => {
      setErrorMessage("Cập nhật trạng thái hiển thị đánh giá thất bại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReviewApi,
    onSuccess: invalidateReviews,
    onError: () => {
      setErrorMessage("Xóa đánh giá thất bại. Vui lòng thử lại.");
    },
  });

  const filteredReviews = useMemo(
    () => filterReviews(reviews, search, ratingFilter, visibilityFilter),
    [reviews, search, ratingFilter, visibilityFilter],
  );

  const averageRating = getAverageRating(reviews);
  const ratingCounts = getRatingCounts(reviews);

  const toggleVisibility = async (id: string) => {
    const review = reviews.find((item) => item.id === id);
    if (!review) return;

    setErrorMessage("");
    try {
      await visibilityMutation.mutateAsync({
        id,
        isVisible: !review.is_visible,
      });
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const deleteReview = async (id: string) => {
    setErrorMessage("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <ReviewSummaryCard
        averageRating={averageRating}
        ratingCounts={ratingCounts}
        totalReviews={reviews.length}
      />
      <ReviewsToolbar
        search={search}
        ratingFilter={ratingFilter}
        visibilityFilter={visibilityFilter}
        onSearchChange={setSearch}
        onRatingFilterChange={setRatingFilter}
        onVisibilityFilterChange={setVisibilityFilter}
      />
      <ReviewList
        loading={isLoading}
        reviews={filteredReviews}
        onDelete={deleteReview}
        onToggleVisibility={toggleVisibility}
      />
      {isError || errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage || "Không tải được dữ liệu đánh giá từ máy chủ."}
        </div>
      ) : null}
    </div>
  );
}
