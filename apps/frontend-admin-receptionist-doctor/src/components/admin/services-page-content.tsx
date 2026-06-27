"use client";

import { useState } from "react";
import { dentalServices, servicePrices } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { StatusBadge } from "@/src/components/admin/ui/status-badge";
import { Tabs } from "@/src/components/admin/ui/tabs";
import { formatCurrency } from "@/src/lib/utils/format";
import { formatDate } from "@/src/lib/utils/date";

export function ServicesPageContent() {
  const [tab, setTab] = useState("catalog");

  return (
    <div className="space-y-4 p-6 md:p-8">
      <Tabs
        tabs={[
          { id: "catalog", label: "Danh mục dịch vụ" },
          { id: "pricing", label: "Bảng giá" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "catalog" ? (
        <>
          <div className="flex justify-end">
            <button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Thêm dịch vụ</button>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Tên dịch vụ</AdminTh>
                <AdminTh>Mô tả</AdminTh>
                <AdminTh>Thời gian (phút)</AdminTh>
                <AdminTh>Trạng thái</AdminTh>
                <AdminTh>Hành động</AdminTh>
              </tr>
            </thead>
            <tbody>
              {dentalServices.map((s) => (
                <tr key={s.id}>
                  <AdminTd className="font-medium">{s.name}</AdminTd>
                  <AdminTd className="text-muted-foreground">{s.description}</AdminTd>
                  <AdminTd>{s.duration}</AdminTd>
                  <AdminTd>
                    <StatusBadge label={s.status === "active" ? "Hoạt động" : "Ngưng"} variant={s.status === "active" ? "success" : "neutral"} />
                  </AdminTd>
                  <AdminTd>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs font-medium text-brand hover:underline">Sửa</button>
                      <button type="button" className="text-xs font-medium text-red-500 hover:underline">Xóa</button>
                    </div>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Chỉnh giá</button>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Dịch vụ</AdminTh>
                <AdminTh>Giá (VND)</AdminTh>
                <AdminTh>Ngày hiệu lực</AdminTh>
                <AdminTh>Hành động</AdminTh>
              </tr>
            </thead>
            <tbody>
              {servicePrices.map((p) => (
                <tr key={p.id}>
                  <AdminTd className="font-medium">{p.serviceName}</AdminTd>
                  <AdminTd>{formatCurrency(p.price)}</AdminTd>
                  <AdminTd className="text-muted-foreground">{formatDate(p.effectiveDate)}</AdminTd>
                  <AdminTd>
                    <button type="button" className="text-xs font-medium text-brand hover:underline">Chỉnh giá</button>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </>
      )}
    </div>
  );
}
