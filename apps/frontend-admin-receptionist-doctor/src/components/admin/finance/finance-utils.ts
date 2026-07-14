import type { Invoice, InvoiceStatus, PaymentMethod } from "./types";

export const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  PAID: {
    label: "Da thanh toan",
    color: "border-green-200 bg-green-50 text-green-700",
  },
  UNPAID: {
    label: "Cho thanh toan",
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
  CANCELLED: {
    label: "Da huy",
    color: "border-gray-200 bg-gray-50 text-gray-500",
  },
};

export const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Tien mat",
  CARD: "The",
  BANK_TRANSFER: "Chuyen khoan",
  E_WALLET: "Vi dien tu",
  ONLINE_GATEWAY: "Online",
};

export function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function filterInvoices(
  invoices: Invoice[],
  search: string,
  statusFilter: InvoiceStatus | "ALL",
) {
  return invoices.filter((invoice) => {
    const matchStatus =
      statusFilter === "ALL" || invoice.status === statusFilter;
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      invoice.invoice_code.toLowerCase().includes(query) ||
      invoice.patient_name.toLowerCase().includes(query);

    return matchStatus && matchSearch;
  });
}

export function getFinanceStats(invoices: Invoice[]) {
  return {
    totalRevenue: invoices
      .filter((invoice) => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.final_amount, 0),
    pendingCount: invoices.filter((invoice) => invoice.status === "UNPAID")
      .length,
    cancelledCount: invoices.filter((invoice) => invoice.status === "CANCELLED")
      .length,
  };
}
