"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
import { AdminConfirmModal } from "@/src/components/admin/common";
import { PromoFormModal } from "./components/promo-form-modal";
import { PromotionAnalyticsCards } from "./components/promotion-analytics-cards";
import { PromotionList } from "./components/promotion-list";
import { PromotionToolbar } from "./components/promotion-toolbar";
import {
  broadcastPromotionNotification,
  createPromotion,
  deletePromotion as deletePromotionApi,
  getPromotions,
  updatePromotion,
  updatePromotionStatus,
  type SavePromotionPayload,
} from "./promotion-api";
import { filterPromotions } from "./promotion-utils";
import type { Promotion, PromotionStatusFilter } from "./types";

export function PromotionsPageContent() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PromotionStatusFilter>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const {
    data: promotions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.promotions(search),
    queryFn: () => getPromotions(search),
  });

  const invalidatePromotions = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });

  const createMutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: async () => {
      setShowModal(false);
      setSuccessMessage("Tạo mới chương trình khuyến mãi thành công!");
      await invalidatePromotions();
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: () => {
      setErrorMessage("Tạo mới khuyến mãi thất bại. Vui lòng kiểm tra lại mã code.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SavePromotionPayload;
    }) => updatePromotion(id, payload),
    onSuccess: async () => {
      setShowModal(false);
      setEditingPromotion(null);
      setSuccessMessage("Cập nhật chương trình khuyến mãi thành công!");
      await invalidatePromotions();
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: () => {
      setErrorMessage("Cập nhật thông tin khuyến mãi thất bại.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updatePromotionStatus(id, isActive),
    onSuccess: async () => {
      await invalidatePromotions();
    },
    onError: () => {
      setErrorMessage("Cập nhật trạng thái thất bại.");
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: broadcastPromotionNotification,
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Đã gửi thông báo ưu đãi thành công!");
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: () => {
      setErrorMessage("Gửi thông báo quảng bá thất bại.");
    },
    onSettled: () => {
      setBroadcastingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromotionApi,
    onSuccess: async () => {
      setSuccessMessage("Đã xóa mã khuyến mãi thành công.");
      await invalidatePromotions();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: () => {
      setErrorMessage("Xóa khuyến mãi thất bại.");
    },
  });

  const filteredPromotions = useMemo(
    () => filterPromotions(promotions, search, statusFilter),
    [promotions, search, statusFilter]
  );

  const toggleStatus = async (id: string) => {
    const current = promotions.find((p) => p.id === id);
    if (!current) return;

    setErrorMessage("");
    try {
      await statusMutation.mutateAsync({
        id,
        isActive: !current.is_active,
      });
    } catch {
      // Handled by onError callback
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [broadcastConfirmPromotion, setBroadcastConfirmPromotion] =
    useState<Promotion | null>(null);

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
      // Handled by onError callback
    }
  };

  const handleBroadcast = (promotion: Promotion) => {
    setBroadcastConfirmPromotion(promotion);
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastConfirmPromotion) return;
    setErrorMessage("");
    setBroadcastingId(broadcastConfirmPromotion.id);
    try {
      await broadcastMutation.mutateAsync(broadcastConfirmPromotion.id);
      setBroadcastConfirmPromotion(null);
    } catch {
      // Handled by onError callback
    }
  };

  const handleSave = async (payload: SavePromotionPayload) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (editingPromotion) {
      await updateMutation.mutateAsync({
        id: editingPromotion.id,
        payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Analytics Summary */}
      <PromotionAnalyticsCards promotions={promotions} />

      {/* Toolbar & Filters */}
      <PromotionToolbar
        search={search}
        statusFilter={statusFilter}
        onAddClick={() => {
          setEditingPromotion(null);
          setShowModal(true);
        }}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-xs">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {isError || errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-xs">
          <span>⚠️</span>
          <span>{errorMessage || "Không tải được danh sách khuyến mãi."}</span>
        </div>
      ) : null}

      {/* Promotion Data Table */}
      <PromotionList
        loading={isLoading}
        promotions={filteredPromotions}
        onEdit={(promotion) => {
          setEditingPromotion(promotion);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleStatus={toggleStatus}
        onBroadcast={handleBroadcast}
        broadcastingId={broadcastingId}
      />

      {/* Add / Edit Form Modal */}
      {showModal ? (
        <PromoFormModal
          initialValue={editingPromotion}
          onSubmit={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingPromotion(null);
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      ) : null}

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        title="Xác nhận xóa mã khuyến mãi"
        description="Bạn có chắc chắn muốn xóa mã khuyến mãi này không? Sau khi xóa, bệnh nhân sẽ không thể áp dụng mã này nữa."
        confirmText="Xóa khuyến mãi"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />

      {/* Broadcast Notification Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(broadcastConfirmPromotion)}
        title="Xác nhận phát thông báo ưu đãi"
        description={
          <>
            Bạn có chắc chắn muốn phát thông báo quảng bá mã{" "}
            <strong className="font-semibold text-slate-900">
              &quot;{broadcastConfirmPromotion?.code}&quot;
            </strong>{" "}
            tới tất cả Bệnh nhân trong hệ thống không?
          </>
        }
        confirmText="Phát thông báo ngay"
        cancelText="Hủy bỏ"
        variant="primary"
        isLoading={broadcastMutation.isPending}
        onConfirm={handleConfirmBroadcast}
        onClose={() => setBroadcastConfirmPromotion(null)}
      />
    </div>
  );
}
