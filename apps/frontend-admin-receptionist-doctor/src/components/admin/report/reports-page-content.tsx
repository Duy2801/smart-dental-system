"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "@phosphor-icons/react";
import {
  AdminAlert,
  AdminModal,
  SkeletonCardGrid,
  SkeletonChart,
  SkeletonRows,
} from "@/src/components/admin/common";
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
        refreshing={isFetching && !isLoading}
      />

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCardGrid count={4} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonChart />
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <SkeletonRows count={5} />
            </div>
          </div>
        </div>
      ) : null}

      {isError ? (
        <AdminAlert message="Không tải được dữ liệu báo cáo thống kê." />
      ) : null}

      {!isLoading && report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.statCards.map((stat, index) => (
              <ReportStatCard key={stat.label} stat={stat} index={index} />
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
    <AdminModal
      title="Tất cả dịch vụ theo doanh thu"
      description={`${services.length} dịch vụ`}
      icon={<Trophy size={20} weight="duotone" />}
      size="md"
      onClose={onClose}
    >
      <ol className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
        {services.map((service, index) => (
          <li key={service.name} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-light text-xs font-extrabold text-brand">
                {index + 1}
              </span>
              <span className="truncate text-sm font-semibold text-slate-800">{service.name}</span>
            </div>
            <span className="shrink-0 text-sm font-bold text-slate-900">
              {new Intl.NumberFormat("vi-VN").format(service.revenue)}đ
            </span>
          </li>
        ))}
      </ol>
    </AdminModal>
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
