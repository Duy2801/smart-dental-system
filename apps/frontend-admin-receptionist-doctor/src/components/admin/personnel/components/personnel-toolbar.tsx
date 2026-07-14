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
            placeholder="Tim ten, email hoac so dien thoai..."
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
          <option value="ALL">Tat ca vai tro</option>
          <option value="ADMIN">Quan tri vien</option>
          <option value="DOCTOR">Bac si</option>
          <option value="RECEPTIONIST">Le tan</option>
        </select>
      </div>

      <AdminButton onClick={onCreate} className="gap-2">
        <UserPlusIcon />
        Them nhan vien
      </AdminButton>
    </div>
  );
}
