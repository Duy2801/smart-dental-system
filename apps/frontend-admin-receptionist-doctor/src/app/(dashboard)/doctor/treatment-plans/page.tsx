import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { Plus, ArrowUpRight, ClipboardText } from "@phosphor-icons/react/dist/ssr";

type PlanStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const statusMap: Record<PlanStatus, { label: string; color: string }> = {
  PLANNED: {
    label: "Chưa bắt đầu",
    color: "bg-slate-100 text-slate-600 ring-slate-600/20",
  },
  IN_PROGRESS: {
    label: "Đang tiến hành",
    color: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "bg-green-50 text-green-700 ring-green-600/20",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

const MOCK_PLANS = [
  {
    id: "tp-001",
    title: "Niềng răng mắc cài kim loại",
    patient: "Đỗ Thu Hà",
    patientCode: "BN-2006",
    completedSteps: 6,
    totalSteps: 24,
    status: "IN_PROGRESS" as PlanStatus,
    startDate: "10/01/2026",
    expectedEndDate: "10/01/2028",
  },
  {
    id: "tp-002",
    title: "Cắm 2 trụ Implant R46, R47",
    patient: "Nguyễn Văn A",
    patientCode: "BN-2001",
    completedSteps: 2,
    totalSteps: 5,
    status: "IN_PROGRESS" as PlanStatus,
    startDate: "01/06/2026",
    expectedEndDate: "01/12/2026",
  },
  {
    id: "tp-003",
    title: "Chữa tủy và bọc sứ R38",
    patient: "Lê Minh Cường",
    patientCode: "BN-2005",
    completedSteps: 1,
    totalSteps: 3,
    status: "IN_PROGRESS" as PlanStatus,
    startDate: "15/07/2026",
    expectedEndDate: "15/08/2026",
  },
  {
    id: "tp-004",
    title: "Tẩy trắng răng Laser",
    patient: "Hoàng Thị Oanh",
    patientCode: "BN-2004",
    completedSteps: 1,
    totalSteps: 1,
    status: "COMPLETED" as PlanStatus,
    startDate: "10/07/2026",
    expectedEndDate: "10/07/2026",
  },
];

export default function TreatmentPlansPage() {
  return (
    <>
      <Header
        title="Kế hoạch điều trị"
        description="Theo dõi lộ trình và tiến độ điều trị của bệnh nhân"
      >
        <Link
          href="/doctor/treatment-plans/new"
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          Tạo kế hoạch mới
        </Link>
      </Header>

      <div className="p-6 md:p-8">
        {MOCK_PLANS.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
            <ClipboardText
              size={48}
              className="mb-4 text-slate-300"
              weight="duotone"
            />
            <p className="text-sm text-muted-foreground">
              Chưa có kế hoạch điều trị nào
            </p>
            <Link
              href="/doctor/treatment-plans/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Tạo kế hoạch mới
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_PLANS.map((plan) => {
              const pct = Math.round(
                (plan.completedSteps / plan.totalSteps) * 100,
              );
              const s = statusMap[plan.status];
              return (
                <div
                  key={plan.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {plan.id.toUpperCase()}
                      </span>
                      <h3 className="mt-1 text-base font-semibold text-slate-900 leading-tight">
                        {plan.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground">
                          {plan.patient}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {plan.patientCode}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                        s.color,
                      )}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tiến độ</span>
                        <span className="font-semibold text-brand-dark">
                          {plan.completedSteps}/{plan.totalSteps} bước ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            pct === 100 ? "bg-green-500" : "bg-brand",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
                      <span>
                        {plan.startDate} → {plan.expectedEndDate}
                      </span>
                      <Link
                        href={`/doctor/treatment-plans/${plan.id}`}
                        className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                      >
                        Chi tiết <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
