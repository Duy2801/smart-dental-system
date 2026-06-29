"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { formatDate, formatDateTime } from "@/src/lib/utils/date";

type Channel = "EMAIL" | "IN_APP";
type CampaignStatus = "PENDING" | "SENT" | "FAILED";

type Campaign = {
  id: string;
  title: string;
  content: string;
  channel: Channel;
  status: CampaignStatus;
  scheduled_at: string;
  sent_count: number;
  read_count: number;
};

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Tặng Voucher 500k cho mùa hè rực rỡ",
    content: "Chào Hè 2026, Smart Dental gửi tặng bạn mã giảm giá SUMMER500K giảm trực tiếp 500,000đ khi đăng ký dịch vụ Niềng răng. Nhanh tay đặt lịch ngay!",
    channel: "EMAIL",
    status: "SENT",
    scheduled_at: "2026-06-01T08:00:00Z",
    sent_count: 1250,
    read_count: 850,
  },
  {
    id: "2",
    title: "Nhắc nhở: Đừng quên lịch cạo vôi răng định kỳ",
    content: "Đã 6 tháng kể từ lần cuối bạn chăm sóc răng miệng. Nhấn vào đây để đặt lịch cạo vôi răng chỉ với 150k.",
    channel: "IN_APP",
    status: "SENT",
    scheduled_at: "2026-06-15T09:00:00Z",
    sent_count: 450,
    read_count: 420,
  },
  {
    id: "3",
    title: "Khảo sát dịch vụ - Nhận ngay ưu đãi 20%",
    content: "Cảm ơn bạn đã sử dụng dịch vụ tại Smart Dental. Hãy dành 1 phút đánh giá trải nghiệm để nhận mã giảm 20% nhé.",
    channel: "EMAIL",
    status: "PENDING",
    scheduled_at: "2026-07-01T10:00:00Z",
    sent_count: 0,
    read_count: 0,
  },
  {
    id: "4",
    title: "Thông báo bảo trì ứng dụng",
    content: "Hệ thống app sẽ bảo trì từ 23h đến 02h ngày mai. Xin lỗi quý khách vì sự bất tiện này.",
    channel: "IN_APP",
    status: "FAILED",
    scheduled_at: "2026-06-28T22:00:00Z",
    sent_count: 10,
    read_count: 0,
  }
];

