import type { PaymentMethod } from "../types";
import { T } from "../../common/typography";

const methodStyles = {
  visa: "bg-blue-50 text-blue-700",
  momo: "bg-pink-600 text-white",
  zalopay: "bg-blue-600 text-white",
};

type PaymentMethodsProps = {
  methods: PaymentMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddMethod: () => void;
};

export function PaymentMethods({ methods, selectedId, onSelect, onAddMethod }: PaymentMethodsProps) {
  return (
    <section aria-labelledby="payment-method-title">
      <h2 id="payment-method-title" className={T.sectionTitle}>
        Phương thức thanh toán
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => {
          const selected = method.id === selectedId;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              aria-pressed={selected}
              className={`flex min-h-20 items-center gap-3 rounded-xl border bg-white p-3 text-left transition ${
                selected ? "border-[#0863c5] ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold ${methodStyles[method.type]}`}>
                {method.type === "visa" ? "VISA" : method.type === "momo" ? "MoMo" : "Zalo"}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-slate-800">{method.name}</strong>
                <span className="mt-1 block text-[10px] text-slate-500">{method.detail}</span>
                <span className="block text-[9px] text-slate-400">{method.note}</span>
              </span>
              <span className={`text-lg ${selected ? "text-[#0863c5]" : "text-slate-300"}`} aria-hidden="true">
                {selected ? "●" : "○"}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAddMethod}
          className="flex min-h-20 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0863c5]"
        >
          <span className="text-lg" aria-hidden="true">⊕</span>
          Thêm phương thức
        </button>
      </div>
    </section>
  );
}
