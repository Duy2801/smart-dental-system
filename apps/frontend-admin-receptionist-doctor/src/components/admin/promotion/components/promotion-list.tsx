import { useState } from "react";
import { SkeletonRows } from "@/src/components/admin/common";
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
      <div className="hidden items-center border-b border-border bg-slate-50/80 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 sm:flex">
        <div className="w-[38%]">Mã & Chương trình Khuyến mãi</div>
        <div className="w-[17%]">Mức giảm & Điều kiện</div>
        <div className="w-[17%]">Lượt dùng</div>
        <div className="w-[15%]">Thời hạn</div>
        <div className="w-[13%] pr-4 text-right">Trạng thái & Thao tác</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={5} />
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-sm font-medium text-slate-500">
            Không tìm thấy chương trình khuyến mãi nào.
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

  const getScopeBadge = () => {
    if (promotion.applicable_treatment_method) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200 shadow-2xs">
          🎯 {promotion.applicable_treatment_method.name}
        </span>
      );
    }
    if (promotion.applicable_service_slug) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 shadow-2xs">
          🏷️ Nhóm: {promotion.applicable_service_slug}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
        🌐 Toàn hệ thống
      </span>
    );
  };

  const bannerSrc =
    promotion.image_url ||
    promotion.applicable_treatment_method?.imageUrl ||
    null;

  return (
    <div className="group relative flex flex-col gap-4 p-5 sm:p-6 transition-all hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-0">
      {/* Code & Campaign Info */}
      <div className="flex shrink-0 pr-4 sm:w-[38%] gap-4 items-center">
        {bannerSrc ? (
          <div className="relative h-20 w-24 sm:h-22 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs transition-transform group-hover:scale-[1.02]">
            <img
              src={bannerSrc}
              alt={promotion.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-24 sm:h-22 sm:w-28 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-blue-100 text-brand text-3xl font-extrabold border border-brand/20 shadow-xs">
            🎟️
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Bấm để sao chép mã"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-slate-100 px-2.5 py-1 font-mono text-xs font-extrabold tracking-wider text-slate-900 transition-colors hover:bg-slate-200 shadow-2xs"
            >
              <span>{promotion.code}</span>
              <span className="text-[11px] text-slate-500">
                {copied ? "✓ Đã chép" : "📋"}
              </span>
            </button>
            {getScopeBadge()}
          </div>
          <span className="text-base font-extrabold text-slate-900 line-clamp-1 leading-snug">
            {promotion.name}
          </span>
          {promotion.description && (
            <span className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
              {promotion.description}
            </span>
          )}
        </div>
      </div>

      {/* Discount Value & Conditions */}
      <div className="flex shrink-0 flex-col sm:w-[17%]">
        <span className="font-mono text-base font-extrabold text-brand">
          {formatPromotionValue(
            promotion.discount_type,
            promotion.discount_value
          )}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          Đơn tối thiểu:{" "}
          <span className="font-semibold text-slate-800">
            {formatVND(promotion.min_order_amount)}
          </span>
        </span>
      </div>

      {/* Usage Progress */}
      <div className="flex shrink-0 flex-col pr-6 sm:w-[17%]">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-slate-500">
            Đã dùng: <strong className="text-slate-900 font-extrabold">{promotion.used_count}</strong>
            {promotion.max_uses ? ` / ${promotion.max_uses}` : ""}
          </span>
          <span className="font-extrabold text-slate-900">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress >= 100 ? "bg-red-500" : "bg-brand"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="flex shrink-0 flex-col text-xs text-slate-600 sm:w-[15%]">
        <span>
          Bắt đầu:{" "}
          <span className="font-bold text-slate-900">
            {formatDate(promotion.start_date)}
          </span>
        </span>
        <span className="mt-1">
          Kết thúc:{" "}
          <span className="font-bold text-slate-900">
            {formatDate(promotion.end_date)}
          </span>
        </span>
      </div>

      {/* Status Badge */}
      <div className="flex shrink-0 sm:w-[13%] sm:justify-end sm:pr-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-center text-xs font-extrabold shadow-xs",
            status.color
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl border border-border bg-white p-1.5 opacity-100 shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          title="Sửa Voucher"
          onClick={() => onEdit(promotion)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand"
        >
          ✏️ Sửa
        </button>

        <button
          type="button"
          title="Gửi thông báo tới bệnh nhân"
          disabled={isBroadcasting}
          onClick={() => onBroadcast(promotion)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50"
        >
          📢 {isBroadcasting ? "Đang gửi..." : "Phát thông báo"}
        </button>

        <button
          type="button"
          title={promotion.is_active ? "Tạm ngưng" : "Kích hoạt"}
          onClick={() => onToggleStatus(promotion.id)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-50"
        >
          {promotion.is_active ? "⏸️ Ngưng" : "▶️ Bật"}
        </button>

        <div className="mx-0.5 h-4 w-[1px] bg-border" />

        <button
          type="button"
          title="Xóa Voucher"
          onClick={() => onDelete(promotion.id)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
        >
          🗑️ Xóa
        </button>
      </div>
    </div>
  );
}
