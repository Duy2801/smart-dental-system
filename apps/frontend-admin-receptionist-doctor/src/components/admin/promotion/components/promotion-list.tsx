import { useState } from "react";
import {
  ArrowRight,
  CalendarBlank,
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
  Trash,
} from "@phosphor-icons/react";
import {
  AdminIconButton,
  AdminIconButtonDivider,
  AdminIconButtonGroup,
  SkeletonRows,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  formatPromotionValue,
  formatVND,
  getPromotionStatus,
  getPromotionUsageProgress,
} from "../promotion-utils";
import type { Promotion } from "../types";

type PromotionListProps = {
  loading?: boolean;
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onBroadcast: (promotion: Promotion) => void;
  broadcastingId?: string | null;
};

export function PromotionList({
  loading = false,
  promotions,
  onEdit,
  onDelete,
  onToggleStatus,
  onBroadcast,
  broadcastingId,
}: PromotionListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="hidden items-center border-b border-border bg-slate-50/80 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:flex">
        <div className="w-[36%]">Chương trình khuyến mãi</div>
        <div className="w-[15%]">Mức giảm</div>
        <div className="w-[17%]">Lượt dùng</div>
        <div className="w-[14%]">Thời hạn</div>
        <div className="w-[18%] text-right">Trạng thái & Thao tác</div>
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
              onEdit={onEdit}
              onDelete={onDelete}
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
  onEdit,
  onDelete,
  onToggleStatus,
  onBroadcast,
  isBroadcasting,
}: {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
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

  const scopeBadge = promotion.applicable_treatment_method ? (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
      <Target size={12} weight="bold" className="shrink-0" />
      <span className="truncate">{promotion.applicable_treatment_method.name}</span>
    </span>
  ) : promotion.applicable_service_slug ? (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
      <Tag size={12} weight="bold" className="shrink-0" />
      <span className="truncate">Nhóm: {promotion.applicable_service_slug}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
      <Globe size={12} weight="bold" />
      Toàn hệ thống
    </span>
  );

  const bannerSrc =
    promotion.image_url ||
    promotion.applicable_treatment_method?.imageUrl ||
    null;

  return (
    <div className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:gap-0 sm:px-6">
      {/* Code & Campaign Info */}
      <div className="flex min-w-0 items-center gap-4 sm:w-[36%] sm:pr-5">
        {bannerSrc ? (
          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <img
              src={bannerSrc}
              alt={promotion.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-light to-blue-100 text-brand ring-1 ring-brand/15">
            <Ticket size={30} weight="duotone" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Bấm để sao chép mã"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider transition-colors",
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-800 hover:border-brand hover:text-brand",
              )}
            >
              {promotion.code}
              {copied ? <Check size={12} weight="bold" /> : <Copy size={12} />}
            </button>
            {scopeBadge}
          </div>
          <span className="line-clamp-1 text-[15px] font-bold leading-snug text-slate-900">
            {promotion.name}
          </span>
          {promotion.description ? (
            <span className="line-clamp-2 text-xs leading-relaxed text-slate-500">
              {promotion.description}
            </span>
          ) : null}
        </div>
      </div>

      {/* Discount Value & Conditions */}
      <div className="flex flex-col sm:w-[15%] sm:pr-4">
        <span className="inline-flex w-fit items-center rounded-lg bg-brand-light px-2.5 py-1 text-sm font-extrabold text-brand">
          {formatPromotionValue(promotion.discount_type, promotion.discount_value)}
        </span>
        <span className="mt-1.5 text-xs text-slate-500">
          Đơn tối thiểu:{" "}
          <span className="font-semibold text-slate-800">
            {formatVND(promotion.min_order_amount)}
          </span>
        </span>
      </div>

      {/* Usage Progress */}
      <div className="flex flex-col sm:w-[17%] sm:pr-6">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-slate-500">
            Đã dùng{" "}
            <strong className="font-bold text-slate-900">{promotion.used_count}</strong>
            {promotion.max_uses ? ` / ${promotion.max_uses}` : ""}
          </span>
          <span
            className={cn(
              "font-bold",
              progress >= 100 ? "text-red-600" : progress >= 80 ? "text-amber-600" : "text-slate-700",
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

      {/* Date Range */}
      <div className="flex flex-col gap-1 text-xs sm:w-[14%]">
        <span className="flex items-center gap-1.5 text-slate-500" title="Ngày bắt đầu">
          <CalendarBlank size={13} className="shrink-0 text-slate-400" />
          <span className="font-semibold text-slate-800">{formatDate(promotion.start_date)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-500" title="Ngày kết thúc">
          <ArrowRight size={13} className="shrink-0 text-slate-400" />
          <span className="font-semibold text-slate-800">{formatDate(promotion.end_date)}</span>
        </span>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-col items-start gap-2.5 sm:w-[18%] sm:items-end">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold",
            status.color,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>

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
          <AdminIconButtonDivider />
          <AdminIconButton label="Xóa voucher" onClick={() => onDelete(promotion.id)} tone="red">
            <Trash size={16} />
          </AdminIconButton>
        </AdminIconButtonGroup>
      </div>
    </div>
  );
}
