"use client";

import { Plus } from "@phosphor-icons/react";
import { AdminButton, AdminSearchInput, AdminToolbar } from "@/src/components/admin/common";

type ServicePricingToolbarProps = {
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  search: string;
};

export function ServicePricingToolbar({
  onCreate,
  onSearchChange,
  search,
}: ServicePricingToolbarProps) {
  return (
    <AdminToolbar
      actions={
        <AdminButton onClick={onCreate}>
          <Plus size={16} weight="bold" />
          Thêm dịch vụ
        </AdminButton>
      }
    >
      <AdminSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm tên dịch vụ hoặc danh mục..."
      />
    </AdminToolbar>
  );
}
