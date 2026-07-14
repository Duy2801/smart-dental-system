import apiClient from "@/src/lib/api/client";
import type { Invoice, InvoiceStatusFilter } from "./types";

export async function getInvoices(params: {
  search?: string;
  status?: InvoiceStatusFilter;
}) {
  const response = await apiClient.get<Invoice[]>("/invoices", { params });
  return response.data;
}
