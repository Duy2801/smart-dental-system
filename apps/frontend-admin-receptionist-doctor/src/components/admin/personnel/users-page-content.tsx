"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert, AdminConfirmModal } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { emptyStaffForm, roleConfig } from "./constants";
import {
  createStaffUser,
  deleteStaffUser,
  getStaffUsers,
  updateStaffStatus,
  updateStaffUser,
} from "./personnel-api";
import { getErrorMessage, toStaffFormState } from "./personnel-utils";
import { PersonnelToolbar } from "./components/personnel-toolbar";
import { StaffList } from "./components/staff-list";
import { StaffModal } from "./components/staff-modal";
import type {
  RoleFilter,
  StaffFormState,
  StaffUser,
  UserStatus,
} from "./types";

const PAGE_SIZE = 10;

export function UsersPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: queryKeys.admin.personnel(roleFilter, search, page),
    queryFn: () =>
      getStaffUsers({ roleFilter, search, page, limit: PAGE_SIZE }),
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "personnel"] });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
    setPage(1);
  };

  const submitMutation = useMutation({
    mutationFn: (form: StaffFormState) =>
      editingUser ? updateStaffUser(editingUser, form) : createStaffUser(form),
    onSuccess: async () => {
      setShowModal(false);
      setEditingUser(null);
      await invalidateUsers();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Lưu nhân viên thất bại"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ user, status }: { user: StaffUser; status: UserStatus }) =>
      updateStaffStatus(user, status),
    onSuccess: invalidateUsers,
    onError: (err) => {
      setError(getErrorMessage(err, "Cập nhật trạng thái thất bại"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaffUser,
    onSuccess: async () => {
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
      await invalidateUsers();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Xóa nhân viên thất bại"));
    },
  });

  const modalTitle = editingUser ? "Sửa nhân viên" : "Thêm nhân viên mới";

  const visibleUsers = useMemo(
    () => users.filter((user) => user.role),
    [users],
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: StaffUser) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitMutation.isPending) return;
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (form: StaffFormState) => {
    setError(null);
    try {
      await submitMutation.mutateAsync(form);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const [lockTarget, setLockTarget] = useState<StaffUser | null>(null);

  const handleConfirmToggleLock = async () => {
    if (!lockTarget) return;
    const nextStatus: UserStatus =
      lockTarget.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setError(null);
    try {
      await statusMutation.mutateAsync({ user: lockTarget, status: nextStatus });
      setLockTarget(null);
    } catch {
      // Error message is handled by the mutation onError callback.
      setLockTarget(null);
    }
  };

  const [deactivatingUser, setDeactivatingUser] = useState<StaffUser | null>(null);

  const removeUser = (user: StaffUser) => {
    setDeactivatingUser(user);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(deactivatingUser);
      setDeactivatingUser(null);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PersonnelToolbar
        search={search}
        roleFilter={roleFilter}
        onSearchChange={handleSearchChange}
        onRoleFilterChange={handleRoleFilterChange}
        onCreate={openCreateModal}
      />

      <AdminAlert message={error} />

      <StaffList
        loading={loading}
        users={visibleUsers}
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        roleFilter={roleFilter}
        onPageChange={setPage}
        onEdit={openEditModal}
        onToggleLock={setLockTarget}
        onRemove={(user) => void removeUser(user)}
      />

      {showModal ? (
        <StaffModal
          title={modalTitle}
          initialValue={
            editingUser ? toStaffFormState(editingUser) : emptyStaffForm
          }
          editingUser={editingUser}
          submitting={submitMutation.isPending}
          onClose={closeModal}
          onSubmit={(form) => void handleSubmit(form)}
        />
      ) : null}

      <AdminConfirmModal
        isOpen={Boolean(lockTarget)}
        title={lockTarget?.status === "ACTIVE" ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa tài khoản"}
        description={
          lockTarget?.status === "ACTIVE" ? (
            <>
              Bạn có chắc muốn khóa tài khoản của{" "}
              <strong className="font-semibold text-slate-900">{lockTarget?.fullName}</strong>? Nhân viên này sẽ không thể đăng nhập cho tới khi được mở khóa.
            </>
          ) : (
            <>
              Mở khóa tài khoản của{" "}
              <strong className="font-semibold text-slate-900">{lockTarget?.fullName}</strong>? Nhân viên sẽ đăng nhập lại được ngay.
            </>
          )
        }
        confirmText={lockTarget?.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
        cancelText="Hủy bỏ"
        variant={lockTarget?.status === "ACTIVE" ? "warning" : "primary"}
        showIcon={false}
        isLoading={statusMutation.isPending}
        onConfirm={handleConfirmToggleLock}
        onClose={() => setLockTarget(null)}
      />

      <AdminConfirmModal
        isOpen={Boolean(deactivatingUser)}
        title="Xác nhận vô hiệu hóa nhân viên"
        description={
          <>
            Bạn có chắc chắn muốn vô hiệu hóa tài khoản của nhân viên{" "}
            <strong className="font-semibold text-slate-900">
              {deactivatingUser?.fullName}
            </strong>{" "}
            ({deactivatingUser?.role ? roleConfig[deactivatingUser.role]?.label : ""}) không? Tài khoản này sẽ không thể đăng nhập vào hệ thống.
          </>
        }
        confirmText="Vô hiệu hóa"
        cancelText="Hủy bỏ"
        variant="warning"
        showIcon={false}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setDeactivatingUser(null)}
      />
    </div>
  );
}
