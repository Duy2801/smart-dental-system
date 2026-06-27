"use client";

import { useState } from "react";
import { reportHistory, reportPreview } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { StatusBadge } from "@/src/components/admin/ui/status-badge";

export function ReportsPageContent() {
  const [reportType, setReportType] = useState("finance");
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo] = useState("2026-06-30");

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Loại báo cáo</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="finance">Tài chính</option>
            <option value="appointments">Lịch hẹn</option>
            <option value="summary">Tổng hợp</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Từ ngày</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Đến ngày</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Xuất PDF</button>
          <button type="button" className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light">Xuất Excel</button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h3 className="text-base font-semibold text-brand-dark">Xem trước báo cáo</h3>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Dịch vụ / Hạng mục</AdminTh>
              <AdminTh>Số lượng</AdminTh>
              <AdminTh>Doanh thu</AdminTh>
            </tr>
          </thead>
          <tbody>
            {reportPreview.map((row, i) => (
              <tr key={i}>
                <AdminTd>{row.col1}</AdminTd>
                <AdminTd>{row.col2}</AdminTd>
                <AdminTd>{row.col3}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-brand-dark">Lịch sử xuất báo cáo</h3>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Tên báo cáo</AdminTh>
              <AdminTh>Loại</AdminTh>
              <AdminTh>Ngày xuất</AdminTh>
              <AdminTh>Định dạng</AdminTh>
            </tr>
          </thead>
          <tbody>
            {reportHistory.map((r) => (
              <tr key={r.id}>
                <AdminTd className="font-medium">{r.name}</AdminTd>
                <AdminTd><StatusBadge label={r.type} variant="brand" /></AdminTd>
                <AdminTd className="text-muted-foreground">{r.date}</AdminTd>
                <AdminTd>{r.format}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
