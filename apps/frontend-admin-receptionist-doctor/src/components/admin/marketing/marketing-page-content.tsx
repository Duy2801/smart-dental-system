"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/query-keys";
import { CampaignList } from "./components/campaign-list";
import { CampaignModal } from "./components/campaign-modal";
import { MarketingSummaryCards } from "./components/marketing-summary-cards";
import { MarketingToolbar } from "./components/marketing-toolbar";
import {
  filterCampaigns,
  getMarketingStats,
} from "./marketing-utils";
import {
  createCampaign,
  deleteCampaign as deleteCampaignApi,
  getCampaigns,
  type CreateCampaignPayload,
} from "./marketing-api";
import type { ChannelFilter } from "./types";

export function MarketingPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: campaigns = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.marketing(channelFilter, search),
    queryFn: () =>
      getCampaigns({
        search,
        channel: channelFilter,
      }),
  });

  const invalidateCampaigns = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: async () => {
      setShowModal(false);
      await invalidateCampaigns();
    },
    onError: () => {
      setErrorMessage("Them chien dich that bai.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaignApi,
    onSuccess: invalidateCampaigns,
    onError: () => {
      setErrorMessage("Xoa chien dich that bai.");
    },
  });

  const filteredCampaigns = useMemo(
    () => filterCampaigns(campaigns, search, channelFilter),
    [campaigns, search, channelFilter],
  );
  const stats = getMarketingStats(campaigns);

  const handleDelete = async (id: string) => {
    setErrorMessage("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const handleAdd = async (campaign: CreateCampaignPayload) => {
    setErrorMessage("");
    try {
      await createMutation.mutateAsync(campaign);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <MarketingSummaryCards {...stats} />
      <MarketingToolbar
        channelFilter={channelFilter}
        search={search}
        onAddClick={() => setShowModal(true)}
        onChannelFilterChange={setChannelFilter}
        onSearchChange={setSearch}
      />
      <CampaignList
        loading={isLoading}
        campaigns={filteredCampaigns}
        onDelete={handleDelete}
      />
      {isError || errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage || "Khong tai duoc du lieu chien dich marketing."}
        </div>
      ) : null}
      {showModal ? (
        <CampaignModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      ) : null}
    </div>
  );
}
