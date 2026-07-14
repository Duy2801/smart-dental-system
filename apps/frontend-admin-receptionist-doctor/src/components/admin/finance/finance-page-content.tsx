"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
import { FinanceSummaryCards } from "./components/finance-summary-cards";
import { FinanceToolbar } from "./components/finance-toolbar";
import { InvoiceDetailsModal } from "./components/invoice-details-modal";
import { InvoiceList } from "./components/invoice-list";
import {
  filterInvoices,
  getFinanceStats,
} from "./finance-utils";
import { getInvoices } from "./finance-api";
import type { Invoice, InvoiceStatusFilter } from "./types";

export function FinancePageContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InvoiceStatusFilter>("ALL");
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
    () => filterInvoices(invoices, search, statusFilter),
    [invoices, search, statusFilter],
  );
  const stats = getFinanceStats(invoices);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <FinanceSummaryCards {...stats} />
      <FinanceToolbar
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />
      <InvoiceList
        loading={isLoading}
        invoices={filteredInvoices}
        onSelectInvoice={setSelectedInvoice}
      />
      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          Khong tai duoc du lieu hoa don.
        </div>
      ) : null}
      {selectedInvoice ? (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      ) : null}
    </div>
  );
}
