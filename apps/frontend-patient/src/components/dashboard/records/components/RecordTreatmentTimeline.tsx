import type { TimelineStepView } from "./recordMappers";

type RecordTreatmentTimelineProps = {
  steps: TimelineStepView[];
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
};

export function RecordTreatmentTimeline({
  steps,
  selectedStepId,
  onSelectStep,
}: RecordTreatmentTimelineProps) {
  const treatmentSteps = steps.filter((step) => step.status !== "summary");
  const reachedSteps = treatmentSteps.filter(
    (step) => step.status !== "upcoming",
  ).length;

  return (
    <section className="mt-5 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc]">
            Lộ trình của bạn
          </p>
          <h4 className="mt-1 text-sm font-bold text-slate-900">
            Kế hoạch điều trị
          </h4>
        </div>
        <p className="text-[10px] font-semibold text-slate-500">
          {reachedSteps}/{treatmentSteps.length} bước đã đạt tới
        </p>
      </div>

      <div className="mt-5 grid gap-0 sm:grid-cols-4">
        {steps.map((step, stepIndex) => {
          const reached = step.status !== "upcoming";
          const completed = step.status === "completed";
          const selected = step.id === selectedStepId;

          return (
            <button
              type="button"
              key={`${step.title}-${stepIndex}`}
              onClick={() => onSelectStep(step.id)}
              className="group relative flex gap-3 pb-5 text-left sm:block sm:pb-0"
            >
              {stepIndex !== steps.length - 1 && (
                <span
                  className={`absolute left-4 top-8 h-[calc(100%-1rem)] w-0.5 sm:left-8 sm:top-4 sm:h-0.5 sm:w-[calc(100%-2rem)] ${
                    completed ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
              <span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-[10px] font-extrabold sm:ml-4 ${
                  selected
                    ? "border-[#0058bc] bg-[#0058bc] text-white shadow-[0_0_0_7px_rgba(0,88,188,.12)]"
                    : reached
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_7px_rgba(16,185,129,.12)]"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {step.status === "summary" ? "K" : completed ? "✓" : stepIndex + 1}
              </span>
              <div
                className={`min-w-0 rounded-xl px-3 py-2 sm:mt-3 sm:pr-4 ${
                  selected ? "bg-blue-50/70" : "bg-transparent"
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-[.14em] ${
                    step.status === "summary"
                      ? "text-[#0058bc]"
                      : reached
                        ? "text-emerald-700"
                        : "text-slate-400"
                  }`}
                >
                  {step.date}
                </p>
                <h5 className="mt-1 text-sm font-bold text-slate-900">
                  {step.title}
                </h5>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {step.description}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    completed
                      ? "bg-emerald-100 text-emerald-700"
                      : step.status === "current"
                        ? "bg-emerald-500 text-white"
                        : step.status === "summary"
                          ? "bg-blue-100 text-[#0058bc]"
                          : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {completed
                    ? "Đã hoàn thành"
                    : step.status === "current"
                      ? "Bước hiện tại"
                      : step.status === "summary"
                        ? "Tổng quan"
                        : "Sắp tới"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
