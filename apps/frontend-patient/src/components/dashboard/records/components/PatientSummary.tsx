import type { OralMetric } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";

const progressColors = {
  blue: "bg-blue-600",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
};

export function PatientSummary({ score, metrics }: { score: number; metrics: OralMetric[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid items-center gap-6 md:grid-cols-[150px_1fr]">
        <div className="mx-auto text-center">
          <div
            className="grid h-32 w-32 place-items-center rounded-full p-2.5"
            style={{ background: `conic-gradient(#0863c5 ${score * 3.6}deg, #e8eef7 0deg)` }}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-white">
              <div>
                <strong className="block text-4xl font-bold leading-none text-slate-800">{score}</strong>
                <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Oral score
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-600">Tình trạng tốt</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-xl border border-slate-100 bg-[#f8faff] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {metric.label}
                </span>
                <DashboardIcon name="shield" className="h-4 w-4 text-[#0863c5]" />
              </div>
              <strong className="mt-3 block text-lg text-slate-800">{metric.value}</strong>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${progressColors[metric.tone]}`}
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
