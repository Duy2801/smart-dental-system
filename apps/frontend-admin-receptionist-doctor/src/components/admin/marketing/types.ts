export type Channel = "EMAIL" | "IN_APP";
export type ChannelFilter = Channel | "ALL";
export type CampaignStatus = "PENDING" | "SENT" | "FAILED";

export type Campaign = {
  id: string;
  title: string;
  content: string;
  channel: Channel;
  status: CampaignStatus;
  scheduled_at: string;
  sent_count: number;
  read_count: number;
};
