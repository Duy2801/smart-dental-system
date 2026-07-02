type PaymentSummaryProps = {
  service: string;
  invoiceCode: string;
  subtotal: number;
  discount: number;
  total: number;
  points: number;
  promoCode: string;
  promoMessage: string | null;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function PaymentSummary({
  service,
  invoiceCode,
  subtotal,
  discount,
  total,
  points,
  promoCode,
  promoMessage,
  onPromoCodeChange,
  onApplyPromo,
}: PaymentSummaryProps) {
  const promoApplied = discount > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Chi tiết dịch vụ</p>

        <div className="mt-4 flex items-start justify-between gap-5">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{service}</h2>
            <p className="mt-1 text-[10px] font-semibold uppercase text-slate-400">Mã HĐ: {invoiceCode}</p>
          </div>
          <strong className="shrink-0 text-sm text-slate-700">{currency.format(subtotal)}</strong>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">Tạm tính</span>
          <strong className="text-slate-800">{currency.format(subtotal)}</strong>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400" htmlFor="promo-code">
            Mã giảm giá
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="promo-code"
              value={promoCode}
              onChange={(event) => onPromoCodeChange(event.target.value.toUpperCase())}
              placeholder="Nhập mã giảm giá"
              className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none transition focus:border-[#0863c5] focus:ring-3 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={onApplyPromo}
              className="h-12 rounded-lg bg-slate-100 px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Áp dụng
            </button>
          </div>
          <div className="mt-2 flex min-h-4 items-center justify-between gap-4 text-[10px] font-semibold">
            <p className={promoApplied ? "text-emerald-600" : "text-rose-500"}>{promoMessage}</p>
            {promoApplied && <strong className="shrink-0 text-xs text-emerald-600">-{currency.format(discount)}</strong>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-blue-200 px-3 py-3 text-xs">
          <p className="font-semibold text-slate-600">
            <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full bg-[#0863c5] text-[10px] text-white">★</span>
            Điểm tích lũy: <strong className="text-[#0863c5]">{points.toLocaleString("vi-VN")}</strong>
          </p>
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#0863c5] underline underline-offset-2">
            Đổi ưu đãi (250k)
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-5 border-t border-blue-100 bg-blue-50/70 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Tổng cộng thanh toán</p>
          <p className="mt-1 text-[9px] text-slate-400 line-through">{currency.format(subtotal)}</p>
        </div>
        <strong className="text-2xl font-extrabold text-[#0863c5] sm:text-3xl">{currency.format(total)}</strong>
      </div>
    </section>
  );
}
