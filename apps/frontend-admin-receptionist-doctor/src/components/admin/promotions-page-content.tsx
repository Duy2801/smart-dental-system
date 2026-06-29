"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

type Promotion = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const mockPromotions: Promotion[] = [
  {
    id: "1",
    code: "WELCOME20",
    name: "Ưu đãi khách hàng mới",
    description: "Giảm 20% cho lần khám đầu tiên",
    discount_type: "PERCENTAGE",
    discount_value: 20,
    max_uses: 100,
    used_count: 45,
    start_date: "2026-06-01T00:00:00Z",
    end_date: "2026-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "2",
    code: "SUMMER500K",
    name: "Chào hè rực rỡ",
    description: "Giảm trực tiếp 500k cho dịch vụ Niềng răng",
    discount_type: "FIXED_AMOUNT",
    discount_value: 500000,
    max_uses: 50,
    used_count: 50, // Hết lượt
    start_date: "2026-05-01T00:00:00Z",
    end_date: "2026-08-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "3",
    code: "TAYTRANGVIP",
    name: "Tẩy trắng răng VIP",
    description: "Giảm 30% khi tẩy trắng răng vào thứ 3 hàng tuần",
    discount_type: "PERCENTAGE",
    discount_value: 30,
    max_uses: 200,
    used_count: 120,
    start_date: "2026-01-01T00:00:00Z",
    end_date: "2026-06-01T00:00:00Z", // Đã hết hạn
    is_active: true,
  },
  {
    id: "4",
    code: "VIPMEMBER",
    name: "Tri ân khách hàng thân thiết",
    description: "Giảm 1.000.000đ cho hóa đơn trên 10 triệu",
    discount_type: "FIXED_AMOUNT",
    discount_value: 1000000,
    max_uses: 20,
    used_count: 5,
    start_date: "2026-06-15T00:00:00Z",
    end_date: "2026-07-15T23:59:59Z",
    is_active: false, // Tạm ngưng
  },
];

