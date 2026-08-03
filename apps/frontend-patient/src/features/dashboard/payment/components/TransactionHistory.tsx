import { DashboardIcon } from "../../common/DashboardIcon";
import type { PaymentStatusFilter, Transaction, TransactionStatus } from "../types";
import { T } from "../../common/typography";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const statusMeta: Record<TransactionStatus, { label: string; className: string }> = {
  paid: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Chưa thanh toán", className: "bg-amber-50 text-amber-700" },
  failed: { label: "Thất bại", className: "bg-rose-50 text-rose-600" },
};

type TransactionHistoryProps = {
  transactions: Transaction[];
  filter: PaymentStatusFilter;
  onFilterChange: (value: PaymentStatusFilter) => void;
  onDownload: (transaction: Transaction) => void;
};

export function TransactionHistory({
  transactions,
  filter,
  onFilterChange,
  onDownload,
}: TransactionHistoryProps) {
  return (
    <section aria-labelledby="transaction-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="transaction-title" className={T.sectionTitle}>
          Lịch sử giao dịch
        </h2>
        <select
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as PaymentStatusFilter)}
          aria-label="Lọc trạng thái giao dịch"
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-[#0863c5]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="pending">Chưa thanh toán</option>
          <option value="failed">Thất bại</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.08em] text-slate-400">
              <tr>
                <th className="px-5 py-4 font-bold">Dịch vụ / Mã HĐ</th>
                <th className="px-5 py-4 font-bold">Ngày giao dịch</th>
                <th className="px-5 py-4 font-bold">Số tiền</th>
                <th className="px-5 py-4 font-bold">Trạng thái</th>
                <th className="px-5 py-4 text-center font-bold">Tải về</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const status = statusMeta[transaction.status];
                return (
                  <tr key={transaction.id} className="text-xs text-slate-600 transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <strong className="block text-slate-800">{transaction.service}</strong>
                      <span className="mt-0.5 block text-[9px] font-semibold uppercase text-slate-400">{transaction.invoiceCode}</span>
                    </td>
                    <td className="px-5 py-4">{transaction.date}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{currency.format(transaction.amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDownload(transaction)}
                        aria-label={`Tải hóa đơn ${transaction.invoiceCode}`}
                        className="inline-grid h-8 w-8 place-items-center rounded-lg text-[#0863c5] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                        disabled={transaction.status !== "paid"}
                      >
                        <DashboardIcon name="document" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Không có giao dịch phù hợp.</p>
        )}
      </div>
    </section>
  );
}
