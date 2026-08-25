"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { emptyStaffForm } from "./constants";
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

export function UsersPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.admin.personnel(roleFilter, search),
    queryFn: () => getStaffUsers({ roleFilter, search }),
  });

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "personnel"] });

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
    onSuccess: invalidateUsers,
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

  const toggleLock = async (user: StaffUser) => {
    const nextStatus: UserStatus =
      user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setError(null);
    try {
      await statusMutation.mutateAsync({ user, status: nextStatus });
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const removeUser = async (user: StaffUser) => {
    const confirmed = window.confirm(
      "Bạn chắc chắn muốn vô hiệu hóa nhân viên này?",
    );
    if (!confirmed) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync(user);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PersonnelToolbar
        search={search}
        roleFilter={roleFilter}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onCreate={openCreateModal}
      />

      <AdminAlert message={error} />

      <StaffList
        loading={loading}
        users={visibleUsers}
        onEdit={openEditModal}
        onToggleLock={(user) => void toggleLock(user)}
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
    </div>
  );
}
