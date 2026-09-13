export type Review = {
  id: string;
  patient_name: string;
  doctor_name: string;
  rating: number;
  comment: string;
  is_visible: boolean;
  created_at: string;
};

export type RatingFilter = "ALL" | "5" | "4" | "3";
export type VisibilityFilter = "ALL" | "VISIBLE" | "HIDDEN";

export type RatingCounts = Record<1 | 2 | 3 | 4 | 5, number>;

export type ReviewListResponse = {
  items: Review[];
  summary: {
    averageRating: string;
    ratingCounts: RatingCounts;
    totalReviews: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
