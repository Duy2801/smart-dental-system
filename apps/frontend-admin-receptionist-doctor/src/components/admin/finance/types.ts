export type InvoiceItem = {
  service_id: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
};

export type InvoiceStatus = "PAID" | "UNPAID" | "PARTIAL" | "CANCELLED";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "E_WALLET"
  | "ONLINE_GATEWAY"
  | "VIETQR"
  | "VNPAY"
  | "MOMO"
  | string;

export type InvoiceStatusFilter = InvoiceStatus | "ALL";

export type DateRangePreset = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

export type PaymentMethodFilter = "ALL" | "CASH" | "BANK_TRANSFER" | "CARD" | "VIETQR" | "VNPAY" | "MOMO";

export type Invoice = {
  id: string;
  invoice_code: string;
  patient_name: string;
  doctor_name?: string | null;
  issued_at: string;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  status: InvoiceStatus;
  payment_method?: PaymentMethod;
  payment_option?: string;
  items: InvoiceItem[];
};
