"use client";

import { ImagesSquare, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  AdminEmptyState,
  AdminSwitch,
  AdminIconButton,
  AdminIconButtonDivider,
  AdminIconButtonGroup,
  SkeletonRows,
} from "@/src/components/admin/common";
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="hidden items-center border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:flex">
        <div className="w-[22%]">Hình ảnh</div>
        <div className="w-[53%]">Tiêu đề & mô tả</div>
        <div className="w-[13%] text-center">Trạng thái</div>
        <div className="w-[12%] text-right pr-2">Thao tác</div>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <SkeletonRows count={4} />
        ) : banners.length === 0 ? (
          <AdminEmptyState
            icon={<ImagesSquare size={24} weight="duotone" />}
            title="Chưa có banner quảng cáo nào"
            description="Bấm “Thêm banner mới” ở trên để đăng banner đầu tiên."
          />
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
        <div className="relative h-20 w-40 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/400x200/f1f5f9/94a3b8?text=Anh+Banner";
            }}
          />
        </div>
      </div>

      {/* Title & Description */}
      <div className="flex shrink-0 flex-col pr-6 lg:w-[53%]">
        <span className="line-clamp-1 text-[15px] font-bold text-slate-900">
          {banner.title}
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {banner.description || "Không có mô tả chi tiết."}
        </span>
      </div>

      {/* Active Status Toggle */}
      <div className="flex shrink-0 items-center gap-2.5 lg:w-[13%] lg:justify-center">
        <AdminSwitch
          checked={banner.isActive}
          onChange={() => onToggleStatus(banner)}
          label={banner.isActive ? "Ẩn banner khỏi trang chủ" : "Hiển thị banner trên trang chủ"}
        />
        <span
          className={cn(
            "text-xs font-semibold",
            banner.isActive ? "text-emerald-700" : "text-slate-500",
          )}
        >
          {banner.isActive ? "Đang hiển thị" : "Đã tạm ẩn"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center justify-end gap-2 lg:w-[12%] lg:pr-2">
        <AdminIconButtonGroup>
          <AdminIconButton label="Chỉnh sửa banner" onClick={() => onEdit(banner)}>
            <PencilSimple size={16} />
          </AdminIconButton>
          <AdminIconButtonDivider />
          <AdminIconButton label="Xóa banner" tone="red" onClick={() => onDelete(banner.id)}>
            <Trash size={16} />
          </AdminIconButton>
        </AdminIconButtonGroup>
      </div>
    </div>
  );
}
