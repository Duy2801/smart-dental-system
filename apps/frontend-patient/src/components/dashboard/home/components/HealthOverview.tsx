import { DashboardIcon } from "../../common/DashboardIcon";

export type HealthMetric = {
  label: string;
  value: number;
  color: "blue" | "cyan" | "emerald";
};

const barColors = {
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
};

export function HealthOverview({ score, metrics }: { score: number; metrics: HealthMetric[] }) {
  return (
    <section className="flex h-full flex-col">
      <h2 className="mb-4 flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em] text-slate-900">
        <DashboardIcon name="heart" className="h-6 w-6 text-[#0863c5]" />
        Chỉ số sức khỏe
      </h2>
      <div className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div
            className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2.5"
            style={{ background: `conic-gradient(#0873dc ${score * 3.6}deg, #e8eef7 0deg)` }}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
              <div>
                <strong className="block text-2xl leading-none text-slate-900">{score}</strong>
                <span className="text-[10px] font-semibold text-slate-400">/ 100</span>
              </div>
            </div>
          </div>
          <div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Khá tốt
            </span>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sức khỏe răng miệng của bạn đang được duy trì ổn định.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
                <span>{metric.label}</span>
                <span>{metric.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barColors[metric.color]}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-800">
          <p className="flex items-center gap-1.5 font-bold">
            <DashboardIcon name="sparkles" className="h-3.5 w-3.5" /> Gợi ý từ AI
          </p>
          <p className="mt-1 text-blue-700">Duy trì vệ sinh kẽ răng mỗi tối để cải thiện chỉ số nướu.</p>
        </div>
      </div>
    </section>
  );
}
