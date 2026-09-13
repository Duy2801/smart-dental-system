"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { queryKeys } from "@/src/lib/query/query-keys";
import { ReviewList } from "./components/review-list";
import { ReviewPagination } from "./components/review-pagination";
import { ReviewSummaryCard } from "./components/review-summary-card";
import { ReviewsToolbar } from "./components/reviews-toolbar";
import {
  deleteReview as deleteReviewApi,
  getReviews,
  updateReviewVisibility,
} from "./review-api";
import type {
  RatingFilter,
  ReviewListResponse,
  VisibilityFilter,
} from "./types";

const PAGE_SIZE = 20;

function updateSummaryAfterDelete(
  response: ReviewListResponse,
  rating: number,
) {
  const ratingCounts = { ...response.summary.ratingCounts };
  const ratingKey = rating as keyof typeof ratingCounts;
  ratingCounts[ratingKey] = Math.max(0, ratingCounts[ratingKey] - 1);

  const totalReviews = Math.max(0, response.summary.totalReviews - 1);
  const ratingSum = Object.entries(ratingCounts).reduce(
    (total, [value, count]) => total + Number(value) * count,
    0,
  );

  return {
    averageRating:
      totalReviews === 0 ? "0.0" : (ratingSum / totalReviews).toFixed(1),
    ratingCounts,
    totalReviews,
  };
}

export function ReviewsPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("ALL");
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const queryKey = queryKeys.admin.reviews(
    ratingFilter,
    visibilityFilter,
    debouncedSearch,
    page,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      getReviews(
        {
          search: debouncedSearch,
          rating: ratingFilter,
          visibility: visibilityFilter,
          page,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const reviews = data?.items ?? [];

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      updateReviewVisibility(id, isVisible),
    onMutate: async ({ id, isVisible }) => {
      setErrorMessage("");
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<ReviewListResponse>(queryKey);

      queryClient.setQueryData<ReviewListResponse>(queryKey, (current) => {
        if (!current) return current;

        const leavesCurrentFilter =
          (visibilityFilter === "VISIBLE" && !isVisible) ||
          (visibilityFilter === "HIDDEN" && isVisible);

        return {
          ...current,
          items: leavesCurrentFilter
            ? current.items.filter((review) => review.id !== id)
            : current.items.map((review) =>
                review.id === id
                  ? { ...review, is_visible: isVisible }
                  : review,
              ),
          pagination: leavesCurrentFilter
            ? {
                ...current.pagination,
                total: Math.max(0, current.pagination.total - 1),
                totalPages: Math.max(
                  1,
                  Math.ceil((current.pagination.total - 1) / PAGE_SIZE),
                ),
              }
            : current.pagination,
        };
      });

      const leavesCurrentFilter =
        (visibilityFilter === "VISIBLE" && !isVisible) ||
        (visibilityFilter === "HIDDEN" && isVisible);

      return {
        previous,
        shouldGoToPreviousPage:
          leavesCurrentFilter && previous?.items.length === 1 && page > 1,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setErrorMessage("Cập nhật trạng thái hiển thị đánh giá thất bại.");
    },
    onSuccess: (_result, _variables, context) => {
      if (context.shouldGoToPreviousPage) {
        setPage((current) => current - 1);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReviewApi,
    onMutate: async (id) => {
      setErrorMessage("");
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<ReviewListResponse>(queryKey);

      queryClient.setQueryData<ReviewListResponse>(queryKey, (current) => {
        if (!current) return current;
        const review = current.items.find((item) => item.id === id);
        if (!review) return current;

        const total = Math.max(0, current.pagination.total - 1);
        return {
          ...current,
          items: current.items.filter((item) => item.id !== id),
          summary: updateSummaryAfterDelete(current, review.rating),
          pagination: {
            ...current.pagination,
            total,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
          },
        };
      });

      return {
        previous,
        shouldGoToPreviousPage: previous?.items.length === 1 && page > 1,
      };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setErrorMessage("Xóa đánh giá thất bại. Vui lòng thử lại.");
    },
    onSuccess: (_result, _id, context) => {
      if (context.shouldGoToPreviousPage) {
        setPage((current) => current - 1);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });

  const pendingReviewIds = useMemo(
    () =>
      [
        visibilityMutation.isPending
          ? visibilityMutation.variables?.id
          : undefined,
        deleteMutation.isPending ? deleteMutation.variables : undefined,
      ].filter((id): id is string => Boolean(id)),
    [
      deleteMutation.isPending,
      deleteMutation.variables,
      visibilityMutation.isPending,
      visibilityMutation.variables,
    ],
  );

  const toggleVisibility = (id: string) => {
    const review = reviews.find((item) => item.id === id);
    if (!review) return;

    visibilityMutation.mutate({
      id,
      isVisible: !review.is_visible,
    });
  };

  const changeRatingFilter = (value: RatingFilter) => {
    setRatingFilter(value);
    setPage(1);
  };

  const changeVisibilityFilter = (value: VisibilityFilter) => {
    setVisibilityFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <ReviewSummaryCard
        averageRating={data?.summary.averageRating ?? "0.0"}
        ratingCounts={
          data?.summary.ratingCounts ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
        totalReviews={data?.summary.totalReviews ?? 0}
      />
      <ReviewsToolbar
        search={search}
        ratingFilter={ratingFilter}
        visibilityFilter={visibilityFilter}
        onSearchChange={setSearch}
        onRatingFilterChange={changeRatingFilter}
        onVisibilityFilterChange={changeVisibilityFilter}
      />
      <ReviewList
        loading={isLoading}
        reviews={reviews}
        pendingReviewIds={pendingReviewIds}
        onDelete={(id) => deleteMutation.mutate(id)}
        onToggleVisibility={toggleVisibility}
      />
      <ReviewPagination
        page={page}
        totalPages={data?.pagination.totalPages ?? 1}
        total={data?.pagination.total ?? 0}
        onPageChange={setPage}
      />
      {isError || errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage || "Không tải được dữ liệu đánh giá từ máy chủ."}
        </div>
      ) : null}
    </div>
  );
}
