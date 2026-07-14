import apiClient from "@/src/lib/api/client";
import type { Campaign, Channel, ChannelFilter } from "./types";

export type CreateCampaignPayload = {
  channel: Channel;
  content: string;
  scheduled_at?: string;
  title: string;
};

export async function getCampaigns(params: {
  channel?: ChannelFilter;
  search?: string;
}) {
  const response = await apiClient.get<Campaign[]>("/marketing-campaigns", {
    params,
  });

  return response.data;
}

export async function createCampaign(payload: CreateCampaignPayload) {
  const response = await apiClient.post<Campaign>(
    "/marketing-campaigns",
    payload,
  );

  return response.data;
}

export async function deleteCampaign(id: string) {
  await apiClient.delete(`/marketing-campaigns/${id}`);
}
