"use client";

import { Eye, Star } from "@phosphor-icons/react";
import {
  AdminFilterSelect,
  AdminSearchInput,
  AdminToolbar,
} from "@/src/components/admin/common";
import type { RatingFilter, VisibilityFilter } from "../types";

type ReviewsToolbarProps = {
  search: string;
  ratingFilter: RatingFilter;
  visibilityFilter: VisibilityFilter;
  onSearchChange: (value: string) => void;
  onRatingFilterChange: (value: RatingFilter) => void;
  onVisibilityFilterChange: (value: VisibilityFilter) => void;
};

export function ReviewsToolbar({
  search,
  ratingFilter,
  visibilityFilter,
  onSearchChange,
  onRatingFilterChange,
  onVisibilityFilterChange,
}: ReviewsToolbarProps) {
  return (
    <AdminToolbar>
      <AdminSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm theo tên bệnh nhân hoặc nội dung..."
      />
      <AdminFilterSelect
        value={ratingFilter}
        onChange={(event) => onRatingFilterChange(event.target.value as RatingFilter)}
        aria-label="Lọc theo số sao"
        icon={<Star size={15} />}
        wrapperClassName="w-full sm:w-48"
      >
        <option value="ALL">Mọi số sao</option>
        <option value="5">5 sao</option>
        <option value="4">4 sao</option>
        <option value="3">Từ 3 sao trở xuống</option>
      </AdminFilterSelect>
      <AdminFilterSelect
        value={visibilityFilter}
        onChange={(event) => onVisibilityFilterChange(event.target.value as VisibilityFilter)}
        aria-label="Lọc theo trạng thái hiển thị"
        icon={<Eye size={15} />}
        wrapperClassName="w-full sm:w-48"
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="VISIBLE">Đang hiển thị</option>
        <option value="HIDDEN">Đã ẩn</option>
      </AdminFilterSelect>
    </AdminToolbar>
  );
}
