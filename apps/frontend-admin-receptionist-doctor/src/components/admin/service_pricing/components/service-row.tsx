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
    <div className="group relative flex items-center justify-between p-5 transition-colors hover:bg-muted/20">
      <div className="flex flex-col gap-1 pr-4 sm:w-1/3">
        <span className="font-medium text-brand-dark">{service.name}</span>
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {service.description}
        </span>
      </div>

      <div className="hidden w-32 shrink-0 items-center text-sm text-muted-foreground sm:flex">
        <ClockIcon />
        {service.durationMinutes} phút
      </div>

      <div className="w-28 shrink-0 text-right font-mono text-sm font-medium text-brand-dark">
        {formatVND(service.basePrice)}
      </div>

      <div className="hidden w-32 shrink-0 justify-end md:flex">
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

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
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
