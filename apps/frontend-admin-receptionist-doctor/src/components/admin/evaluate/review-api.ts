import apiClient from "@/src/lib/api/client";
import type { RatingFilter, Review, VisibilityFilter } from "./types";

export async function getReviews(params: {
  rating?: RatingFilter;
  search?: string;
  visibility?: VisibilityFilter;
}) {
  const response = await apiClient.get<Review[]>("/reviews", { params });
  return response.data;
}

export async function updateReviewVisibility(id: string, isVisible: boolean) {
  await apiClient.patch(`/reviews/${id}/visibility`, {
    is_visible: isVisible,
  });
}

export async function deleteReview(id: string) {
  await apiClient.delete(`/reviews/${id}`);
}
