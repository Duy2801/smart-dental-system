CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");
CREATE INDEX "reviews_is_visible_rating_created_at_idx"
ON "reviews"("is_visible", "rating", "created_at");
