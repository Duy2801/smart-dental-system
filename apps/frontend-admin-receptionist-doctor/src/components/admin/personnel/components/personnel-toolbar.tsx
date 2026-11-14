"use client";

import { ShieldCheck, UserPlus, UsersThree } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFilterSelect,
  AdminSearchInput,
  AdminToolbar,
} from "@/src/components/admin/common";
import type { RoleFilter } from "../types";

type PersonnelToolbarProps = {
  onCreate: () => void;
  onViewPermissions: () => void;
  onRoleFilterChange: (role: RoleFilter) => void;
  onSearchChange: (search: string) => void;
  roleFilter: RoleFilter;
  search: string;
};

export function PersonnelToolbar({
  onCreate,
  onViewPermissions,
  onRoleFilterChange,
  onSearchChange,
  roleFilter,
  search,
}: PersonnelToolbarProps) {
  return (
    <AdminToolbar
      actions={
        <>
          <AdminButton variant="secondary" onClick={onViewPermissions}>
            <ShieldCheck size={17} weight="bold" />
            Ma trận quyền
          </AdminButton>
          <AdminButton onClick={onCreate}>
            <UserPlus size={17} weight="bold" />
            Thêm nhân viên
          </AdminButton>
        </>
      }
    >
      <AdminSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm tên, email hoặc số điện thoại..."
      />
      <AdminFilterSelect
        value={roleFilter}
        onChange={(event) => onRoleFilterChange(event.target.value as RoleFilter)}
        aria-label="Lọc theo vai trò"
        icon={<UsersThree size={15} />}
      >
        <option value="ALL">Tất cả vai trò</option>
        <option value="ADMIN">Quản trị viên</option>
        <option value="DOCTOR">Bác sĩ</option>
        <option value="RECEPTIONIST">Lễ tân</option>
      </AdminFilterSelect>
    </AdminToolbar>
  );
}
