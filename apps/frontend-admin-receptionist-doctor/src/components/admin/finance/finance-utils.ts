import type {
  DateRangePreset,
  Invoice,
  InvoiceStatus,
  PaymentMethodFilter,
} from "./types";

export const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  PAID: {
    label: "Đã thanh toán",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold",
  },
  PARTIAL: {
    label: "Thanh toán 1 phần",
    color: "border-blue-200 bg-blue-50 text-blue-700 font-bold",
  },
  UNPAID: {
    label: "Chờ thanh toán",
    color: "border-amber-200 bg-amber-50 text-amber-700 font-bold",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "border-slate-200 bg-slate-100 text-slate-500 font-medium",
  },
};

export const paymentLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  CARD: "Quẹt thẻ",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  E_WALLET: "Ví điện tử",
  ONLINE_GATEWAY: "Cổng thanh toán Online",
  VIETQR: "Chuyển khoản VietQR",
  VNPAY: "VNPAY QR",
  MOMO: "Ví MoMo",
};

export function getInvoiceStatusConfig(status?: string) {
  if (status && status in invoiceStatusConfig) {
    return invoiceStatusConfig[status as InvoiceStatus];
  }
  return {
    label: status || "Chưa xác định",
    color: "border-slate-200 bg-slate-100 text-slate-600",
  };
}

export function getPaymentLabel(method?: string) {
  if (!method) return "Chưa thanh toán";
  return paymentLabels[method] || method;
}

export function formatVND(amount?: number) {
  if (typeof amount !== "number" || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function filterInvoices(
  invoices: Invoice[],
  search: string,
  statusFilter: InvoiceStatus | "ALL",
  paymentMethodFilter: PaymentMethodFilter = "ALL",
  datePreset: DateRangePreset = "ALL",
  startDateStr?: string,
  endDateStr?: string
) {
  const now = new Date();

  return invoices.filter((invoice) => {
    // 1. Status Filter
    const matchStatus =
      statusFilter === "ALL" || invoice.status === statusFilter;

    // 2. Search Query
    const query = search.toLowerCase().trim();
    const matchSearch =
      !query ||
      invoice.invoice_code.toLowerCase().includes(query) ||
      invoice.patient_name.toLowerCase().includes(query) ||
      (invoice.doctor_name && invoice.doctor_name.toLowerCase().includes(query));

    // 3. Payment Method Filter
    const matchPayment =
      paymentMethodFilter === "ALL" ||
      (invoice.payment_method &&
        invoice.payment_method.toUpperCase() === paymentMethodFilter.toUpperCase());

    // 4. Date Filter
    let matchDate = true;
    if (invoice.issued_at) {
      const issuedDate = new Date(invoice.issued_at);

      if (datePreset === "TODAY") {
        matchDate = isSameDay(issuedDate, now);
      } else if (datePreset === "THIS_WEEK") {
        const startOfWeek = new Date(now);
        const day = now.getDay() || 7; // Monday = 1
        startOfWeek.setDate(now.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        matchDate = issuedDate >= startOfWeek;
      } else if (datePreset === "THIS_MONTH") {
        matchDate =
          issuedDate.getFullYear() === now.getFullYear() &&
          issuedDate.getMonth() === now.getMonth();
      } else if (datePreset === "CUSTOM") {
        if (startDateStr) {
          const start = new Date(startDateStr);
          start.setHours(0, 0, 0, 0);
          matchDate = matchDate && issuedDate >= start;
        }
        if (endDateStr) {
          const end = new Date(endDateStr);
          end.setHours(23, 59, 59, 999);
          matchDate = matchDate && issuedDate <= end;
        }
      }
    }

    return matchStatus && matchSearch && matchPayment && matchDate;
  });
}

export function getFinanceStats(invoices: Invoice[]) {
  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID" || inv.status === "PARTIAL")
    .reduce((sum, inv) => sum + (inv.paid_amount ?? inv.final_amount), 0);

  const pendingCount = invoices.filter(
    (inv) => inv.status === "UNPAID" || inv.status === "PARTIAL"
  ).length;

  const cancelledCount = invoices.filter((inv) => inv.status === "CANCELLED").length;

  return {
    totalRevenue,
    pendingCount,
    cancelledCount,
    totalInvoices: invoices.length,
  };
}

export function exportInvoicesToExcel(invoices: Invoice[], filename = "Bao_Cao_Thu_Chi_Nha_Khoa.csv") {
  if (!invoices || invoices.length === 0) {
    alert("Không có dữ liệu hóa đơn để xuất báo cáo!");
    return;
  }

  const headers = [
    "Mã Hóa Đơn",
    "Bệnh Nhân",
    "Bác Sĩ Chỉ Định",
    "Ngày Lập",
    "Phương Thức Thanh Toán",
    "Tạm Tính (VNĐ)",
    "Giảm Giá (VNĐ)",
    "Tổng Tiền (VNĐ)",
    "Đã Thu (VNĐ)",
    "Còn Nợ (VNĐ)",
    "Trạng Thái",
  ];

  const rows = invoices.map((inv) => {
    const statusCfg = getInvoiceStatusConfig(inv.status);
    const payText = getPaymentLabel(inv.payment_method);
    const issuedDate = inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("vi-VN") : "";

    return [
      `"${inv.invoice_code || ""}"`,
      `"${inv.patient_name || ""}"`,
      `"${inv.doctor_name || ""}"`,
      `"${issuedDate}"`,
      `"${payText}"`,
      inv.subtotal || 0,
      inv.discount_amount || 0,
      inv.final_amount || 0,
      inv.paid_amount ?? inv.final_amount ?? 0,
      inv.remaining_amount || 0,
      `"${statusCfg.label}"`,
    ].join(",");
  });

  // Calculate totals summary row
  const totalSubtotal = invoices.reduce((s, i) => s + (i.subtotal || 0), 0);
  const totalDiscount = invoices.reduce((s, i) => s + (i.discount_amount || 0), 0);
  const totalFinal = invoices.reduce((s, i) => s + (i.final_amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount ?? i.final_amount ?? 0), 0);
  const totalRemaining = invoices.reduce((s, i) => s + (i.remaining_amount || 0), 0);

  const summaryRow = [
    '"TỔNG CỘNG"',
    '""',
    '""',
    '""',
    '""',
    totalSubtotal,
    totalDiscount,
    totalFinal,
    totalPaid,
    totalRemaining,
    '""',
  ].join(",");

  const csvContent = "\uFEFF" + [headers.join(","), ...rows, summaryRow].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
