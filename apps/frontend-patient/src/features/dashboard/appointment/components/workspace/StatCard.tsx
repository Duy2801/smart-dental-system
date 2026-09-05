import {
  DashboardIcon,
  type DashboardIconName,
} from "../../../common/DashboardIcon";

type StatCardProps = {
  icon: DashboardIconName;
  value: string;
  label: string;
  detail: string;
  tone: string;
};

export function StatCard({
  icon,
  value,
  label,
  detail,
  tone,
}: StatCardProps) {
  return (
    <article className="group rounded-[20px] border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_36px_rgba(15,23,42,.06)]">
      <div className="flex items-start justify-between gap-4">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <DashboardIcon name={icon} className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          {detail}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <strong className="block text-3xl text-slate-900">{value}</strong>
          <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </article>
  );
}