export function PromotionsPageContent() {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "PAUSED">("ALL");
  const [showModal, setShowModal] = useState(false);

  const getStatusInfo = (promo: Promotion) => {
    const now = new Date().getTime();
    const endDate = new Date(promo.end_date).getTime();
    
    if (!promo.is_active) {
      return { id: "PAUSED", label: "Tạm ngưng", color: "border-gray-200 bg-gray-50 text-gray-600" };
    }
    if (promo.used_count >= promo.max_uses) {
      return { id: "EXPIRED", label: "Hết lượt", color: "border-orange-200 bg-orange-50 text-orange-700" };
    }
    if (now > endDate) {
      return { id: "EXPIRED", label: "Đã kết thúc", color: "border-red-200 bg-red-50 text-red-700" };
    }
    return { id: "ACTIVE", label: "Đang diễn ra", color: "border-green-200 bg-green-50 text-green-700" };
  };

  const formatValue = (type: DiscountType, value: number) => {
    if (type === "PERCENTAGE") return `${value}%`;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const info = getStatusInfo(p);
      const matchStatus = statusFilter === "ALL" || info.id === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [promotions, search, statusFilter]);

  const toggleStatus = (id: string) => {
    setPromotions((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = (newPromo: Promotion) => {
    setPromotions((prev) => [newPromo, ...prev]);
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
              placeholder="Tìm mã hoặc tên CTKM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[160px]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang diễn ra</option>
            <option value="EXPIRED">Đã kết thúc / Hết lượt</option>
            <option value="PAUSED">Tạm ngưng</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Tạo mã Voucher
        </button>
      </div>

      {/* Promotion List */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="bg-muted/50 px-5 py-3 border-b border-border hidden sm:flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-[30%]">Mã & Chương trình</div>
          <div className="w-[15%]">Mức giảm</div>
          <div className="w-[20%]">Lượt dùng</div>
          <div className="w-[20%]">Thời hạn</div>
          <div className="w-[15%] text-right pr-4">Trạng thái</div>
        </div>
        <div className="divide-y divide-border">
          {filteredPromotions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy chương trình khuyến mãi nào.
            </div>
          ) : (
            filteredPromotions.map((promo) => {
              const status = getStatusInfo(promo);
              const progress = Math.min(100, Math.round((promo.used_count / promo.max_uses) * 100));
              
              return (
                <div key={promo.id} className="group relative flex flex-col sm:flex-row sm:items-center p-5 hover:bg-muted/20 transition-colors gap-3 sm:gap-0">
                  
                  {/* Code & Name */}
                  <div className="flex flex-col pr-4 sm:w-[30%] shrink-0">
                    <span className="inline-block w-fit rounded bg-muted px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-brand-dark border border-border">
                      {promo.code}
                    </span>
                    <span className="text-sm font-medium text-brand-dark mt-2">{promo.name}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{promo.description}</span>
                  </div>
                  
                  {/* Discount Value */}
                  <div className="flex sm:w-[15%] shrink-0 items-center">
                    <span className="font-mono text-sm font-semibold text-brand">
                      {formatValue(promo.discount_type, promo.discount_value)}
                    </span>
                  </div>

                  {/* Usage Progress */}
                  <div className="flex flex-col sm:w-[20%] shrink-0 pr-6">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Đã dùng: {promo.used_count}</span>
                      <span className="font-medium text-brand-dark">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", progress >= 100 ? "bg-red-500" : "bg-brand")} 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-col sm:w-[20%] shrink-0 text-xs text-muted-foreground">
                    <span>Bắt đầu: <span className="font-medium text-brand-dark">{formatDate(promo.start_date)}</span></span>
                    <span className="mt-1">Kết thúc: <span className="font-medium text-brand-dark">{formatDate(promo.end_date)}</span></span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex sm:w-[15%] shrink-0 sm:justify-end sm:pr-4">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border text-center", status.color)}>
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Row Actions - Visible on Hover */}
                  <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white shadow-sm border border-border rounded-lg p-1">
                    <button 
                      type="button" 
                      title="Sửa"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-light hover:text-brand transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                      type="button" 
                      title={promo.is_active ? "Tạm ngưng" : "Kích hoạt lại"}
                      onClick={() => toggleStatus(promo.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {promo.is_active ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      )}
                    </button>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <button 
                      type="button" 
                      title="Xóa voucher"
                      onClick={() => deletePromotion(promo.id)}
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

      {showModal && <AddPromoModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}

function AddPromoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (promo: Promotion) => void }) {
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    onAdd({
      id: String(Date.now()),
      code: String(fd.get("code")).toUpperCase(),
      name: String(fd.get("name")),
      description: String(fd.get("description")),
      discount_type: discountType,
      discount_value: Number(fd.get("discount_value")),
      max_uses: Number(fd.get("max_uses")),
      used_count: 0,
      start_date: String(fd.get("start_date")),
      end_date: String(fd.get("end_date")),
      is_active: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-brand-dark">Tạo mã Voucher mới</h3>
        <p className="mt-1 text-sm text-muted-foreground">Thiết lập chương trình khuyến mãi cho khách hàng.</p>
        
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Mã Code (viết liền)</label>
              <input name="code" required placeholder="VD: SUMMER24" className="rounded-lg border border-border bg-white px-3 py-2 text-sm uppercase font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Giới hạn lượt dùng</label>
              <input name="max_uses" type="number" required min="1" placeholder="100" className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">Tên chương trình</label>
            <input name="name" required placeholder="Giảm giá chào hè..." className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">Mô tả ngắn</label>
            <input name="description" placeholder="Áp dụng cho dịch vụ Niềng răng..." className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Loại giảm giá</label>
              <select 
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Tiền mặt (VND)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                {discountType === "PERCENTAGE" ? "Mức giảm (%)" : "Mức giảm (VND)"}
              </label>
              <input 
                name="discount_value" 
                type="number" 
                required 
                min="1"
                max={discountType === "PERCENTAGE" ? 100 : undefined}
                placeholder={discountType === "PERCENTAGE" ? "20" : "500000"} 
                className={cn("rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand",
                  discountType === "FIXED_AMOUNT" && "text-right"
                )} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Từ ngày</label>
              <input name="start_date" type="date" required className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">Đến ngày</label>
              <input name="end_date" type="date" required className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]">
              Hủy
            </button>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]">
              Tạo mã
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
