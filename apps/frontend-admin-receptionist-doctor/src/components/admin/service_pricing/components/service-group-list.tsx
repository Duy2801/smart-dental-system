import { Skeleton, SkeletonRows } from "@/src/components/admin/common";
import type { DentalService } from "../types";
import { ServiceRow } from "./service-row";

type ServiceGroupListProps = {
  groupedServices: Record<string, DentalService[]>;
  loading: boolean;
  onEdit: (service: DentalService) => void;
  onRemove: (service: DentalService) => void;
  onToggleStatus: (service: DentalService) => void;
};

export function ServiceGroupList({
  groupedServices,
  loading,
  onEdit,
  onRemove,
  onToggleStatus,
}: ServiceGroupListProps) {
  const entries = Object.entries(groupedServices);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border bg-muted/50 px-5 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <SkeletonRows count={5} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border border-dashed p-8 text-center text-sm text-muted-foreground">
        Khong tim thay dich vu nao phu hop.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([category, items]) => (
        <div
          key={category}
          className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
        >
          <div className="border-b border-border bg-muted/50 px-5 py-3">
            <h3 className="font-semibold text-brand-dark">{category}</h3>
          </div>

          <div className="divide-y divide-border">
            {items.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
