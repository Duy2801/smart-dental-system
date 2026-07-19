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
    <article className="group relative overflow-hidden rounded-[22px] border border-white bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,.12)]">
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 ${tone.split(" ")[0]}`}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}
        >
          <DashboardIcon name={icon} className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          {detail}
        </span>
      </div>
      <div className="relative mt-5 flex items-end justify-between">
        <div>
          <strong className="block text-3xl text-slate-900">{value}</strong>
          <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
        </div>
        <span className="text-lg text-slate-200 transition group-hover:translate-x-1 group-hover:text-blue-400">
          {"->"}
        </span>
      </div>
    </article>
  );
}
