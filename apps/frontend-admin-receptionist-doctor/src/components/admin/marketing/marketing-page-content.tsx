"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { AdminAlert, AdminConfirmModal } from "@/src/components/admin/common";
import { CampaignList } from "./components/campaign-list";
import { CampaignModal } from "./components/campaign-modal";
import { MarketingSummaryCards } from "./components/marketing-summary-cards";
import { MarketingToolbar } from "./components/marketing-toolbar";
import { filterBanners, getBannerStats } from "./marketing-utils";
import {
  createBanner,
  deleteBanner as deleteBannerApi,
  getBanners,
  updateBanner as updateBannerApi,
  type CreateBannerPayload,
} from "./marketing-api";
import type { Banner, BannerStatusFilter } from "./types";

export function MarketingPageContent() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BannerStatusFilter>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: banners = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.banners,
    queryFn: getBanners,
  });

  const invalidateBanners = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.banners });

  const createMutation = useMutation({
    mutationFn: createBanner,
    onSuccess: async () => {
      setIsModalOpen(false);
      setEditingBanner(null);
      await invalidateBanners();
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, "Thêm Banner quảng cáo thất bại. Vui lòng kiểm tra lại dữ liệu."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBannerApi,
    onSuccess: async () => {
      setIsModalOpen(false);
      setEditingBanner(null);
      await invalidateBanners();
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err, "Cập nhật Banner thất bại. Vui lòng kiểm tra lại."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBannerApi,
    onSuccess: invalidateBanners,
    onError: () => {
      setErrorMessage("Xóa Banner quảng cáo thất bại.");
    },
  });

  const filteredBanners = useMemo(
    () => filterBanners(banners, search, statusFilter),
    [banners, search, statusFilter],
  );

  const stats = getBannerStats(banners);

  const handleOpenAdd = () => {
    setErrorMessage("");
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setErrorMessage("");
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setErrorMessage("");
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch {
      // Error callback handles message
    }
  };

  const [statusConfirmBanner, setStatusConfirmBanner] = useState<Banner | null>(null);

  const handleToggleStatus = (banner: Banner) => {
    setStatusConfirmBanner(banner);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusConfirmBanner) return;
    setErrorMessage("");
    try {
      await updateMutation.mutateAsync({
        id: statusConfirmBanner.id,
        data: { isActive: !statusConfirmBanner.isActive },
      });
    } catch {
      // Error callback handles message
    } finally {
      setStatusConfirmBanner(null);
    }
  };

  const handleSubmitForm = async (payload: CreateBannerPayload) => {
    setErrorMessage("");
    if (editingBanner) {
      await updateMutation.mutateAsync({
        id: editingBanner.id,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const activeBanner = banners.find(
    (banner) => banner.isActive && banner.id !== statusConfirmBanner?.id,
  );

  return (
    <div className="space-y-6 p-6 md:p-8">
      <MarketingSummaryCards {...stats} />

      <MarketingToolbar
        search={search}
        statusFilter={statusFilter}
        onAddClick={handleOpenAdd}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />

      <AdminAlert
        message={isError || errorMessage ? errorMessage || "Không tải được dữ liệu danh sách banner từ máy chủ." : null}
      />

      <CampaignList
        loading={isLoading}
        banners={filteredBanners}
        onDelete={handleDelete}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
      />

      {isModalOpen ? (
        <CampaignModal
          initialData={editingBanner}
          loading={isSubmitting}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBanner(null);
          }}
          onSubmit={handleSubmitForm}
        />
      ) : null}

      <AdminConfirmModal
        isOpen={Boolean(statusConfirmBanner)}
        title={statusConfirmBanner?.isActive ? "Ẩn banner này?" : "Hiển thị lại banner?"}
        description={
          <>
            Banner{" "}
            <strong className="font-semibold text-slate-900">{statusConfirmBanner?.title}</strong>{" "}
            {statusConfirmBanner?.isActive
              ? "sẽ không còn xuất hiện trên trang chủ cho tới khi được hiển thị lại."
              : "sẽ xuất hiện trên trang chủ ngay sau khi xác nhận."}
            {!statusConfirmBanner?.isActive && activeBanner ? (
              <>
                {" "}Banner đang hiển thị{" "}
                <strong className="font-semibold text-slate-900">{activeBanner.title}</strong>{" "}
                sẽ tự động bị ẩn vì trang chủ chỉ hiển thị 1 banner.
              </>
            ) : null}
          </>
        }
        confirmText={statusConfirmBanner?.isActive ? "Ẩn banner" : "Hiển thị"}
        cancelText="Hủy bỏ"
        variant={statusConfirmBanner?.isActive ? "warning" : "primary"}
        icon={
          statusConfirmBanner?.isActive ? (
            <EyeSlash size={24} weight="duotone" />
          ) : (
            <Eye size={24} weight="duotone" />
          )
        }
        isLoading={updateMutation.isPending}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setStatusConfirmBanner(null)}
      />

      <AdminConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        title="Xác nhận xóa Banner"
        description="Bạn có chắc chắn muốn xóa Banner này không? Banner sẽ không còn xuất hiện trên trang chủ của phòng khám."
        confirmText="Xóa Banner"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
