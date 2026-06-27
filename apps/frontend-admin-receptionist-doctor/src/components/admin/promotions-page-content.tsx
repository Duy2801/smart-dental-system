"use client";

import { useState } from "react";
import { promotions } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { StatusBadge } from "@/src/components/admin/ui/status-badge";

export function PromotionsPageContent() {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState(promotions);

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id && p.status !== "expired"
          ? { ...p, status: p.status === "active" ? ("expired" as const) : ("active" as const) }
          : p,
      ),
    );
  };

  return (
    <div className="space-y-4 p-6 md:p-8">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Tạo chương trình mới
        </button>
      </div>

      {showForm ? (
        <form className="grid gap-3 rounded-xl border border-border bg-white p-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Mã voucher" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <input placeholder="Tên chương trình" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <input type="number" placeholder="% giảm hoặc số tiền" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <input type="date" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <input type="number" placeholder="Giới hạn lượt dùng" className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Lưu</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-brand-dark">Hủy</button>
          </div>
        </form>
      ) : null}

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Mã</AdminTh>
            <AdminTh>Chương trình</AdminTh>
            <AdminTh>Giảm giá</AdminTh>
            <AdminTh>Hạn dùng</AdminTh>
            <AdminTh>Lượt dùng</AdminTh>
            <AdminTh>Trạng thái</AdminTh>
            <AdminTh>Hành động</AdminTh>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <AdminTd className="font-mono font-medium">{p.code}</AdminTd>
              <AdminTd>{p.name}</AdminTd>
              <AdminTd>{p.type === "percent" ? `${p.value}%` : `${p.value.toLocaleString("vi-VN")}đ`}</AdminTd>
              <AdminTd className="text-muted-foreground">{p.expiry}</AdminTd>
              <AdminTd>{p.used}/{p.limit}</AdminTd>
              <AdminTd>
                <StatusBadge
                  label={p.status === "active" ? "Đang chạy" : "Hết hạn"}
                  variant={p.status === "active" ? "success" : "neutral"}
                />
              </AdminTd>
              <AdminTd>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-medium text-brand hover:underline">Sửa</button>
                  <button type="button" onClick={() => toggleStatus(p.id)} className="text-xs font-medium text-amber-600 hover:underline">Bật/Tắt</button>
                  <button type="button" className="text-xs font-medium text-red-500 hover:underline">Xóa</button>
                </div>
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
