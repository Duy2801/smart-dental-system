"use client";

import { useMemo, useState } from "react";
import { staffUsers, type StaffUser } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { StatusBadge } from "@/src/components/admin/ui/status-badge";
import { ROLE_LABELS, type Role } from "@/src/constants/roles";
import { formatDate } from "@/src/lib/utils/date";

export function UsersPageContent() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState(staffUsers);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  const toggleLock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "locked" : "active" } : u,
      ),
    );
  };

  return (
    <div className="space-y-4 p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:max-w-xs"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand sm:max-w-[180px]"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="RECEPTIONIST">Lễ tân</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Thêm tài khoản
        </button>
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Họ tên</AdminTh>
            <AdminTh>Email</AdminTh>
            <AdminTh>Vai trò</AdminTh>
            <AdminTh>Trạng thái</AdminTh>
            <AdminTh>Ngày tạo</AdminTh>
            <AdminTh>Hành động</AdminTh>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <UserRow key={user.id} user={user} onToggleLock={toggleLock} />
          ))}
        </tbody>
      </AdminTable>

      {showModal ? (
        <AddUserModal onClose={() => setShowModal(false)} onAdd={(u) => { setUsers((p) => [...p, u]); setShowModal(false); }} />
      ) : null}
    </div>
  );
}

function UserRow({ user, onToggleLock }: { user: StaffUser; onToggleLock: (id: string) => void }) {
  return (
    <tr>
      <AdminTd>{user.fullName}</AdminTd>
      <AdminTd className="text-muted-foreground">{user.email}</AdminTd>
      <AdminTd><StatusBadge label={ROLE_LABELS[user.role]} variant="brand" /></AdminTd>
      <AdminTd>
        <StatusBadge label={user.status === "active" ? "Hoạt động" : "Đã khóa"} variant={user.status === "active" ? "success" : "danger"} />
      </AdminTd>
      <AdminTd className="text-muted-foreground">{formatDate(user.createdAt)}</AdminTd>
      <AdminTd>
        <div className="flex gap-2">
          <button type="button" className="text-xs font-medium text-brand hover:underline">Sửa</button>
          <button type="button" onClick={() => onToggleLock(user.id)} className="text-xs font-medium text-amber-600 hover:underline">
            {user.status === "active" ? "Khóa" : "Mở"}
          </button>
          <button type="button" className="text-xs font-medium text-red-500 hover:underline">Xóa</button>
        </div>
      </AdminTd>
    </tr>
  );
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: StaffUser) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-brand-dark">Thêm tài khoản</h3>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onAdd({
              id: String(Date.now()),
              fullName: String(fd.get("fullName")),
              email: String(fd.get("email")),
              role: fd.get("role") as Role,
              status: "active",
              createdAt: new Date().toISOString().slice(0, 10),
            });
          }}
        >
          <input name="fullName" required placeholder="Họ tên" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <select name="role" required className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="ADMIN">Quản trị viên</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="RECEPTIONIST">Lễ tân</option>
          </select>
          <input name="password" type="password" required placeholder="Mật khẩu tạm" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark">Tạo</button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-brand-dark hover:bg-muted">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}
