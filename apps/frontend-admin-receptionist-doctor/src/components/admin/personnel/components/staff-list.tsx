"use client";

import { UsersThree } from "@phosphor-icons/react";
import { AdminEmptyState, SkeletonRows } from "@/src/components/admin/common";
import type { StaffUser } from "../types";
import { StaffPagination } from "./staff-pagination";
import { StaffRow } from "./staff-row";

type StaffListProps = {
  loading: boolean;
  onEdit: (user: StaffUser) => void;
  onRemove: (user: StaffUser) => void;
  onToggleLock: (user: StaffUser) => void;
  users: StaffUser[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  roleFilter: string;
  onPageChange: (page: number) => void;
};

export function StaffList({
  loading,
  onEdit,
  onRemove,
  onToggleLock,
  users,
  page,
  totalPages,
  total,
  limit,
  roleFilter,
  onPageChange,
}: StaffListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="hidden items-center border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:flex">
        <div className="w-[34%]">Nhân viên</div>
        <div className="w-[20%]">Vai trò</div>
        <div className="hidden w-[16%] md:block">Ngày tham gia</div>
        <div className="w-[14%]">Trạng thái</div>
        <div className="flex-1 text-right">Thao tác</div>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <SkeletonRows count={5} hasAvatar />
        ) : users.length === 0 ? (
          <AdminEmptyState
            icon={<UsersThree size={24} weight="duotone" />}
            title="Không tìm thấy nhân viên nào phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc vai trò."
          />
        ) : (
          users.map((user) => (
            <StaffRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onToggleLock={onToggleLock}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {!loading && total > 0 && (
        <StaffPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          roleFilter={roleFilter}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