const channelConfig = {
  EMAIL: { label: "Email", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_APP: { label: "In-App", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const statusConfig = {
  PENDING: { label: "Đang lên lịch", color: "bg-amber-100 text-amber-700 border-amber-200" },
  SENT: { label: "Đã gửi", color: "bg-green-100 text-green-700 border-green-200" },
  FAILED: { label: "Lỗi gửi", color: "bg-red-100 text-red-700 border-red-200" },
};

export function MarketingPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "ALL">("ALL");
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = search ? c.title.toLowerCase().includes(search.toLowerCase()) : true;
      const matchChannel = channelFilter === "ALL" ? true : c.channel === channelFilter;
      return matchSearch && matchChannel;
    });
  }, [campaigns, search, channelFilter]);

  // Derived Stats
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalRead = campaigns.reduce((acc, c) => acc + c.read_count, 0);
  const avgReadRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newCamp: Campaign = {
      id: String(Date.now()),
      title: String(fd.get("title")),
      content: String(fd.get("content")),
      channel: fd.get("channel") as Channel,
      status: "PENDING",
      scheduled_at: String(fd.get("scheduled_at")) || new Date().toISOString(),
      sent_count: 0,
      read_count: 0,
    };
    setCampaigns(prev => [newCamp, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Tổng Chiến Dịch</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold text-brand-dark">{totalCampaigns}</p>
            <span className="text-sm text-muted-foreground">chiến dịch</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Tổng Tiếp Cận</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold text-brand-dark">{new Intl.NumberFormat('vi-VN').format(totalSent)}</p>
            <span className="text-sm text-muted-foreground">lượt gửi</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Tỷ Lệ Mở / Đã Đọc</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold text-brand">{avgReadRate}%</p>
            <span className="text-sm text-muted-foreground">trung bình</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Tìm tên chiến dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[150px]"
          >
            <option value="ALL">Mọi Kênh</option>
            <option value="EMAIL">Email</option>
            <option value="IN_APP">In-App</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Tạo Chiến Dịch
        </button>
      </div>

      {/* Campaign List */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="bg-muted/50 px-5 py-3 border-b border-border hidden lg:flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-[45%]">Chiến Dịch</div>
          <div className="w-[15%]">Lên Lịch Gửi</div>
          <div className="w-[10%]">Kênh</div>
          <div className="w-[10%]">Trạng Thái</div>
          <div className="w-[20%] pl-4">Hiệu Suất (Mở/Đã đọc)</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy chiến dịch nào.
            </div>
          ) : (
            filtered.map((c) => {
              const readPercent = c.sent_count > 0 ? Math.round((c.read_count / c.sent_count) * 100) : 0;
              return (
                <div key={c.id} className="group relative flex flex-col lg:flex-row lg:items-center p-5 hover:bg-muted/20 transition-colors gap-4 lg:gap-0">
                  
                  {/* Title & Content */}
                  <div className="flex flex-col pr-4 lg:w-[45%] shrink-0">
                    <span className="font-semibold text-brand-dark line-clamp-1">{c.title}</span>
                    <span className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.content}</span>
                  </div>
                  
                  {/* Date */}
                  <div className="flex flex-col lg:w-[15%] shrink-0">
                    <span className="text-sm font-medium text-brand-dark">{formatDate(c.scheduled_at)}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{new Date(c.scheduled_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>

                  {/* Channel & Status */}
                  <div className="flex gap-4 lg:w-[20%] shrink-0">
                    <div className="w-1/2">
                      <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-bold border uppercase tracking-wider", channelConfig[c.channel].color)}>
                        {channelConfig[c.channel].label}
                      </span>
                    </div>
                    <div className="w-1/2">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", statusConfig[c.status].color)}>
                        {statusConfig[c.status].label}
                      </span>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="flex flex-col lg:w-[20%] shrink-0 lg:pl-4 w-full max-w-sm">
                    {c.status === "PENDING" ? (
                      <span className="text-xs text-muted-foreground italic">Chưa gửi</span>
                    ) : c.status === "FAILED" ? (
                      <span className="text-xs text-red-500 font-medium">0 gửi thành công</span>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-brand-dark">{readPercent}% Đã đọc</span>
                          <span className="text-muted-foreground">{c.read_count} / {c.sent_count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-brand rounded-full transition-all" 
                            style={{ width: `${readPercent}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Row Actions - Visible on Hover */}
                  <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white shadow-sm border border-border rounded-lg p-1">
                    <button 
                      type="button" 
                      title="Nhân bản (Tạo lại)"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-light hover:text-brand transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                    {c.status === "PENDING" && (
                      <button 
                        type="button" 
                        title="Sửa"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                    )}
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <button 
                      type="button" 
                      title="Xóa"
                      onClick={() => handleDelete(c.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Compose Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-semibold text-brand-dark">Tạo Chiến Dịch Mới</h3>
            
            <div className="overflow-y-auto pr-2 mt-6">
              <form id="campaign-form" className="flex flex-col gap-5" onSubmit={handleAdd}>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-brand-dark">Kênh gửi</label>
                    <select name="channel" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                      <option value="EMAIL">Email Marketing</option>
                      <option value="IN_APP">Thông báo App (In-App)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-brand-dark">Khách hàng mục tiêu</label>
                    <select className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                      <option value="ALL">Tất cả bệnh nhân</option>
                      <option value="VIP">Khách hàng VIP</option>
                      <option value="REEXAM">Sắp đến hạn tái khám</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Tiêu đề thông báo / Email</label>
                  <input name="title" required placeholder="Nhập tiêu đề hấp dẫn..." className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Nội dung chiến dịch</label>
                  <textarea name="content" required rows={5} placeholder="Chi tiết ưu đãi hoặc thông báo..." className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Hẹn giờ gửi (Bỏ trống để gửi ngay)</label>
                  <input name="scheduled_at" type="datetime-local" className="w-full sm:w-1/2 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>

              </form>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border bg-white shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]">
                Hủy
              </button>
              <button type="submit" form="campaign-form" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]">
                Lên lịch gửi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
