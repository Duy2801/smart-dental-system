"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";

export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST";

type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: "active" | "locked";
  createdAt: string;
  // Doctor specific
  specialization?: string;
  licenseNumber?: string;
};

const mockStaff: StaffUser[] = [
  { id: "1", fullName: "Nguyễn Văn Admin", email: "admin@smartdental.vn", phone: "0901234567", role: "ADMIN", status: "active", createdAt: "2024-01-15" },
  { id: "2", fullName: "BS. Trần Minh", email: "tran.minh@smartdental.vn", phone: "0912345678", role: "DOCTOR", status: "active", createdAt: "2024-02-20", specialization: "Răng Hàm Mặt", licenseNumber: "CCHN-01234" },
  { id: "3", fullName: "Lê Thị Hoa", email: "le.hoa@smartdental.vn", phone: "0923456789", role: "RECEPTIONIST", status: "active", createdAt: "2024-03-10" },
  { id: "4", fullName: "BS. Phạm Quang", email: "pham.quang@smartdental.vn", phone: "0934567890", role: "DOCTOR", status: "locked", createdAt: "2024-04-05", specialization: "Chỉnh nha", licenseNumber: "CCHN-09876" },
  { id: "5", fullName: "Hoàng Lễ tân", email: "hoang.lt@smartdental.vn", phone: "0945678901", role: "RECEPTIONIST", status: "active", createdAt: "2024-05-12" },
];

const roleConfig: Record<Role, { label: string, color: string }> = {
  ADMIN: { label: "Quản trị viên", color: "border-purple-200 bg-purple-50 text-purple-700" },
  DOCTOR: { label: "Bác sĩ", color: "border-blue-200 bg-blue-50 text-blue-700" },
  RECEPTIONIST: { label: "Lễ tân", color: "border-orange-200 bg-orange-50 text-orange-700" },
};

export function UsersPageContent() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<StaffUser[]>(mockStaff);

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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const role = fd.get("role") as Role;
    const newUser: StaffUser = {
      id: String(Date.now()),
      fullName: String(fd.get("fullName")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      role,
      status: "active",
      createdAt: new Date().toISOString(),
      specialization: role === "DOCTOR" ? String(fd.get("specialization")) : undefined,
      licenseNumber: role === "DOCTOR" ? String(fd.get("licenseNumber")) : undefined,
    };
    setUsers((p) => [...p, newUser]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Tìm tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[180px]"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="DOCTOR">Bác sĩ (Doctor)</option>
            <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          Thêm nhân viên
        </button>
      </div>

      {/* Staff List */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy nhân viên nào phù hợp.
            </div>
          ) : (
            filtered.map((user) => (
              <div key={user.id} className="group relative flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                
                {/* User Info */}
                <div className="flex flex-col pr-4 sm:w-[35%]">
                  <span className="font-medium text-brand-dark">{user.fullName}</span>
                  <span className="text-sm text-muted-foreground mt-0.5">{user.email}</span>
                  {user.phone && <span className="text-xs text-muted-foreground mt-0.5">SĐT: {user.phone}</span>}
                </div>
                
                {/* Role */}
                <div className="hidden sm:flex flex-col w-[20%] shrink-0">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border w-fit", roleConfig[user.role].color)}>
                    {roleConfig[user.role].label}
                  </span>
                  {user.role === "DOCTOR" && (
                    <span className="text-xs text-muted-foreground mt-1.5 ml-1">{user.specialization}</span>
                  )}
                </div>

                {/* Date */}
                <div className="hidden md:flex flex-col w-[20%] shrink-0 text-sm text-muted-foreground">
                  <span className="text-xs">Ngày tham gia</span>
                  <span className="text-brand-dark">{formatDate(user.createdAt)}</span>
                </div>
                
                {/* Status */}
                <div className="flex w-[20%] shrink-0 justify-end sm:justify-start">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", 
                    user.status === "active" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
                  )}>
                    {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                  </span>
                </div>
                
                {/* Row Actions - Visible on Hover */}
                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white shadow-sm border border-border rounded-lg p-1">
                  <button 
                    type="button" 
                    title="Chỉnh sửa"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-light hover:text-brand transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button 
                    type="button" 
                    title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                    onClick={() => toggleLock(user.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    {user.status === "active" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    )}
                  </button>
                  <div className="w-[1px] h-4 bg-border mx-1" />
                  <button 
                    type="button" 
                    title="Xóa nhân viên"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} onSubmit={handleAdd} />}
    </div>
  );
}

function AddUserModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: React.FormEvent) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role>("RECEPTIONIST");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-brand-dark">Thêm nhân viên mới</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản truy cập cho nội bộ phòng khám.</p>
        
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Họ và tên</label>
              <input name="fullName" required placeholder="Nguyễn Văn A" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Số điện thoại</label>
              <input name="phone" required placeholder="090..." className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">Email đăng nhập</label>
            <input name="email" type="email" required placeholder="admin@phongkham.vn" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">Vai trò hệ thống</label>
            <select 
              name="role" 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
              <option value="DOCTOR">Bác sĩ (Doctor)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* DOCTOR specific fields */}
          {selectedRole === "DOCTOR" && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Chuyên khoa</label>
                <input name="specialization" required placeholder="Răng Hàm Mặt" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Mã CCHN</label>
                <input name="licenseNumber" required placeholder="CCHN-12345" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">Mật khẩu khởi tạo</label>
            <input name="password" type="password" required placeholder="••••••••" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]">
              Hủy
            </button>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]">
              Lưu nhân viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
