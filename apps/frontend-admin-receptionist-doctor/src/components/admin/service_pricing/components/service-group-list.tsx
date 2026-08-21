import { Skeleton, SkeletonRows } from "@/src/components/admin/common";
import type { DentalService, TreatmentMethod } from "../types";
import { ServiceRow } from "./service-row";

type ServiceGroupListProps = {
  groupedServices: Record<string, DentalService[]>;
  loading: boolean;
  onEdit: (service: DentalService) => void;
  onRemove: (service: DentalService) => void;
  onToggleStatus: (service: DentalService) => void;
  onEditTreatmentMethod?: (
    service: DentalService,
    method: TreatmentMethod,
    index: number
  ) => void;
  onCreateTreatmentMethod?: (service: DentalService) => void;
  onToggleTreatmentMethodStatus?: (
    service: DentalService,
    index: number
  ) => void;
  onRemoveTreatmentMethod?: (
    service: DentalService,
    index: number
  ) => void;
};

export function ServiceGroupList({
  groupedServices,
  loading,
  onEdit,
  onRemove,
  onToggleStatus,
  onEditTreatmentMethod,
  onCreateTreatmentMethod,
  onToggleTreatmentMethodStatus,
  onRemoveTreatmentMethod,
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
        Không tìm thấy dịch vụ nào phù hợp.
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
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-brand-dark">{category}</h3>
              <span className="text-xs font-medium text-muted-foreground">
                {items.length} dịch vụ
              </span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {items.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onRemove={onRemove}
                onEditTreatmentMethod={onEditTreatmentMethod}
                onCreateTreatmentMethod={onCreateTreatmentMethod}
                onToggleTreatmentMethodStatus={onToggleTreatmentMethodStatus}
                onRemoveTreatmentMethod={onRemoveTreatmentMethod}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
