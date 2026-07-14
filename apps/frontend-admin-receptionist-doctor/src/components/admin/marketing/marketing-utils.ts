import type { Campaign, CampaignStatus, Channel } from "./types";

export const channelConfig: Record<Channel, { label: string; color: string }> = {
  EMAIL: { label: "Email", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_APP: {
    label: "In-App",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

export const campaignStatusConfig: Record<
  CampaignStatus,
  { label: string; color: string }
> = {
  PENDING: {
    label: "Dang len lich",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  SENT: {
    label: "Da gui",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  FAILED: { label: "Loi gui", color: "bg-red-100 text-red-700 border-red-200" },
};

export function filterCampaigns(
  campaigns: Campaign[],
  search: string,
  channelFilter: Channel | "ALL",
) {
  return campaigns.filter((campaign) => {
    const matchSearch = search
      ? campaign.title.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchChannel =
      channelFilter === "ALL" ? true : campaign.channel === channelFilter;

    return matchSearch && matchChannel;
  });
}

export function getMarketingStats(campaigns: Campaign[]) {
  const totalSent = campaigns.reduce(
    (total, campaign) => total + campaign.sent_count,
    0,
  );
  const totalRead = campaigns.reduce(
    (total, campaign) => total + campaign.read_count,
    0,
  );

  return {
    totalCampaigns: campaigns.length,
    totalSent,
    avgReadRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0,
  };
}

export function getReadPercent(campaign: Campaign) {
  return campaign.sent_count > 0
    ? Math.round((campaign.read_count / campaign.sent_count) * 100)
    : 0;
}
