"use client";

import { useState } from "react";
import { holidays, notificationTemplates, workingHours } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { Tabs } from "@/src/components/admin/ui/tabs";

export function SettingsPageContent() {
  const [tab, setTab] = useState("hours");
  const [templates, setTemplates] = useState(notificationTemplates);

  return (
    <div className="space-y-4 p-6 md:p-8">
      <Tabs
        tabs={[
          { id: "hours", label: "Giờ làm việc" },
          { id: "holidays", label: "Ngày nghỉ lễ" },
          { id: "templates", label: "Mẫu thông báo" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "hours" ? (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Ngày</AdminTh>
              <AdminTh>Mở cửa</AdminTh>
              <AdminTh>Đóng cửa</AdminTh>
            </tr>
          </thead>
          <tbody>
            {workingHours.map((row) => (
              <tr key={row.day}>
                <AdminTd className="font-medium">{row.day}</AdminTd>
                <AdminTd>
                  {row.closed ? (
                    <span className="text-muted-foreground">Nghỉ</span>
                  ) : (
                    <input type="time" defaultValue={row.open} className="rounded border border-border px-2 py-1 text-sm" />
                  )}
                </AdminTd>
                <AdminTd>
                  {!row.closed ? (
                    <input type="time" defaultValue={row.close} className="rounded border border-border px-2 py-1 text-sm" />
                  ) : null}
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : null}

      {tab === "holidays" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Thêm ngày lễ</button>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Tên ngày lễ</AdminTh>
                <AdminTh>Ngày</AdminTh>
                <AdminTh>Hành động</AdminTh>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id}>
                  <AdminTd className="font-medium">{h.name}</AdminTd>
                  <AdminTd className="text-muted-foreground">{h.date}</AdminTd>
                  <AdminTd>
                    <button type="button" className="text-xs font-medium text-red-500 hover:underline">Xóa</button>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </div>
      ) : null}

      {tab === "templates" ? (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-white p-4">
              <p className="text-sm font-semibold text-brand-dark">{t.name}</p>
              <textarea
                rows={3}
                defaultValue={t.content}
                onChange={(e) =>
                  setTemplates((prev) =>
                    prev.map((item) => (item.id === t.id ? { ...item, content: e.target.value } : item)),
                  )
                }
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-6 border-t border-border bg-white px-6 py-4 md:-mx-8 md:px-8">
        <button type="button" className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
          Lưu cài đặt
        </button>
      </div>
    </div>
  );
}
