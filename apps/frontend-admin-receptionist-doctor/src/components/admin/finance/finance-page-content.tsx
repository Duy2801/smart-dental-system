"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminAlert } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { FinanceSummaryCards } from "./components/finance-summary-cards";
import { FinanceToolbar } from "./components/finance-toolbar";
import { InvoiceDetailsModal } from "./components/invoice-details-modal";
import { InvoiceList } from "./components/invoice-list";
import {
  exportInvoicesToExcel,
  filterInvoices,
  getFinanceStats,
} from "./finance-utils";
import { getInvoices } from "./finance-api";
import type {
  DateRangePreset,
  Invoice,
  InvoiceStatusFilter,
  PaymentMethodFilter,
} from "./types";

export function FinancePageContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InvoiceStatusFilter>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("ALL");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const {
    data: invoices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.finance(statusFilter, search),
    queryFn: () => getInvoices({ search, status: statusFilter }),
  });

  const filteredInvoices = useMemo(
    () =>
      filterInvoices(
        invoices,
        search,
        statusFilter,
        paymentMethodFilter,
        datePreset,
        startDate,
        endDate
      ),
    [
      invoices,
      search,
      statusFilter,
      paymentMethodFilter,
      datePreset,
      startDate,
      endDate,
    ]
  );

  const stats = useMemo(() => getFinanceStats(filteredInvoices), [filteredInvoices]);

  const handleExportExcel = () => {
    exportInvoicesToExcel(filteredInvoices);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Financial Summary KPI Cards */}
      <FinanceSummaryCards {...stats} />

      {/* Advanced Toolbar with Search, Status, Payment Method, Date Range & Excel Export */}
      <FinanceToolbar
        search={search}
        statusFilter={statusFilter}
        paymentMethodFilter={paymentMethodFilter}
        datePreset={datePreset}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onPaymentMethodFilterChange={setPaymentMethodFilter}
        onDatePresetChange={setDatePreset}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onExportExcel={handleExportExcel}
      />

      {isError ? (
        <AdminAlert message="Không tải được dữ liệu hóa đơn tài chính. Vui lòng kiểm tra lại kết nối." />
      ) : null}

      {/* Invoice Data Table */}
      <InvoiceList
        loading={isLoading}
        invoices={filteredInvoices}
        onSelectInvoice={setSelectedInvoice}
      />

      {/* Invoice Detail Modal */}
      {selectedInvoice ? (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      ) : null}
    </div>
  );
}
