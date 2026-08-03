import { DashboardIcon } from "../../../common/DashboardIcon";

export function AppointmentsEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center sm:px-10">
      <DashboardIcon
        name="calendar"
        className="mx-auto h-10 w-10 text-slate-300"
      />
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
