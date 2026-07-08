"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";

type TabMenu = "general" | "hours";

export function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<TabMenu>("general");

  const [businessHours, setBusinessHours] = useState([
    { id: 1, label: "Thứ Hai", isOpen: true, start: "08:00", end: "17:00" },
    { id: 2, label: "Thứ Ba", isOpen: true, start: "08:00", end: "17:00" },
    { id: 3, label: "Thứ Tư", isOpen: true, start: "08:00", end: "17:00" },
    { id: 4, label: "Thứ Năm", isOpen: true, start: "08:00", end: "17:00" },
    { id: 5, label: "Thứ Sáu", isOpen: true, start: "08:00", end: "17:00" },
    { id: 6, label: "Thứ Bảy", isOpen: true, start: "08:00", end: "12:00" },
    { id: 0, label: "Chủ Nhật", isOpen: false, start: "08:00", end: "12:00" },
  ]);

  const toggleDay = (index: number) => {
    const newHours = [...businessHours];
    newHours[index].isOpen = !newHours[index].isOpen;
    setBusinessHours(newHours);
  };

  const menuItems = [
    { id: "general", label: "Cài đặt chung", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id: "hours", label: "Giờ làm việc", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] p-6 md:p-8 gap-8">
      
      {/* Sidebar Menu */}
      <div className="w-full lg:w-1/4 shrink-0">
        <h2 className="text-lg font-semibold text-brand-dark mb-6">Cài đặt hệ thống</h2>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabMenu)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                activeTab === item.id 
                  ? "bg-brand/10 text-brand" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-brand-dark"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pb-20">
        
        {/* GENERAL SETTINGS */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-brand-dark">Cài đặt chung</h3>
              <p className="text-sm text-muted-foreground">Thông tin cơ bản hiển thị trên hệ thống và ứng dụng bệnh nhân.</p>
            </div>
            
            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 space-y-8 shadow-sm">
              
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 shrink-0 rounded-xl bg-brand-light border-2 border-dashed border-brand/30 flex items-center justify-center text-brand">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-brand-dark">Logo phòng khám</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">Nên dùng ảnh vuông (PNG/JPG), kích thước tối đa 2MB.</p>
                  <button type="button" className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-muted transition-colors">
                    Tải ảnh lên
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Tên phòng khám</label>
                  <input defaultValue="Smart Dental Clinic" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Hotline / Số điện thoại</label>
                  <input defaultValue="1900 1234" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Email liên hệ</label>
                  <input type="email" defaultValue="contact@smartdental.com" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Địa chỉ (Trụ sở chính)</label>
                  <input defaultValue="123 Nguyễn Văn Linh, Đà Nẵng" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* BUSINESS HOURS */}
        {activeTab === "hours" && (
          <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-brand-dark">Giờ làm việc</h3>
              <p className="text-sm text-muted-foreground">Cấu hình thời gian hoạt động để hiển thị lịch cho bệnh nhân đặt hẹn.</p>
            </div>
            
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden divide-y divide-border">
              {businessHours.map((day, idx) => (
                <div key={day.id} className={cn("p-5 flex items-center justify-between transition-colors", !day.isOpen && "bg-muted/30")}>
                  <div className="flex items-center gap-4 w-1/3">
                    {/* Toggle Switch */}
                    <button 
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={cn("relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                        day.isOpen ? "bg-brand" : "bg-zinc-300"
                      )}
                    >
                      <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        day.isOpen ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                    <span className={cn("text-sm font-medium", day.isOpen ? "text-brand-dark" : "text-muted-foreground")}>{day.label}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {day.isOpen ? (
                      <>
                        <input type="time" defaultValue={day.start} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                        <span className="text-muted-foreground">-</span>
                        <input type="time" defaultValue={day.end} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground font-medium px-4">Đóng cửa</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        
        {/* ACTION BAR (Fixed at bottom right of content area) */}
        <div className="mt-auto pt-8">
          <div className="flex justify-end">
            <button type="button" className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] shadow-sm">
              Lưu thay đổi
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
