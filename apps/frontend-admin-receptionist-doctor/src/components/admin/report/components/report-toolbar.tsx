"use client";

import { CalendarBlank, ChartLine, DownloadSimple } from "@phosphor-icons/react";
import { AdminButton, AdminFilterSelect, AdminToolbar } from "@/src/components/admin/common";
import type { ReportTimeFilter } from "../types";

type ReportToolbarProps = {
  disabled?: boolean;
  onExport: () => void;
  timeFilter: ReportTimeFilter;
  onTimeFilterChange: (value: ReportTimeFilter) => void;
  refreshing?: boolean;
};

export function ReportToolbar({
  disabled = false,
  onExport,
  timeFilter,
  onTimeFilterChange,
  refreshing = false,
}: ReportToolbarProps) {
  return (
    <AdminToolbar
      actions={
        <>
          <AdminFilterSelect
            value={timeFilter}
            onChange={(event) => onTimeFilterChange(event.target.value as ReportTimeFilter)}
            aria-label="Khoảng thời gian báo cáo"
            icon={<CalendarBlank size={15} />}
            wrapperClassName="w-full sm:w-44"
          >
            <option value="this_month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
            <option value="this_quarter">Quý này</option>
            <option value="this_year">Năm nay</option>
          </AdminFilterSelect>
          <AdminButton disabled={disabled} onClick={onExport}>
            <DownloadSimple size={16} weight="bold" />
            Xuất báo cáo
          </AdminButton>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-light text-brand">
          <ChartLine size={20} weight="duotone" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Tổng quan thống kê</h2>
          <p className="text-xs text-slate-500">
            {refreshing ? "Đang cập nhật dữ liệu..." : "Số liệu kinh doanh của phòng khám"}
          </p>
        </div>
      </div>
    </AdminToolbar>
  );
}
