import React from "react";
import Link from "next/link";

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const PrinterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

const MOCK_PRESCRIPTIONS = [
  { id: "RX-2026-001", date: "27/06/2026", patient: "Lê Hoàng C", diagnosis: "Viêm tủy răng 38", status: "Chờ duyệt" },
  { id: "RX-2026-002", date: "26/06/2026", patient: "Nguyễn Văn A", diagnosis: "Viêm nha chu nhẹ", status: "Đã xuất" },
  { id: "RX-2026-003", date: "25/06/2026", patient: "Phạm Thị D", diagnosis: "Đau nhức sau cắm Implant", status: "Đã xuất" },
];

export default function PrescriptionsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-dark">Đơn thuốc điện tử</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kê đơn, phê duyệt và in đơn thuốc cho bệnh nhân.</p>
          </div>
          <Link href="/doctor/prescriptions/new" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark">
            <PlusIcon className="h-4 w-4" />
            Kê đơn mới
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-4">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên bệnh nhân..."
                className="w-full rounded-md border border-border py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50/50 text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Mã đơn thuốc</th>
                  <th className="px-4 py-3">Ngày kê</th>
                  <th className="px-4 py-3">Bệnh nhân</th>
                  <th className="px-4 py-3">Chẩn đoán</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {MOCK_PRESCRIPTIONS.map((rx) => (
                  <tr key={rx.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-dark">{rx.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rx.date}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{rx.patient}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rx.diagnosis}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        rx.status === 'Chờ duyệt' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'
                      }`}>
                        {rx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground">
                        <PrinterIcon className="h-3.5 w-3.5" /> In đơn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
