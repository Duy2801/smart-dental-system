type AdminTableProps = {
  children: React.ReactNode;
};

export function AdminTable({ children }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className ?? ""}`}>
      {children}
    </th>
  );
}

export function AdminTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`border-t border-border px-4 py-3 text-brand-dark ${className ?? ""}`}>
      {children}
    </td>
  );
}
