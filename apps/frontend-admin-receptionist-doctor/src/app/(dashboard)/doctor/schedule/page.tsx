import React from "react";

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const MOCK_APPOINTMENTS = [
  { id: "AP-001", time: "08:00 - 09:00", patient: "Nguyễn Văn A", phone: "0901234567", service: "Khám tổng quát", status: "Hoàn thành", note: "Bệnh nhân đến sớm 10p" },
  { id: "AP-002", time: "09:30 - 10:30", patient: "Lê Hoàng C", phone: "0987654321", service: "Nhổ răng khôn", status: "Đang chờ", note: "Chuẩn bị phim X-quang" },
  { id: "AP-003", time: "11:00 - 12:00", patient: "Phạm Thị D", phone: "0911223344", service: "Tái khám niềng răng", status: "Vắng mặt", note: "Gọi không nghe máy" },
  { id: "AP-004", time: "13:30 - 15:00", patient: "Hoàng Minh Q", phone: "0933445566", service: "Cắm Implant", status: "Hủy", note: "Bệnh nhân báo ốm" },
  { id: "AP-005", time: "15:00 - 16:00", patient: "Đỗ Thu H", phone: "0977889900", service: "Tẩy trắng răng", status: "Chưa bắt đầu", note: "" },
];

export default function SchedulePage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hoàn thành": return <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Hoàn thành</span>;
      case "Đang chờ": return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Đang chờ</span>;
      case "Chưa bắt đầu": return <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">Chưa bắt đầu</span>;
      case "Vắng mặt": return <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Vắng mặt</span>;
      case "Hủy": return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-dark">Lịch khám bệnh</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quản lý ca khám, theo dõi trạng thái bệnh nhân trong ngày.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark">
            <PlusIcon className="h-4 w-4" />
            Thêm lịch hẹn
          </button>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân, SĐT..."
                  className="w-full rounded-md border border-border py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                Lọc
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">27/06/2026</span>
              <span>(Hôm nay)</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50/50 text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Bệnh nhân</th>
                  <th className="px-4 py-3">Dịch vụ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ghi chú</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {MOCK_APPOINTMENTS.map((apt) => (
                  <tr key={apt.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-dark">{apt.time}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{apt.patient}</div>
                      <div className="text-xs text-muted-foreground">{apt.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{apt.service}</td>
                    <td className="px-4 py-3">{getStatusBadge(apt.status)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={apt.note}>
                      {apt.note || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="font-medium text-brand hover:text-brand-dark hover:underline">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">5</span> ca khám trong ngày.
          </div>
        </div>
      </div>
    </div>
  );
}
