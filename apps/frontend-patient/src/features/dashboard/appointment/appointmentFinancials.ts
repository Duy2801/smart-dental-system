export type AppointmentInvoicePayment = {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
};

export type AppointmentInvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type AppointmentInvoice = {
  id: string;
  invoiceCode: string;
  invoiceType: string;
  status: string;
  paymentState: "unpaid" | "partial" | "paid" | "cancelled";
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  issuedAt?: string | null;
  items: AppointmentInvoiceItem[];
  payments: AppointmentInvoicePayment[];
};

export type AppointmentFinancialSource = {
  basePrice?: string | number | null;
  invoices?: RawAppointmentInvoice[] | null;
};

export type RawAppointmentInvoice = {
  id: string;
  invoiceCode?: string | null;
  invoiceType: string;
  status: string;
  subtotal?: string | number | null;
  discountAmount?: string | number | null;
  finalAmount: string | number;
  issuedAt?: string | null;
  items?: unknown;
  payments?: Array<{
    id: string;
    amount: string | number;
    status: string;
    paymentMethod?: string | null;
    paidAt?: string | null;
  }> | null;
};

function toAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function mapInvoiceItems(items: unknown): AppointmentInvoiceItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const value =
      item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const quantity = Math.max(1, toAmount(value.qty ?? value.quantity) || 1);
    const unitPrice = toAmount(value.unit_price ?? value.unitPrice);

    return {
      description: String(
        value.description ?? value.name ?? "Dịch vụ nha khoa",
      ),
      quantity,
      unitPrice,
      amount: toAmount(value.amount) || quantity * unitPrice,
    };
  });
}

export function mapAppointmentFinancials(source: AppointmentFinancialSource) {
  const treatmentPrice = toAmount(source.basePrice);
  const invoices = (source.invoices ?? []).map<AppointmentInvoice>(
    (invoice) => {
      const finalAmount = toAmount(invoice.finalAmount);
      const payments = (invoice.payments ?? []).map((payment) => ({
        id: payment.id,
        amount: toAmount(payment.amount),
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
      }));
      const successfulPaidAmount = payments
        .filter((payment) => payment.status.toUpperCase() === "SUCCESS")
        .reduce((total, payment) => total + payment.amount, 0);
      const status = invoice.status.toUpperCase();
      const paidAmount =
        status === "PAID" && successfulPaidAmount === 0
          ? finalAmount
          : Math.min(finalAmount, successfulPaidAmount);
      const remainingAmount = Math.max(0, finalAmount - paidAmount);
      const paymentState =
        status === "CANCELLED" || status === "REFUNDED"
          ? "cancelled"
          : status === "PAID" || remainingAmount === 0
            ? "paid"
            : status === "PARTIALLY_PAID" || paidAmount > 0
              ? "partial"
              : "unpaid";

      return {
        id: invoice.id,
        invoiceCode:
          invoice.invoiceCode || `HD-${invoice.id.slice(0, 8).toUpperCase()}`,
        invoiceType: invoice.invoiceType,
        status: invoice.status,
        paymentState,
        subtotal: toAmount(invoice.subtotal) || finalAmount,
        discountAmount: toAmount(invoice.discountAmount),
        finalAmount,
        paidAmount,
        remainingAmount,
        issuedAt: invoice.issuedAt,
        items: mapInvoiceItems(invoice.items),
        payments,
      };
    },
  );

  return { treatmentPrice, invoices };
}
