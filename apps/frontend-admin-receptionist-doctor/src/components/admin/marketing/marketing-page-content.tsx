"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
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
    onError: () => {
      setErrorMessage("Thêm Banner quảng cáo thất bại. Vui lòng kiểm tra lại dữ liệu.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBannerApi,
    onSuccess: async () => {
      setIsModalOpen(false);
      setEditingBanner(null);
      await invalidateBanners();
    },
    onError: () => {
      setErrorMessage("Cập nhật Banner thất bại. Vui lòng kiểm tra lại.");
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Banner này không?")) return;
    setErrorMessage("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error callback handles message
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    setErrorMessage("");
    try {
      await updateMutation.mutateAsync({
        id: banner.id,
        data: { isActive: !banner.isActive },
      });
    } catch {
      // Error callback handles message
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

      <CampaignList
        loading={isLoading}
        banners={filteredBanners}
        onDelete={handleDelete}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
      />

      {isError || errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage || "Không tải được dữ liệu danh sách Banner từ máy chủ."}
        </div>
      ) : null}

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
    </div>
  );
}
