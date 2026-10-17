"use client";

import { FolderSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { AdminEmptyState, Skeleton, SkeletonRows } from "@/src/components/admin/common";
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <Skeleton className="h-4 w-40" />
        </div>
        <SkeletonRows count={5} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
        <AdminEmptyState
          icon={<MagnifyingGlass size={24} weight="duotone" />}
          title="Không tìm thấy dịch vụ nào phù hợp"
          description="Thử từ khóa khác hoặc thêm dịch vụ mới."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([category, items]) => (
        <div
          key={category}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
            <h3 className="flex items-center gap-2.5 text-[15px] font-bold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-light text-brand">
                <FolderSimple size={16} weight="duotone" />
              </span>
              {category}
            </h3>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {items.length} dịch vụ
            </span>
          </div>

          <div className="divide-y divide-slate-100">
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
