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
  return (
    <div className="space-y-2">
      {steps.map((step, stepIndex) => {
        const completed = step.status === "completed";
        const selected = step.id === selectedStepId;
        const active = step.status === "current";
        const upcoming = step.status === "upcoming";

        return (
          <button
            type="button"
            key={`${step.title}-${stepIndex}`}
            onClick={() => onSelectStep(step.id)}
            className={`flex w-full items-start gap-3 border px-3 py-3 text-left transition ${
              selected
                ? "border-[#0058bc] bg-blue-50/60"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center border text-[10px] font-bold ${
                selected
                  ? "border-[#0058bc] bg-[#0058bc] text-white"
                  : completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : active
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-200 bg-white text-slate-400"
              }`}
            >
                  {step.status === "summary" ? "T" : completed ? "✓" : stepIndex + 1}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {step.date}
                </p>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold ${
                    completed
                      ? "bg-emerald-100 text-emerald-700"
                      : active
                        ? "bg-blue-100 text-[#0058bc]"
                        : step.status === "summary"
                          ? "bg-slate-100 text-slate-600"
                          : upcoming
                            ? "bg-slate-100 text-slate-500"
                            : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.status === "summary"
                      ? "Tổng kết"
                      : completed
                        ? "Hoàn thành"
                        : active
                          ? "Đang làm"
                          : "Sắp tới"}
                </span>
              </div>
              <h5 className="mt-1 text-sm font-semibold text-slate-950">{step.title}</h5>
              <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
