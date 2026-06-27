import React from "react";

// Inline SVGs for quick implementation without external dependencies
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const MOCK_SCHEDULE = [
  { id: "S1", time: "08:00", patient: "Nguyễn Văn A", service: "Khám tổng quát & Lấy cao răng", assistant: "Trần Thị B", status: "Hoàn thành" },
  { id: "S2", time: "09:30", patient: "Lê Hoàng C", service: "Nhổ răng khôn (Răng 38)", assistant: "Trần Thị B", status: "Đang chờ" },
  { id: "S3", time: "11:00", patient: "Phạm Thị D", service: "Tái khám niềng răng Invisalign", assistant: "Nguyễn Văn E", status: "Vắng mặt" },
  { id: "S4", time: "13:30", patient: "Hoàng Minh Q", service: "Cắm Implant (Răng 46)", assistant: "Nguyễn Văn E", status: "Hủy" },
  { id: "S5", time: "15:00", patient: "Đỗ Thu H", service: "Tẩy trắng răng Laser", assistant: "Trần Thị B", status: "Đang chờ" },
];

const MOCK_CALLS = [
  { id: "C1", time: "16:30", patient: "Trần Văn F", topic: "Tư vấn niềng răng mắc cài" },
  { id: "C2", time: "17:15", patient: "Đinh Thị G", topic: "Đau nhức sau khi nhổ răng" },
];

export default function DoctorDashboard() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hoàn thành":
        return <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Hoàn thành</span>;
      case "Đang chờ":
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Đang chờ</span>;
      case "Vắng mặt":
        return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Vắng mặt</span>;
      case "Hủy":
        return <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Hủy</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header & Quick Actions */}
      <header className="sticky top-0 z-10 border-b border-border bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-brand-dark">Chào Bác sĩ Trần Sơn,</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hôm nay bạn có <strong className="font-medium text-foreground">5 ca khám</strong> và <strong className="font-medium text-foreground">2 cuộc gọi tư vấn</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm bệnh nhân bằng AI..."
                className="w-80 rounded-lg border border-border bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white p-1 shadow-sm">
                <SparklesIcon className="h-3 w-3 text-brand" />
              </div>
            </div>
            
            <button className="relative rounded-lg border border-border bg-white p-2 text-muted-foreground hover:bg-slate-50 hover:text-foreground">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark">
              Bắt đầu ca khám tiếp
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto mt-6 max-w-7xl px-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          
          {/* CỘT CHÍNH: Lịch khám */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Lịch khám hôm nay</h2>
                <div className="text-sm font-medium text-muted-foreground">Thứ Ba, 27 Tháng 6</div>
              </div>
              
              <div className="divide-y divide-border/50">
                {MOCK_SCHEDULE.map((item) => (
                  <div key={item.id} className="group flex items-start gap-4 p-5 transition-colors hover:bg-slate-50/50">
                    <div className="mt-0.5 w-14 shrink-0 text-right text-sm font-medium text-brand-dark">
                      {item.time}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium text-foreground">{item.patient}</h3>
                          {getStatusBadge(item.status)}
                        </div>
                        <button className="hidden rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-slate-50 group-hover:block">
                          Vào hồ sơ khám
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <FileTextIcon className="h-3.5 w-3.5" />
                          {item.service}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5" />
                          Phụ tá: {item.assistant}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* CỘT PHỤ: Video Calls & Task Stats */}
          <div className="space-y-6">
            
            {/* Cuộc gọi tư vấn */}
            <section className="rounded-xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Cuộc gọi tư vấn trực tuyến</h2>
              </div>
              <div className="divide-y divide-border/50 p-2">
                {MOCK_CALLS.map((call) => (
                  <div key={call.id} className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-brand-dark">{call.time}</span>
                      <button className="flex items-center gap-1.5 rounded text-xs font-medium text-brand transition-colors hover:text-brand-dark">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        Xem tóm tắt AI
                      </button>
                    </div>
                    <h3 className="text-sm font-medium text-foreground">{call.patient}</h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground">Chủ đề: {call.topic}</p>
                    <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-light px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10">
                      <VideoIcon className="h-4 w-4" />
                      Tham gia phòng
                    </button>
                  </div>
                ))}
                {MOCK_CALLS.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Không có cuộc gọi nào sắp tới.
                  </div>
                )}
              </div>
            </section>

            {/* Quản lý Điều trị & Tái khám */}
            <section className="rounded-xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Theo dõi & Nhắc việc</h2>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between rounded-lg border border-border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">Đơn thuốc chờ duyệt</div>
                    <div className="text-xs text-muted-foreground">Cần ký điện tử</div>
                  </div>
                  <div className="text-xl font-bold text-brand-dark">12</div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">Bệnh nhân tái khám</div>
                    <div className="text-xs text-muted-foreground">Trong 7 ngày tới</div>
                  </div>
                  <div className="text-xl font-bold text-brand-dark">08</div>
                </div>

                {/* Ghi chú nội bộ mẫu */}
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-800">
                    <LockIcon className="h-3.5 w-3.5" />
                    Ghi chú nội bộ (Private)
                  </div>
                  <p className="text-xs leading-relaxed text-amber-700/90">
                    Ca lúc 09:30 (Lê Hoàng C) có tiền sử phản ứng nhẹ với thuốc tê. Cần chuẩn bị sẵn phương án dự phòng.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
