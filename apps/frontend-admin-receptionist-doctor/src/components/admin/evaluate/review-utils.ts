import type { RatingCounts, RatingFilter, Review, VisibilityFilter } from "./types";

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function getAverageRating(reviews: Review[]) {
  if (reviews.length === 0) {
    return "0.0";
  }

  return (
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
  ).toFixed(1);
}

export function getRatingCounts(reviews: Review[]): RatingCounts {
  return {
    5: reviews.filter((review) => review.rating === 5).length,
    4: reviews.filter((review) => review.rating === 4).length,
    3: reviews.filter((review) => review.rating === 3).length,
    2: reviews.filter((review) => review.rating === 2).length,
    1: reviews.filter((review) => review.rating === 1).length,
  };
}

export function filterReviews(
  reviews: Review[],
  search: string,
  ratingFilter: RatingFilter,
  visibilityFilter: VisibilityFilter,
) {
  return reviews.filter((review) => {
    const matchVisibility =
      visibilityFilter === "ALL"
        ? true
        : visibilityFilter === "VISIBLE"
          ? review.is_visible
          : !review.is_visible;

    const matchRating =
      ratingFilter === "ALL"
        ? true
        : ratingFilter === "5"
          ? review.rating === 5
          : ratingFilter === "4"
            ? review.rating === 4
            : review.rating <= 3;

    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      review.patient_name.toLowerCase().includes(query) ||
      review.comment.toLowerCase().includes(query);

    return matchVisibility && matchRating && matchSearch;
  });
}
