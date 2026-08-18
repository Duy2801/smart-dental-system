import { calculatePromotionAnalytics } from "../promotion-utils";
import type { Promotion } from "../types";

export function PromotionAnalyticsCards({
  promotions,
}: {
  promotions: Promotion[];
}) {
  const { totalCount, activeCount, totalRedemptions, expiringSoonCount } =
    calculatePromotionAnalytics(promotions);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng số chiến dịch
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-base">
            🎁
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-extrabold text-slate-900">
            {totalCount}
          </span>
          <span className="text-xs text-slate-500">Mã khuyến mãi</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Đang diễn ra
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-base">
            ⚡
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-extrabold text-emerald-600">
            {activeCount}
          </span>
          <span className="text-xs text-slate-500">Đang kích hoạt</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng lượt áp dụng
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 text-base">
            🎟️
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-extrabold text-brand-dark">
            {totalRedemptions.toLocaleString("vi-VN")}
          </span>
          <span className="text-xs text-slate-500">Lượt dùng thành công</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cần lưu ý / Sắp hết
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-base">
            ⏳
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-extrabold text-amber-600">
            {expiringSoonCount}
          </span>
          <span className="text-xs text-slate-500">&lt; 7 ngày hoặc gần hết lượt</span>
        </div>
      </div>
    </div>
  );
}
