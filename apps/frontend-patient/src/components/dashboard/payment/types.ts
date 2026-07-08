export type PaymentMethod = {
  id: string;
  type: "visa" | "momo" | "zalopay";
  name: string;
  detail: string;
  note: string;
};

export type TransactionStatus = "paid" | "pending" | "failed";

export type Transaction = {
  id: string;
  service: string;
  invoiceCode: string;
  date: string;
  amount: number;
  status: TransactionStatus;
};

export type PaymentStatusFilter = "all" | TransactionStatus;
