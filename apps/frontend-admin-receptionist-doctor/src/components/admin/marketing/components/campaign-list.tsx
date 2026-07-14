import { SkeletonRows } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import {
  campaignStatusConfig,
  channelConfig,
  getReadPercent,
} from "../marketing-utils";
import type { Campaign } from "../types";

type CampaignListProps = {
  campaigns: Campaign[];
  loading?: boolean;
  onDelete: (id: string) => void;
};

export function CampaignList({
  campaigns,
  loading = false,
  onDelete,
}: CampaignListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="hidden items-center border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:flex">
        <div className="w-[45%]">Chien dich</div>
        <div className="w-[15%]">Len lich gui</div>
        <div className="w-[10%]">Kenh</div>
        <div className="w-[10%]">Trang thai</div>
        <div className="w-[20%] pl-4">Hieu suat</div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <SkeletonRows count={5} />
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Khong tim thay chien dich nao.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CampaignRow({
  campaign,
  onDelete,
}: {
  campaign: Campaign;
  onDelete: (id: string) => void;
}) {
  const readPercent = getReadPercent(campaign);

  return (
    <div className="group relative flex flex-col gap-4 p-5 transition-colors hover:bg-muted/20 lg:flex-row lg:items-center lg:gap-0">
      <div className="flex shrink-0 flex-col pr-4 lg:w-[45%]">
        <span className="line-clamp-1 font-semibold text-brand-dark">
          {campaign.title}
        </span>
        <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {campaign.content}
        </span>
      </div>

      <div className="flex shrink-0 flex-col lg:w-[15%]">
        <span className="text-sm font-medium text-brand-dark">
          {formatDate(campaign.scheduled_at)}
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">
          {new Date(campaign.scheduled_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="flex shrink-0 gap-4 lg:w-[20%]">
        <div className="w-1/2">
          <span
            className={cn(
              "inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
              channelConfig[campaign.channel].color,
            )}
          >
            {channelConfig[campaign.channel].label}
          </span>
        </div>
        <div className="w-1/2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              campaignStatusConfig[campaign.status].color,
            )}
          >
            {campaignStatusConfig[campaign.status].label}
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-sm shrink-0 flex-col lg:w-[20%] lg:pl-4">
        {campaign.status === "PENDING" ? (
          <span className="text-xs italic text-muted-foreground">Chua gui</span>
        ) : campaign.status === "FAILED" ? (
          <span className="text-xs font-medium text-red-500">
            0 gui thanh cong
          </span>
        ) : (
          <>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-brand-dark">
                {readPercent}% Da doc
              </span>
              <span className="text-muted-foreground">
                {campaign.read_count} / {campaign.sent_count}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${readPercent}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          title="Nhan ban"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand"
        >
          Copy
        </button>
        <div className="mx-1 h-4 w-[1px] bg-border" />
        <button
          type="button"
          title="Xoa"
          onClick={() => onDelete(campaign.id)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          Xoa
        </button>
      </div>
    </div>
  );
}
