import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Globe,
  Megaphone,
  Pause,
  PencilSimple,
  Play,
  SpinnerGap,
  Tag,
  Target,
  Ticket,
} from "@phosphor-icons/react";
import {
  AdminIconButton,
  AdminIconButtonGroup,
  SkeletonRows,
} from "@/src/components/admin/common";
import { getServices } from "@/src/components/admin/service_pricing/service-pricing-api";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatPromotionValue,
  formatVND,
  getPromotionStatus,
  getPromotionUsageProgress,
} from "../promotion-utils";
import type { Promotion } from "../types";

/** Dùng chung cho tiêu đề và từng dòng để các cột luôn thẳng hàng */
const ROW_GRID =
  "lg:grid lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:items-center lg:gap-5";

type PromotionListProps = {
  loading?: boolean;
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onToggleStatus: (id: string) => void;
  onBroadcast: (promotion: Promotion) => void;
  broadcastingId?: string | null;
};

export function PromotionList({
  loading = false,
  promotions,
  onEdit,
  onToggleStatus,
  onBroadcast,
  broadcastingId,
}: PromotionListProps) {
  // Đổi slug nhóm dịch vụ thành tên dễ đọc (dùng chung cache với form khuyến mãi)
  const { data: services = [] } = useQuery({
    queryKey: ["admin", "services", "all"],
    queryFn: () => getServices({}),
  });
  const serviceNameBySlug = useMemo(
    () => new Map(services.filter((s) => s.slug).map((s) => [s.slug as string, s.name])),
    [services],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div
        className={cn(
          "hidden border-b border-border bg-slate-50/80 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500",
          ROW_GRID,
        )}
      >
        <div>Chương trình</div>
        <div>Mã & phạm vi</div>
        <div>Mức giảm</div>
        <div>Lượt dùng</div>
        <div>Thời hạn</div>
        <div>Trạng thái</div>
        <div className="w-[112px] text-right">Thao tác</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={5} />
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Ticket size={28} weight="duotone" />
            </span>
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy chương trình khuyến mãi nào
            </p>
            <p className="text-xs text-slate-500">
              Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
            </p>
          </div>
        ) : (
          promotions.map((promotion) => (
            <PromotionRow
              key={promotion.id}
              promotion={promotion}
              serviceName={
                promotion.applicable_service_slug
                  ? serviceNameBySlug.get(promotion.applicable_service_slug)
                  : undefined
              }
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onBroadcast={onBroadcast}
              isBroadcasting={broadcastingId === promotion.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PromotionRow({
  promotion,
  serviceName,
  onEdit,
  onToggleStatus,
  onBroadcast,
  isBroadcasting,
}: {
  promotion: Promotion;
  serviceName?: string;
  onEdit: (promotion: Promotion) => void;
  onToggleStatus: (id: string) => void;
  onBroadcast: (promotion: Promotion) => void;
  isBroadcasting?: boolean;
}) {
  const status = getPromotionStatus(promotion);
  const progress = getPromotionUsageProgress(promotion);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promotion.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scope = promotion.applicable_treatment_method
    ? {
        icon: Target,
        label: promotion.applicable_treatment_method.name,
        className: "bg-violet-50 text-violet-700 ring-violet-200",
      }
    : promotion.applicable_service_slug
      ? {
          icon: Tag,
          label: serviceName ?? promotion.applicable_service_slug,
          className: "bg-sky-50 text-sky-700 ring-sky-200",
        }
      : {
          icon: Globe,
          label: "Toàn hệ thống",
          className: "bg-slate-100 text-slate-600 ring-slate-200",
        };
  const ScopeIcon = scope.icon;

  const bannerSrc =
    promotion.image_url || promotion.applicable_treatment_method?.imageUrl || null;
  const minOrder = Number(promotion.min_order_amount) || 0;

  return (
    <div
      className={cn(
        "group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6",
        ROW_GRID,
      )}
    >
      {/* Chương trình: ảnh + tên (1 dòng) + mô tả (tối đa 2 dòng) */}
      <div className="flex min-w-0 items-center gap-3.5">
        {bannerSrc ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <img src={bannerSrc} alt={promotion.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-light to-blue-100 text-brand ring-1 ring-brand/15">
            <Ticket size={24} weight="duotone" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900" title={promotion.name}>
            {promotion.name}
          </p>
          <p
            className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500"
            title={promotion.description || undefined}
          >
            {promotion.description || "Chưa có mô tả"}
          </p>
        </div>
      </div>

      {/* Mã & phạm vi */}
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={handleCopyCode}
          title="Bấm để sao chép mã"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 font-mono text-xs font-bold tracking-wider transition-colors",
            copied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-white text-slate-800 hover:border-brand hover:text-brand",
          )}
        >
          {promotion.code}
          {copied ? <Check size={12} weight="bold" /> : <Copy size={12} />}
        </button>
        <span
          title={scope.label}
          className={cn(
            "inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
            scope.className,
          )}
        >
          <ScopeIcon size={12} weight="bold" className="shrink-0" />
          <span className="truncate">{scope.label}</span>
        </span>
      </div>

      {/* Mức giảm */}
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <span className="inline-flex items-center whitespace-nowrap rounded-md bg-brand-light px-2 py-0.5 text-[13px] font-extrabold tabular-nums text-brand">
          {formatPromotionValue(promotion.discount_type, promotion.discount_value)}
        </span>
        <span className="max-w-full truncate whitespace-nowrap text-xs text-slate-500">
          {minOrder > 0 ? `Đơn từ ${formatVND(minOrder)}` : "Mọi đơn hàng"}
        </span>
      </div>

      {/* Lượt dùng */}
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-slate-500">
            <strong className="font-bold text-slate-900">{promotion.used_count}</strong>
            {promotion.max_uses ? ` / ${promotion.max_uses}` : ""}
          </span>
          <span
            className={cn(
              "font-bold",
              progress >= 100 ? "text-red-600" : progress >= 80 ? "text-amber-600" : "text-slate-600",
            )}
          >
            {progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress >= 100 ? "bg-red-500" : progress >= 80 ? "bg-amber-500" : "bg-brand",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Thời hạn */}
      <div className="flex flex-col gap-1.5 text-xs font-semibold tabular-nums text-slate-700">
        <span className="flex items-center gap-1.5 whitespace-nowrap" title="Ngày bắt đầu">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          {formatDate(promotion.start_date)}
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap" title="Ngày kết thúc">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          {formatDate(promotion.end_date)}
        </span>
      </div>

      {/* Trạng thái */}
      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold",
            status.color,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </div>

      {/* Thao tác */}
      <div className="flex lg:w-[112px] lg:justify-end">
        <AdminIconButtonGroup>
          <AdminIconButton label="Sửa voucher" onClick={() => onEdit(promotion)}>
            <PencilSimple size={16} />
          </AdminIconButton>
          <AdminIconButton
            label={isBroadcasting ? "Đang gửi thông báo..." : "Phát thông báo tới bệnh nhân"}
            onClick={() => onBroadcast(promotion)}
            disabled={isBroadcasting}
            tone="sky"
          >
            {isBroadcasting ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              <Megaphone size={16} />
            )}
          </AdminIconButton>
          <AdminIconButton
            label={promotion.is_active ? "Tạm ngưng" : "Kích hoạt"}
            onClick={() => onToggleStatus(promotion.id)}
            tone={promotion.is_active ? "amber" : "emerald"}
          >
            {promotion.is_active ? <Pause size={16} /> : <Play size={16} />}
          </AdminIconButton>
        </AdminIconButtonGroup>
      </div>
    </div>
  );
}
