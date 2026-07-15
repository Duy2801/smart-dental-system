import { cn } from "@/src/lib/utils/cn";
import { formatVND } from "../service-pricing-utils";
import type { DentalService } from "../types";
import {
  ClockIcon,
  EditIcon,
  EyeIcon,
  PauseIcon,
  TrashIcon,
} from "./service-pricing-icons";

type ServiceRowProps = {
  onEdit: (service: DentalService) => void;
  onRemove: (service: DentalService) => void;
  onToggleStatus: (service: DentalService) => void;
  service: DentalService;
};

export function ServiceRow({
  onEdit,
  onRemove,
  onToggleStatus,
  service,
}: ServiceRowProps) {
  return (
    <div className="group relative grid grid-cols-1 gap-4 p-5 transition-colors hover:bg-muted/20 lg:grid-cols-[minmax(0,1fr)_130px_130px_140px] lg:items-center">
      <div className="flex min-w-0 gap-4 pr-4">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-100">
          {service.thumbnailUrl ? (
            <img
              src={service.thumbnailUrl}
              alt={service.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs font-semibold text-muted-foreground">
              Chưa có ảnh
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-brand-dark">
              {service.name}
            </span>
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {service.shortDescription || service.description || "Chưa có mô tả"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{service.media.length} ảnh</span>
            <span>{service.procedureSteps.length} bước</span>
            <span>{service.faqs.length} FAQ</span>
            {service.slug ? <span>/{service.slug}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center text-sm text-muted-foreground">
        <ClockIcon />
        {service.durationMinutes} phút
      </div>

      <div className="shrink-0 font-mono text-sm font-medium text-brand-dark lg:text-right">
        {formatVND(service.basePrice)}
      </div>

      <div className="flex shrink-0 lg:justify-end">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            service.isActive
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-50 text-gray-500",
          )}
        >
          {service.isActive ? "Đang cung cấp" : "Ngừng cung cấp"}
        </span>
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title="Sửa dịch vụ"
          onClick={() => onEdit(service)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          title={service.isActive ? "Tạm ngưng" : "Bật lại"}
          onClick={() => onToggleStatus(service)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-orange-50 hover:text-orange-600"
        >
          {service.isActive ? <PauseIcon /> : <EyeIcon />}
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          title="Xóa dịch vụ"
          onClick={() => onRemove(service)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
