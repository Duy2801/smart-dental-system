import { DashboardIcon } from "../../../common/DashboardIcon";

export function AppointmentsEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-12 text-center">
      <DashboardIcon
        name="calendar"
        className="mx-auto h-10 w-10 text-slate-300"
      />
      <p className="mt-3 text-sm text-slate-400">{text}</p>
    </div>
  );
}
