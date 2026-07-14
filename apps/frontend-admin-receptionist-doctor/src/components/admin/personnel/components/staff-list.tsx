import { SkeletonRows } from "@/src/components/admin/common";
import type { StaffUser } from "../types";
import { StaffRow } from "./staff-row";

type StaffListProps = {
  loading: boolean;
  onEdit: (user: StaffUser) => void;
  onRemove: (user: StaffUser) => void;
  onToggleLock: (user: StaffUser) => void;
  users: StaffUser[];
};

export function StaffList({
  loading,
  onEdit,
  onRemove,
  onToggleLock,
  users,
}: StaffListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={5} hasAvatar />
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Khong tim thay nhan vien nao phu hop.
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
    </div>
  );
}
