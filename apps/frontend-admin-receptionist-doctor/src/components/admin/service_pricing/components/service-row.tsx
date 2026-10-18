"use client";

import { useState } from "react";
import {
  CaretDown,
  Clock,
  Eye,
  EyeSlash,
  Images,
  ListNumbers,
  PencilSimple,
  Plus,
  Question,
  Trash,
  Tooth,
} from "@phosphor-icons/react";
import {
  AdminIconButton,
  AdminIconButtonDivider,
  AdminIconButtonGroup,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatVND } from "../service-pricing-utils";
import type { DentalService, TreatmentMethod } from "../types";

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

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <span className="text-slate-400">{icon}</span>
      {children}
    </span>
  );
}

export function ServiceRow({
  onEdit,
  onRemove,
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

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
            {thumbnail ? (
              <img src={thumbnail} alt={service.name} className="h-full w-full object-cover" />
            ) : (
              <Tooth size={28} weight="duotone" className="text-slate-300" />
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold text-slate-900">{service.name}</span>
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand">
                {methods.length} phương pháp
              </span>
            </div>
            <p className="line-clamp-2 text-xs leading-5 text-slate-500">
              {service.shortDescription || service.description || "Chưa có mô tả"}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <MetaItem icon={<Images size={13} />}>{mediaCount} ảnh</MetaItem>
              <MetaItem icon={<ListNumbers size={13} />}>{stepCount} bước</MetaItem>
              <MetaItem icon={<Question size={13} />}>{faqCount} FAQ</MetaItem>
              {service.slug ? <span className="font-mono text-[11px] text-slate-400">/{service.slug}</span> : null}
            </div>
          </div>
        </div>


        <div className="flex items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors",
              isExpanded
                ? "border-brand/30 bg-brand-light text-brand"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            Phương pháp
            <CaretDown size={12} weight="bold" className={cn("transition-transform", isExpanded && "rotate-180")} />
          </button>
          <AdminIconButtonGroup>
            <AdminIconButton label="Sửa nhóm dịch vụ" onClick={() => onEdit(service)}>
              <PencilSimple size={16} />
            </AdminIconButton>
            <AdminIconButtonDivider />
            <AdminIconButton label="Xóa dịch vụ" tone="red" onClick={() => onRemove(service)}>
              <Trash size={16} />
            </AdminIconButton>
          </AdminIconButtonGroup>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-dashed border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Phương pháp điều trị ({methods.length})
              </h4>
              <p className="mt-0.5 text-xs text-slate-500">
                Bấm vào từng phương pháp để chỉnh sửa giá và thông tin riêng.
              </p>
            </div>

            {onCreateTreatmentMethod ? (
              <button
                type="button"
                onClick={() => onCreateTreatmentMethod(service)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-bold text-white shadow-sm shadow-brand/25 transition-colors hover:bg-[#0084e0]"
              >
                <Plus size={14} weight="bold" />
                Thêm phương pháp
              </button>
            ) : null}
          </div>

          {methods.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
              Chưa có phương pháp điều trị nào. Bấm &quot;Thêm phương pháp&quot; để bổ sung.
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((method, index) => {
                const mImage = method.imageUrl || method.media?.[0]?.url;
                const mStepCount = method.procedureSteps?.length ?? 0;
                const mFaqCount = method.faqs?.length ?? 0;
                const isActive = method.isActive !== false;

                return (
                  <div
                    key={method.id || index}
                    className="group/item flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-brand/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                      onClick={() => onEditTreatmentMethod?.(service, method, index)}
                    >
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                        {mImage ? (
                          <img src={mImage} alt={method.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">
                            {method.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 transition-colors group-hover/item:text-brand">
                            {method.name}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-semibold",
                              isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500",
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {isActive ? "Đang cung cấp" : "Ngừng cung cấp"}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {method.description || "Chưa có mô tả riêng"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <MetaItem icon={<Clock size={12} />}>{method.durationMinutes ?? duration} phút</MetaItem>
                          <MetaItem icon={<ListNumbers size={12} />}>{mStepCount} bước</MetaItem>
                          <MetaItem icon={<Question size={12} />}>{mFaqCount} FAQ</MetaItem>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
                      <span className="text-[15px] font-extrabold text-brand-dark">{formatVND(method.basePrice)}</span>

                      <AdminIconButtonGroup>
                        {onEditTreatmentMethod ? (
                          <AdminIconButton
                            label="Sửa phương pháp này"
                            onClick={() => onEditTreatmentMethod(service, method, index)}
                          >
                            <PencilSimple size={16} />
                          </AdminIconButton>
                        ) : null}
                        {onToggleTreatmentMethodStatus ? (
                          <AdminIconButton
                            label={isActive ? "Tạm ngưng phương pháp này" : "Bật lại phương pháp này"}
                            tone={isActive ? "amber" : "emerald"}
                            onClick={() => onToggleTreatmentMethodStatus(service, index)}
                          >
                            {isActive ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </AdminIconButton>
                        ) : null}
                        {onRemoveTreatmentMethod ? (
                          <>
                            <AdminIconButtonDivider />
                            <AdminIconButton
                              label="Xóa phương pháp này"
                              tone="red"
                              onClick={() => onRemoveTreatmentMethod(service, index)}
                            >
                              <Trash size={16} />
                            </AdminIconButton>
                          </>
                        ) : null}
                      </AdminIconButtonGroup>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
