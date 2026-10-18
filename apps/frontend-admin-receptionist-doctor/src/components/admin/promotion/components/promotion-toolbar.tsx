"use client";

import { Plus } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFilterSelect,
  AdminSearchInput,
  AdminToolbar,
} from "@/src/components/admin/common";
import type { PromotionStatusFilter } from "../types";

type PromotionToolbarProps = {
  search: string;
  statusFilter: PromotionStatusFilter;
  onAddClick: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: PromotionStatusFilter) => void;
};

export function PromotionToolbar({
  search,
  statusFilter,
  onAddClick,
  onSearchChange,
  onStatusFilterChange,
}: PromotionToolbarProps) {
  return (
    <AdminToolbar
      actions={
        <AdminButton onClick={onAddClick}>
          <Plus size={16} weight="bold" />
          Tạo voucher mới
        </AdminButton>
      }
    >
      <AdminSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm theo mã hoặc tên voucher..."
      />
      <AdminFilterSelect
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as PromotionStatusFilter)}
        aria-label="Lọc theo trạng thái"
        wrapperClassName="w-full sm:w-56"
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang diễn ra</option>
        <option value="EXPIRED">Đã kết thúc / Hết lượt</option>
        <option value="PAUSED">Tạm ngưng</option>
      </AdminFilterSelect>
    </AdminToolbar>
  );
}
