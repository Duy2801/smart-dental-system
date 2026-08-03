import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { ROUTES, buildRoute } from "../../common/routes";
import { T } from "../../common/typography";

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: string;
  tone: "blue" | "cyan" | "violet" | "indigo";
};

const tones = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
  violet: "bg-violet-50 text-violet-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className={T.sectionTitle}>Dịch vụ nhanh</h2>
          <p className={`mt-1.5 ${T.body}`}>Chọn dịch vụ bạn cần để bắt đầu.</p>
        </div>
        <Link href={ROUTES.service} className={T.link}>
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60"
          >
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[action.tone]}`}>
              <DashboardIcon name={action.icon} className="h-6 w-6" />
            </span>
            <h3 className={`mt-4 text-base font-bold text-slate-800 group-hover:text-[#0863c5]`}>
              {action.title}
            </h3>
            <p className={`mt-1.5 ${T.bodySm}`}>{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
