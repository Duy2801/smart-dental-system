import type { OverviewPopularService } from "../types";

type PopularServicesProps = {
  services: OverviewPopularService[];
};

export function PopularServices({ services }: PopularServicesProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">
        Top dich vu pho bien
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">Thang nay</p>
      <ul className="mt-4 space-y-3">
        {services.length === 0 ? (
          <li className="text-sm text-muted-foreground">Chua co du lieu.</li>
        ) : null}
        {services.map((service, index) => (
          <li key={service.name} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-dark">
                {service.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {service.count} luot - {service.percent}%
              </p>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(service.percent, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
