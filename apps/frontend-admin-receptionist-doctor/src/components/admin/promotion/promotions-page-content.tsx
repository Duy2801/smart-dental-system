"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
import { AddPromoModal } from "./components/add-promo-modal";
import { PromotionList } from "./components/promotion-list";
import { PromotionToolbar } from "./components/promotion-toolbar";
import {
  createPromotion,
  deletePromotion as deletePromotionApi,
  getPromotions,
  updatePromotionStatus,
  type CreatePromotionPayload,
} from "./promotion-api";
import { filterPromotions } from "./promotion-utils";
import type { PromotionStatusFilter } from "./types";

export function PromotionsPageContent() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PromotionStatusFilter>("ALL");
  const [showModal, setShowModal] = useState(false);

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
      await invalidatePromotions();
    },
    onError: () => {
      setErrorMessage("Them khuyen mai that bai.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updatePromotionStatus(id, isActive),
    onSuccess: invalidatePromotions,
    onError: () => {
      setErrorMessage("Cap nhat khuyen mai that bai.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromotionApi,
    onSuccess: invalidatePromotions,
    onError: () => {
      setErrorMessage("Xoa khuyen mai that bai.");
    },
  });

  const filteredPromotions = useMemo(
    () => filterPromotions(promotions, search, statusFilter),
    [promotions, search, statusFilter],
  );

  const toggleStatus = async (id: string) => {
    const currentPromotion = promotions.find((promotion) => promotion.id === id);
    if (!currentPromotion) return;

    setErrorMessage("");
    try {
      await statusMutation.mutateAsync({
        id,
        isActive: !currentPromotion.is_active,
      });
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const deletePromotion = async (id: string) => {
    setErrorMessage("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const handleAdd = async (promotion: CreatePromotionPayload) => {
    setErrorMessage("");
    try {
      await createMutation.mutateAsync(promotion);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PromotionToolbar
        search={search}
        statusFilter={statusFilter}
        onAddClick={() => setShowModal(true)}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />
      <PromotionList
        loading={isLoading}
        promotions={filteredPromotions}
        onDelete={deletePromotion}
        onToggleStatus={toggleStatus}
      />
      {isError || errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage || "Khong tai duoc danh sach khuyen mai."}
        </div>
      ) : null}
      {showModal ? (
        <AddPromoModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      ) : null}
    </div>
  );
}
