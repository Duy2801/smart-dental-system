import type { ReactNode } from "react";
import {
  DashboardIcon,
  type DashboardIconName,
} from "../../common/DashboardIcon";

type RecordInfoChipProps = {
  icon: DashboardIconName;
  children: ReactNode;
};

export function RecordInfoChip({ icon, children }: RecordInfoChipProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
      <DashboardIcon name={icon} className="h-4 w-4 text-[#0058bc]" />
      {children}
    </span>
  );
}
