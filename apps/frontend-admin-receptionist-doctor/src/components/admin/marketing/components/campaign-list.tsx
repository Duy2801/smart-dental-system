import { SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { Banner } from "../types";

type BannerListProps = {
  banners: Banner[];
  loading?: boolean;
  onDelete: (id: string) => void;
  onEdit: (banner: Banner) => void;
  onToggleStatus: (banner: Banner) => void;
};

export function CampaignList({
  banners,
  loading = false,
  onDelete,
  onEdit,
  onToggleStatus,
}: BannerListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-xs">
      <div className="hidden items-center border-b border-border bg-slate-50/80 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 lg:flex">
        <div className="w-[22%]">Hình ảnh Banner</div>
        <div className="w-[53%]">Tiêu đề & Mô tả</div>
        <div className="w-[13%] text-center">Trạng thái</div>
        <div className="w-[12%] text-right pr-2">Thao tác</div>
      </div>
      <div className="divide-y divide-border/60">
        {loading ? (
          <SkeletonRows count={4} />
        ) : banners.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">Chưa có Banner quảng cáo nào</p>
            <p className="mt-1 text-xs text-slate-400">Nhấn nút "+ Thêm Banner Mới" ở trên để đăng banner mới.</p>
          </div>
        ) : (
          banners.map((banner) => (
            <BannerRow
              key={banner.id}
              banner={banner}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BannerRow({
  banner,
  onDelete,
  onEdit,
  onToggleStatus,
}: {
  banner: Banner;
  onDelete: (id: string) => void;
  onEdit: (banner: Banner) => void;
  onToggleStatus: (banner: Banner) => void;
}) {
  return (
    <div className="group flex flex-col gap-4 p-5 transition-all hover:bg-slate-50/50 lg:flex-row lg:items-center lg:gap-0">
      {/* Banner Thumbnail */}
      <div className="flex shrink-0 items-center lg:w-[22%] pr-4">
        <div className="relative h-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs transition-transform group-hover:scale-[1.02]">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/400x200/f1f5f9/94a3b8?text=Anh+Banner";
            }}
          />
        </div>
      </div>

      {/* Title & Description */}
      <div className="flex shrink-0 flex-col pr-6 lg:w-[53%]">
        <span className="line-clamp-1 text-base font-bold text-brand-dark">
          {banner.title}
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {banner.description || "Không có mô tả chi tiết."}
        </span>
      </div>

      {/* Active Status Badge & Toggle */}
      <div className="flex shrink-0 justify-center lg:w-[13%]">
        <button
          type="button"
          onClick={() => onToggleStatus(banner)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border shadow-xs",
            banner.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
          )}
          title="Bấm vào để thay đổi trạng thái"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              banner.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400",
            )}
          />
          {banner.isActive ? "Đang hiển thị" : "Đã tạm ẩn"}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center justify-end gap-2 lg:w-[12%] lg:pr-2">
        <button
          type="button"
          title="Chỉnh sửa Banner"
          onClick={() => onEdit(banner)}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          title="Xóa Banner"
          onClick={() => onDelete(banner.id)}
          className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-600 transition-colors hover:bg-red-100 shadow-2xs"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
