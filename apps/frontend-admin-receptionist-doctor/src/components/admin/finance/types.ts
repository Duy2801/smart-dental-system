export type InvoiceItem = {
  service_id: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
};

export type InvoiceStatus = "PAID" | "UNPAID" | "CANCELLED";
export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "E_WALLET"
  | "ONLINE_GATEWAY";
export type InvoiceStatusFilter = InvoiceStatus | "ALL";

export type Invoice = {
  id: string;
  invoice_code: string;
  patient_name: string;
  issued_at: string;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  status: InvoiceStatus;
  payment_method?: PaymentMethod;
  items: InvoiceItem[];
};
