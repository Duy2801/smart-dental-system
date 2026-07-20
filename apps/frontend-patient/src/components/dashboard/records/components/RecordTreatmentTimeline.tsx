import type { TimelineStepView } from "./recordMappers";

type RecordTreatmentTimelineProps = {
  steps: TimelineStepView[];
};

export function RecordTreatmentTimeline({
  steps,
}: RecordTreatmentTimelineProps) {
  const reachedSteps = steps.filter((step) => step.status !== "upcoming").length;

  return (
    <section className="mt-5 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#0058bc]">
            Lộ trình của bạn
          </p>
          <h4 className="mt-1 text-sm font-bold text-slate-900">
            Kế hoạch điều trị
          </h4>
        </div>
        <p className="text-[9px] font-semibold text-slate-500">
          {reachedSteps}/{steps.length} bước đã đạt tới
        </p>
      </div>
      <div className="mt-4 grid gap-0 sm:grid-cols-4">
        {steps.map((step, stepIndex) => {
          const reached = step.status !== "upcoming";
          const completed = step.status === "completed";

          return (
            <article
              key={`${step.title}-${stepIndex}`}
              className="relative flex gap-3 pb-4 sm:block sm:pb-0"
            >
              {stepIndex !== steps.length - 1 && (
                <span
                  className={`absolute left-3 top-6 h-[calc(100%-1rem)] w-0.5 sm:left-6 sm:top-3 sm:h-0.5 sm:w-[calc(100%-1.5rem)] ${completed ? "bg-emerald-500" : "bg-slate-200"}`}
                />
              )}
              <span
                className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[9px] font-extrabold sm:ml-3 ${reached ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,.12)]" : "border-slate-200 bg-white text-slate-400"}`}
              >
                {completed ? "✓" : stepIndex + 1}
              </span>
              <div className="min-w-0 sm:mt-3 sm:pr-3">
                <p
                  className={`text-[8px] font-bold uppercase ${reached ? "text-emerald-700" : "text-slate-400"}`}
                >
                  {step.date}
                </p>
                <h5 className="mt-1 text-[10px] font-bold text-slate-800">
                  {step.title}
                </h5>
                <p className="mt-1 text-[9px] leading-4 text-slate-500">
                  {step.description}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-1 text-[7px] font-bold ${completed ? "bg-emerald-100 text-emerald-700" : step.status === "current" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {completed
                    ? "Đã hoàn thành"
                    : step.status === "current"
                      ? "Bước hiện tại"
                      : "Sắp tới"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
