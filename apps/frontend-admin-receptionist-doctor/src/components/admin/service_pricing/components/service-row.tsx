import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { formatVND } from "../service-pricing-utils";
import type { DentalService, TreatmentMethod } from "../types";
import {
  ClockIcon,
  EditIcon,
  EyeIcon,
  PauseIcon,
  TrashIcon,
  PlusIcon,
} from "./service-pricing-icons";

type ServiceRowProps = {
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
  service: DentalService;
};

export function ServiceRow({
  onEdit,
  onRemove,
  onToggleStatus,
  onEditTreatmentMethod,
  onCreateTreatmentMethod,
  onToggleTreatmentMethodStatus,
  onRemoveTreatmentMethod,
  service,
}: ServiceRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const methods: TreatmentMethod[] = service.treatmentMethods ?? [];
  const primaryMethod = methods[0];
  const thumbnail = service.thumbnailUrl || primaryMethod?.imageUrl;
  const mediaCount = service.media?.length ?? primaryMethod?.media?.length ?? 0;
  const stepCount =
    service.procedureSteps?.length ?? primaryMethod?.procedureSteps?.length ?? 0;
  const faqCount = service.faqs?.length ?? primaryMethod?.faqs?.length ?? 0;
  const duration = service.durationMinutes ?? primaryMethod?.durationMinutes ?? 30;

  // Compute price range across treatment methods
  let priceDisplay = formatVND(service.basePrice ?? primaryMethod?.basePrice ?? 0);
  if (methods.length > 0) {
    const prices = methods.map((m) => Number(m.basePrice ?? 0));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      priceDisplay = formatVND(minPrice);
    } else {
      priceDisplay = `Từ ${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
    }
  }

  return (
    <div className="group/row transition-colors">
      <div className="group relative grid grid-cols-1 gap-4 p-5 transition-colors hover:bg-muted/20 lg:grid-cols-[minmax(0,1fr)_140px_180px_140px] lg:items-center">
        <div className="flex min-w-0 gap-4 pr-4">
          <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-100">
            {thumbnail ? (
              <img
                src={thumbnail}
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
              <span className="font-bold text-slate-900 text-base">
                {service.name}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                {methods.length} phương pháp
              </span>
            </div>
            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
              {service.shortDescription || service.description || "Chưa có mô tả"}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{mediaCount} ảnh</span>
              <span>{stepCount} bước</span>
              <span>{faqCount} FAQ</span>
              {service.slug ? <span>/{service.slug}</span> : null}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 font-bold text-brand transition-colors hover:text-brand-dark hover:underline"
              >
                {isExpanded ? "▲ Thu gọn" : "▼ Xem phương pháp điều trị"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center text-sm text-muted-foreground">
          <ClockIcon />
          {duration} phút
        </div>

        <div className="shrink-0 font-mono text-sm font-semibold text-brand-dark lg:text-right">
          {priceDisplay}
        </div>

        <div className="flex shrink-0 lg:justify-end">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              service.isActive
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            )}
          >
            {service.isActive ? "Đang cung cấp" : "Ngừng cung cấp"}
          </span>
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Sửa nhóm dịch vụ"
            onClick={() => onEdit(service)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            title={service.isActive ? "Tạm ngưng dịch vụ" : "Bật lại dịch vụ"}
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

      {/* Expanded Accordion of Treatment Methods */}
      {isExpanded && (
        <div className="border-t border-dashed border-border/80 bg-slate-50/90 px-6 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Các phương pháp điều trị thuộc dịch vụ này ({methods.length})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Bấm trực tiếp vào từng phương pháp bên dưới để chỉnh sửa giá và thông tin riêng.
              </p>
            </div>

            {onCreateTreatmentMethod && (
              <button
                type="button"
                onClick={() => onCreateTreatmentMethod(service)}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-dark"
              >
                <PlusIcon />
                Thêm phương pháp mới
              </button>
            )}
          </div>

          {methods.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
              Chưa có phương pháp điều trị nào. Hãy ấn nút "Thêm phương pháp mới" ở trên để bổ sung!
            </div>
          ) : (
            <div className="space-y-2.5">
              {methods.map((method, index) => {
                const mImage = method.imageUrl || method.media?.[0]?.url;
                const mStepCount = method.procedureSteps?.length ?? 0;
                const mFaqCount = method.faqs?.length ?? 0;

                return (
                  <div
                    key={method.id || index}
                    className="group/item flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-brand/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5"
                      onClick={() =>
                        onEditTreatmentMethod?.(service, method, index)
                      }
                    >
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                        {mImage ? (
                          <img
                            src={mImage}
                            alt={method.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            {method.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm group-hover/item:text-brand transition-colors">
                            {method.name}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.25 text-[10px] font-semibold border",
                              method.isActive !== false
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            {method.isActive !== false ? "Đang cung cấp" : "Ngừng cung cấp"}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs text-slate-500 mt-1">
                          {method.description || "Chưa có mô tả riêng"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>{method.durationMinutes ?? duration} phút</span>
                          <span>•</span>
                          <span>{mStepCount} bước</span>
                          <span>•</span>
                          <span>{mFaqCount} FAQ</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2.5 sm:border-t-0 sm:pt-0 sm:justify-end">
                      <div className="font-mono text-base font-bold text-brand-dark">
                        {formatVND(method.basePrice)}
                      </div>

                      <div className="flex items-center gap-1">
                        {onEditTreatmentMethod && (
                          <button
                            type="button"
                            title="Sửa phương pháp này"
                            onClick={() =>
                              onEditTreatmentMethod(service, method, index)
                            }
                            className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            Sửa
                          </button>
                        )}
                        {onToggleTreatmentMethodStatus && (
                          <button
                            type="button"
                            title={
                              method.isActive !== false
                                ? "Tạm ngưng phương pháp này"
                                : "Bật lại phương pháp này"
                            }
                            onClick={() =>
                              onToggleTreatmentMethodStatus(service, index)
                            }
                            className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                          >
                            {method.isActive !== false ? "Ẩn" : "Hiện"}
                          </button>
                        )}
                        {onRemoveTreatmentMethod && (
                          <button
                            type="button"
                            title="Xóa phương pháp này"
                            onClick={() =>
                              onRemoveTreatmentMethod(service, index)
                            }
                            className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
