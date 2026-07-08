import type { Prescription } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";

export function PrescriptionCard({ prescriptions }: { prescriptions: Prescription[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.02em] text-slate-900">
        <DashboardIcon name="document" className="h-5 w-5 text-[#0863c5]" />
        Toa thuốc & Ghi chú
      </h2>
      <div className="mt-4 space-y-3">
        {prescriptions.map((item) => (
          <article key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-700">{item.name}</h3>
              <span className="rounded bg-white px-2 py-1 text-[9px] font-semibold text-slate-500">
                {item.dosage}
              </span>
            </div>
            <p className="mt-2 text-[10px] italic leading-4 text-slate-500">“{item.instruction}”</p>
          </article>
        ))}
      </div>
      <button type="button" className="mt-4 h-10 w-full rounded-xl border border-blue-100 text-xs font-bold text-[#0863c5] hover:bg-blue-50">
        Xem lịch sử toa thuốc
      </button>
    </section>
  );
}
