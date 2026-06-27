"use client";

import { emailCampaigns, voucherOptions } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { StatusBadge } from "@/src/components/admin/ui/status-badge";

export function MarketingPageContent() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <form className="space-y-4 rounded-xl border border-border bg-white p-6" onSubmit={(e) => e.preventDefault()}>
        <h3 className="text-base font-semibold text-brand-dark">Soạn email khuyến mãi</h3>
        <input placeholder="Tiêu đề email" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
        <textarea rows={5} placeholder="Nội dung email..." className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="">Chọn voucher đính kèm</option>
            {voucherOptions.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="all">Tất cả bệnh nhân</option>
            <option value="reexam">Bệnh nhân tái khám</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Gửi email</button>
          <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-brand-dark hover:bg-muted">Xem trước</button>
        </div>
      </form>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-brand-dark">Chiến dịch đã gửi</h3>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Tên chiến dịch</AdminTh>
              <AdminTh>Ngày gửi</AdminTh>
              <AdminTh>Số người nhận</AdminTh>
              <AdminTh>Trạng thái</AdminTh>
            </tr>
          </thead>
          <tbody>
            {emailCampaigns.map((c) => (
              <tr key={c.id}>
                <AdminTd className="font-medium">{c.name}</AdminTd>
                <AdminTd className="text-muted-foreground">{c.sentDate}</AdminTd>
                <AdminTd>{c.recipients.toLocaleString("vi-VN")}</AdminTd>
                <AdminTd>
                  <StatusBadge label={c.status === "sent" ? "Đã gửi" : "Nháp"} variant={c.status === "sent" ? "success" : "warning"} />
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
