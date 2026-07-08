"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";

// --- Mock Data ---
const statCards = [
  { label: "Tổng Doanh Thu", value: 125000000, type: "currency", trend: 15, trendLabel: "so với tháng trước" },
  { label: "Lượt Khám Mới", value: 342, type: "number", trend: 8, trendLabel: "so với tháng trước" },
  { label: "Tỷ Lệ Tái Khám", value: 68, type: "percentage", trend: -2, trendLabel: "so với tháng trước" },
  { label: "Đánh Giá (TB)", value: 4.8, type: "decimal", trend: 5, trendLabel: "tích cực hơn" },
];

const revenueChartData = [
  { label: "T1", value: 85 },
  { label: "T2", value: 70 },
  { label: "T3", value: 95 },
  { label: "T4", value: 110 },
  { label: "T5", value: 90 },
  { label: "T6", value: 125 }, // Current max
];

const topServices = [
  { name: "Niềng răng trong suốt", revenue: 45000000 },
  { name: "Cấy ghép Implant", revenue: 35000000 },
  { name: "Tẩy trắng răng Laser", revenue: 15000000 },
  { name: "Nhổ răng khôn", revenue: 12000000 },
  { name: "Khám tổng quát", revenue: 8000000 },
];

const bookingSources = {
  total: 342,
  online: { count: 180, percentage: 52 },
  walkIn: { count: 90, percentage: 26 },
  aiChatbot: { count: 72, percentage: 22 },
};

export function ReportsPageContent() {
  const [timeFilter, setTimeFilter] = useState("this_month");

  const formatValue = (val: number, type: string) => {
    if (type === "currency") return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    if (type === "percentage") return `${val}%`;
    if (type === "decimal") return val.toFixed(1);
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const maxChartValue = Math.max(...revenueChartData.map(d => d.value));

  return (
    <div className="space-y-6 p-6 md:p-8">
      
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <h2 className="text-lg font-semibold text-brand-dark">Tổng quan Thống kê</h2>
        </div>
        <div className="flex gap-3">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="this_month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
            <option value="this_quarter">Quý này</option>
            <option value="this_year">Năm nay</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-mono text-2xl font-semibold text-brand-dark">
                {formatValue(stat.value, stat.type)}
                {stat.type === "decimal" && <span className="text-base text-yellow-500 ml-1">★</span>}
              </p>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className={cn("flex items-center font-medium", stat.trend >= 0 ? "text-green-600" : "text-red-600")}>
                {stat.trend >= 0 ? (
                  <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : (
                  <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                )}
                {Math.abs(stat.trend)}%
              </span>
              <span className="ml-1.5 text-muted-foreground">{stat.trendLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: Chart & Top Services */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* CSS Bar Chart */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-base font-semibold text-brand-dark">Doanh thu theo tháng (Triệu VND)</h3>
          <div className="mt-8 flex flex-1 items-end justify-between gap-2 sm:gap-6">
            {revenueChartData.map((item, idx) => {
              const heightPercent = Math.round((item.value / maxChartValue) * 100);
              const isCurrent = idx === revenueChartData.length - 1;
              return (
                <div key={item.label} className="group relative flex flex-1 flex-col items-center gap-2">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-dark text-white text-xs py-1 px-2 rounded font-mono z-10 whitespace-nowrap">
                    {item.value}M
                  </div>
                  {/* Bar */}
                  <div className="flex w-full flex-1 items-end justify-center h-48">
                    <div 
                      className={cn("w-full max-w-[40px] rounded-t-md transition-all duration-500", 
                        isCurrent ? "bg-brand" : "bg-brand-light hover:bg-brand/70"
                      )} 
                      style={{ height: `${heightPercent}%`, minHeight: "8px" }} 
                    />
                  </div>
                  <span className={cn("text-sm", isCurrent ? "font-semibold text-brand-dark" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-brand-dark mb-4">Top Dịch Vụ Phổ Biến</h3>
          <div className="flex flex-col gap-4 flex-1">
            {topServices.map((svc, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {idx + 1}
                  </div>
                  <span className="truncate text-sm font-medium text-brand-dark" title={svc.name}>
                    {svc.name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold text-brand-dark">
                  {new Intl.NumberFormat('vi-VN').format(svc.revenue)}đ
                </span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-brand-dark hover:bg-muted transition-colors">
            Xem tất cả
          </button>
        </div>

      </div>

      {/* Bottom Section: Booking Sources */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-brand-dark mb-6">Nguồn Khách Hàng (Lịch Hẹn)</h3>
        
        {/* Progress Bar Container */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="bg-brand transition-all" style={{ width: `${bookingSources.online.percentage}%` }} title="Online" />
          <div className="bg-orange-400 transition-all" style={{ width: `${bookingSources.walkIn.percentage}%` }} title="Walk-in" />
          <div className="bg-purple-500 transition-all" style={{ width: `${bookingSources.aiChatbot.percentage}%` }} title="AI Chatbot" />
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-between gap-4 sm:grid sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-brand" />
            <div>
              <p className="text-sm font-medium text-brand-dark">Đặt qua Web/App (Online)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="font-mono text-lg font-semibold text-brand-dark">{bookingSources.online.percentage}%</p>
                <p className="text-xs text-muted-foreground">({bookingSources.online.count} ca)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-orange-400" />
            <div>
              <p className="text-sm font-medium text-brand-dark">Đến trực tiếp (Walk-in)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="font-mono text-lg font-semibold text-brand-dark">{bookingSources.walkIn.percentage}%</p>
                <p className="text-xs text-muted-foreground">({bookingSources.walkIn.count} ca)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <div>
              <p className="text-sm font-medium text-brand-dark">AI Chatbot gợi ý</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="font-mono text-lg font-semibold text-brand-dark">{bookingSources.aiChatbot.percentage}%</p>
                <p className="text-xs text-muted-foreground">({bookingSources.aiChatbot.count} ca)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
