import { SkeletonRows } from "@/src/components/admin/common";
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
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
      <div className="divide-y divide-slate-100">
        {loading ? (
          <SkeletonRows count={5} hasAvatar />
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground">
            Không tìm thấy nhân viên nào phù hợp.
          </div>
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

