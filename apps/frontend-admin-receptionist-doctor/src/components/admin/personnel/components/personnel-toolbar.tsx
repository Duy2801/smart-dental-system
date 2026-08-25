import { AdminButton } from "@/src/components/admin/common";
import { UserPlusIcon, SearchIcon } from "./personnel-icons";
import type { RoleFilter } from "../types";

type PersonnelToolbarProps = {
  onCreate: () => void;
  onRoleFilterChange: (role: RoleFilter) => void;
  onSearchChange: (search: string) => void;
  roleFilter: RoleFilter;
  search: string;
};

export function PersonnelToolbar({
  onCreate,
  onRoleFilterChange,
  onSearchChange,
  roleFilter,
  search,
}: PersonnelToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon />
          <input
            type="text"
            placeholder="Tìm tên, email hoặc số điện thoại..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) =>
            onRoleFilterChange(event.target.value as RoleFilter)
          }
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[180px]"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="DOCTOR">Bác sĩ</option>
          <option value="RECEPTIONIST">Lễ tân</option>
        </select>
      </div>

      <AdminButton onClick={onCreate} className="gap-2">
        <UserPlusIcon />
        Thêm nhân viên
      </AdminButton>
    </div>
  );
}
