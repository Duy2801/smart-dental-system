import type { TreatmentStep } from "../types";

const statusStyles = {
  completed: "border-[#0863c5] bg-[#0863c5]",
  current: "border-cyan-400 bg-cyan-400 ring-4 ring-cyan-100",
  upcoming: "border-slate-200 bg-white",
};

export function TreatmentTimeline({ title, progress, steps }: { title: string; progress: number; steps: TreatmentStep[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-900">Tiến độ điều trị</h2>
          <p className="mt-1 text-xs text-slate-500">Dịch vụ: {title}</p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-bold text-cyan-600">
          Đang thực hiện · {progress}%
        </span>
      </div>

      <div className="relative mt-6 space-y-1 pl-1">
        <div className="absolute bottom-5 left-[9px] top-3 w-px bg-slate-200" />
        {steps.map((step) => (
          <article key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
            <span className={`relative z-10 mt-1.5 h-[18px] w-[18px] shrink-0 rounded-full border-[4px] ${statusStyles[step.status]}`} />
            <div
              className={`flex-1 rounded-xl px-3 py-2.5 ${
                step.status === "current" ? "border border-blue-100 bg-blue-50/80" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-bold ${step.status === "upcoming" ? "text-slate-400" : "text-slate-800"}`}>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                </div>
                <div className="text-right">
                  {step.badge && (
                    <span className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-[#0863c5] shadow-sm">
                      {step.badge}
                    </span>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">{step.date}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
