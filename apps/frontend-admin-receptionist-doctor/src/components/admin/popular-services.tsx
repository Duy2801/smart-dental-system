import { popularServices } from "@/src/components/admin/mock-data";

export function PopularServices() {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">Top dịch vụ phổ biến</h3>
      <p className="mt-1 text-sm text-muted-foreground">Tháng này</p>
      <ul className="mt-4 space-y-3">
        {popularServices.map((service, i) => (
          <li key={service.name} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-dark">{service.name}</p>
              <p className="text-xs text-muted-foreground">{service.count} lượt · {service.percent}%</p>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${service.percent * 3}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
