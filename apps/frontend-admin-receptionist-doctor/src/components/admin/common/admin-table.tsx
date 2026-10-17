import { cn } from "@/src/lib/utils/cn";

type AdminTableProps = {
  children: React.ReactNode;
};

export function AdminTable({ children }: AdminTableProps) {
  return (
    <div className="custom-scrollbar overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-t border-slate-100 px-4 py-3 text-slate-700", className)}>
      {children}
    </td>
  );
}
