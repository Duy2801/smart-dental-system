"use client";

import { useState, useMemo } from "react";
import { cn } from "@/src/lib/utils/cn";

type Service = {
  id: string;
  category: string;
  name: string;
  description: string;
  duration_minutes: number;
  base_price: number;
  is_active: boolean;
};

const initialServices: Service[] = [
  { id: "s1", category: "Khám tổng quát", name: "Khám định kỳ", description: "Kiểm tra tình trạng răng miệng tổng quát", duration_minutes: 30, base_price: 200000, is_active: true },
  { id: "s2", category: "Khám tổng quát", name: "Chụp X-quang toàn hàm", description: "Chụp phim Panorama", duration_minutes: 15, base_price: 150000, is_active: true },
  { id: "s3", category: "Nhổ răng", name: "Nhổ răng sữa", description: "Nhổ răng sữa có bôi tê", duration_minutes: 20, base_price: 100000, is_active: true },
  { id: "s4", category: "Nhổ răng", name: "Nhổ răng khôn mọc thẳng", description: "Tiểu phẫu nhẹ", duration_minutes: 45, base_price: 1500000, is_active: true },
  { id: "s5", category: "Nhổ răng", name: "Nhổ răng khôn mọc lệch", description: "Tiểu phẫu phức tạp", duration_minutes: 60, base_price: 3500000, is_active: false },
  { id: "s6", category: "Thẩm mỹ", name: "Tẩy trắng răng tại phòng", description: "Tẩy trắng bằng Laser", duration_minutes: 90, base_price: 2500000, is_active: true },
  { id: "s7", category: "Thẩm mỹ", name: "Trám răng thẩm mỹ", description: "Trám Composite răng cửa", duration_minutes: 45, base_price: 500000, is_active: true },
];

export function ServicesPageContent() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Group services by category based on search query
  const groupedServices = useMemo(() => {
    const filtered = services.filter((s) => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services, searchQuery]);

  const toggleStatus = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  const removeService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newService: Service = {
      id: Math.random().toString(),
      category: formData.get("category") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      duration_minutes: Number(formData.get("duration")),
      base_price: Number(formData.get("price")),
      is_active: true,
    };
    setServices(prev => [...prev, newService]);
    setIsAddModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Tìm tên dịch vụ hoặc danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          
          <button 
            type="button" 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Thêm dịch vụ
          </button>
        </div>

        {/* Grouped Data List */}
        <div className="space-y-6">
          {Object.entries(groupedServices).length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy dịch vụ nào phù hợp.
            </div>
          ) : (
            Object.entries(groupedServices).map(([category, items]) => (
              <div key={category} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="bg-muted/50 px-5 py-3 border-b border-border">
                  <h3 className="font-semibold text-brand-dark">{category}</h3>
                </div>
                
                <div className="divide-y divide-border">
                  {items.map((svc) => (
                    <div key={svc.id} className="group relative flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                      
                      <div className="flex flex-col gap-1 pr-4 sm:w-1/3">
                        <span className="font-medium text-brand-dark">{svc.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{svc.description}</span>
                      </div>
                      
                      <div className="hidden sm:flex items-center text-sm text-muted-foreground w-32 shrink-0">
                        <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {svc.duration_minutes} phút
                      </div>
                      
                      <div className="font-mono text-sm font-medium text-brand-dark w-28 shrink-0 text-right">
                        {formatVND(svc.base_price)}
                      </div>
                      
                      <div className="hidden md:flex w-32 shrink-0 justify-end">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", 
                          svc.is_active ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"
                        )}>
                          {svc.is_active ? "Đang cung cấp" : "Ngừng cung cấp"}
                        </span>
                      </div>
                      
                      {/* Row Actions - Visible on Hover */}
                      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white shadow-sm border border-border rounded-lg p-1">
                        <button 
                          type="button" 
                          title="Sửa dịch vụ"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-light hover:text-brand transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button 
                          type="button" 
                          title={svc.is_active ? "Tạm ngưng" : "Bật lại"}
                          onClick={() => toggleStatus(svc.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          {svc.is_active ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 9-6 6"/><path d="M17.94 17.94A10 10 0 0 1 3.33 6.7a10 10 0 0 0 14.61 11.24Z"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                        <div className="w-[1px] h-4 bg-border mx-1" />
                        <button 
                          type="button" 
                          title="Xóa dịch vụ"
                          onClick={() => removeService(svc.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-brand-dark">Thêm dịch vụ mới</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Thêm thông tin dịch vụ và bảng giá vào hệ thống phòng khám.
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleAddSubmit}>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Danh mục</label>
                  <input 
                    type="text" 
                    name="category"
                    required
                    placeholder="VD: Nhổ răng, Thẩm mỹ..."
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Tên dịch vụ</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    placeholder="Nhổ răng khôn..."
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Mô tả chi tiết</label>
                <textarea 
                  name="description"
                  rows={2}
                  placeholder="Ghi chú thêm về quy trình hoặc thông tin dịch vụ..."
                  className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Thời lượng (phút)</label>
                  <input 
                    type="number" 
                    name="duration"
                    required
                    min="1"
                    defaultValue="30"
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Giá cơ bản (VND)</label>
                  <input 
                    type="number" 
                    name="price"
                    required
                    min="0"
                    step="50000"
                    placeholder="0"
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono text-right outline-none focus:border-brand focus:ring-1 focus:ring-brand" 
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
                >
                  Lưu dịch vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
