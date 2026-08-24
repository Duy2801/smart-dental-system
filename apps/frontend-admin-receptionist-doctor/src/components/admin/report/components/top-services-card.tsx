import { formatVndCompact } from "../report-utils";
import type { TopService } from "../types";

type TopServicesCardProps = {
  onViewAll: () => void;
  services: TopService[];
};

export function TopServicesCard({ onViewAll, services }: TopServicesCardProps) {
  const previewServices = services.slice(0, 5);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-brand-dark">
        Top dịch vụ phổ biến
      </h3>
      <div className="flex flex-1 flex-col gap-4">
        {previewServices.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
            Chưa có dữ liệu dịch vụ.
          </div>
        ) : null}
        {previewServices.map((service, index) => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden pr-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>
              <span
                className="truncate text-sm font-medium text-brand-dark"
                title={service.name}
              >
                {service.name}
              </span>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-brand-dark">
              {formatVndCompact(service.revenue)}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        disabled={services.length === 0}
        className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Xem tất cả
      </button>
    </div>
  );
}
