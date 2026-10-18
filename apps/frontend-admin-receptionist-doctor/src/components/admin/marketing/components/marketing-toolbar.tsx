"use client";

import { Plus } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFilterSelect,
  AdminSearchInput,
  AdminToolbar,
} from "@/src/components/admin/common";
import type { BannerStatusFilter } from "../types";

type BannerToolbarProps = {
  onAddClick: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: BannerStatusFilter) => void;
  search: string;
  statusFilter: BannerStatusFilter;
};

export function MarketingToolbar({
  onAddClick,
  onSearchChange,
  onStatusFilterChange,
  search,
  statusFilter,
}: BannerToolbarProps) {
  return (
    <AdminToolbar
      actions={
        <AdminButton onClick={onAddClick}>
          <Plus size={16} weight="bold" />
          Thêm banner mới
        </AdminButton>
      }
    >
      <AdminSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm theo tiêu đề hoặc nội dung banner..."
      />
      <AdminFilterSelect
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as BannerStatusFilter)}
        aria-label="Lọc theo trạng thái"
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang hiển thị</option>
        <option value="INACTIVE">Đã tạm ẩn</option>
      </AdminFilterSelect>
    </AdminToolbar>
  );
}
