import apiClient from "@/src/lib/api/client";
import type {
  RatingFilter,
  Review,
  ReviewListResponse,
  VisibilityFilter,
} from "./types";

function normalizeLegacyResponse(
  reviews: Review[],
  limit: number,
): ReviewListResponse {
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating as keyof typeof ratingCounts] += 1;
    }
  }

  const ratingSum = reviews.reduce(
    (total, review) => total + review.rating,
    0,
  );

  return {
    items: reviews,
    summary: {
      averageRating:
        reviews.length === 0 ? "0.0" : (ratingSum / reviews.length).toFixed(1),
      ratingCounts,
      totalReviews: reviews.length,
    },
    pagination: {
      page: 1,
      limit,
      total: reviews.length,
      totalPages: 1,
    },
  };
}

export async function getReviews(
  params: {
    rating?: RatingFilter;
    search?: string;
    visibility?: VisibilityFilter;
    page?: number;
    limit?: number;
  },
  signal?: AbortSignal,
) {
  // Page 1 works with both API versions. A paginated response proves that the
  // deployed backend supports page/limit before later pages send those fields.
  const { page, limit, ...legacyCompatibleParams } = params;
  const requestParams =
    page && page > 1
      ? { ...legacyCompatibleParams, page, limit }
      : legacyCompatibleParams;

  const response = await apiClient.get<ReviewListResponse | Review[]>(
    "/reviews",
    {
      params: requestParams,
      signal,
    },
  );

  return Array.isArray(response.data)
    ? normalizeLegacyResponse(response.data, params.limit ?? 20)
    : response.data;
}

export async function updateReviewVisibility(id: string, isVisible: boolean) {
  const response = await apiClient.patch<{ id: string; is_visible: boolean }>(
    `/reviews/${id}/visibility`,
    {
      is_visible: isVisible,
    },
  );
  return response.data;
}

export async function deleteReview(id: string) {
  await apiClient.delete(`/reviews/${id}`);
}
