"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SkeletonCardGrid, SkeletonChart, SkeletonRows } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { BookingSourcesCard } from "./components/booking-sources-card";
import { ReportStatCard } from "./components/report-stat-card";
import { ReportToolbar } from "./components/report-toolbar";
import { RevenueChartCard } from "./components/revenue-chart-card";
import { TopServicesCard } from "./components/top-services-card";
import { getReportOverview } from "./report-api";
import type { ReportOverview, ReportTimeFilter } from "./types";

export function ReportsPageContent() {
  const [timeFilter, setTimeFilter] =
    useState<ReportTimeFilter>("this_month");
  const [showAllServices, setShowAllServices] = useState(false);

  const {
    data: report,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.report(timeFilter),
    queryFn: () => getReportOverview(timeFilter),
  });

  const handleExport = () => {
    if (!report) return;

    const rows = [
      ["Báo cáo", getTimeFilterLabel(timeFilter)],
      ["Từ ngày", formatDate(report.period.start)],
      ["Đến ngày", formatDate(report.period.end)],
      [],
      ["Chỉ số", "Giá trị", "Loại", "Xu hướng", "Mô tả xu hướng"],
      ...report.statCards.map((stat) => [
        stat.label,
        String(stat.value),
        stat.type,
        `${stat.trend}%`,
        stat.trendLabel,
      ]),
      [],
      ["Doanh thu theo tháng", "Triệu VNĐ"],
      ...report.revenueChartData.map((item) => [
        item.label,
        String(item.value),
      ]),
      [],
      ["Dịch vụ", "Doanh thu"],
      ...report.topServices.map((service) => [
        service.name,
        String(service.revenue),
      ]),
      [],
      ["Nguồn lịch hẹn", "Số lượng", "Tỷ lệ"],
      ["Online", String(report.bookingSources.online.count), `${report.bookingSources.online.percentage}%`],
      ["Trực tiếp", String(report.bookingSources.walkIn.count), `${report.bookingSources.walkIn.percentage}%`],
      ["AI Chatbot", String(report.bookingSources.aiChatbot.count), `${report.bookingSources.aiChatbot.percentage}%`],
    ];

    const csvContent = rows.map(toCsvRow).join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-${timeFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <ReportToolbar
        disabled={!report || isLoading}
        onExport={handleExport}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {isLoading || isFetching ? (
        <div className="space-y-6">
          <SkeletonCardGrid count={4} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonChart />
            </div>
            <div className="rounded-2xl border border-border bg-white shadow-xs">
              <SkeletonRows count={5} />
            </div>
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Không tải được dữ liệu báo cáo thống kê.
        </div>
      ) : null}

      {!isLoading && report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.statCards.map((stat) => (
              <ReportStatCard key={stat.label} stat={stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RevenueChartCard data={report.revenueChartData} />
            <TopServicesCard
              services={report.topServices}
              onViewAll={() => setShowAllServices(true)}
            />
          </div>

          <BookingSourcesCard sources={report.bookingSources} />
          {showAllServices ? (
            <AllServicesModal
              services={report.topServices}
              onClose={() => setShowAllServices(false)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function AllServicesModal({
  onClose,
  services,
}: {
  onClose: () => void;
  services: ReportOverview["topServices"];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng danh sách dịch vụ"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-bold text-brand-dark">
            Tất cả dịch vụ theo doanh thu
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-brand-dark hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {services.map((service, index) => (
              <div
                key={service.name}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-semibold text-brand-dark">
                    {service.name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold text-brand-dark">
                  {new Intl.NumberFormat("vi-VN").format(service.revenue)}đ
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function toCsvRow(row: Array<string | number>) {
  return row
    .map((cell) => {
      const value = String(cell ?? "");
      return `"${value.replace(/"/g, '""')}"`;
    })
    .join(",");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getTimeFilterLabel(timeFilter: ReportTimeFilter) {
  const labels: Record<ReportTimeFilter, string> = {
    this_month: "Tháng này",
    last_month: "Tháng trước",
    this_quarter: "Quý này",
    this_year: "Năm nay",
  };

  return labels[timeFilter];
}
