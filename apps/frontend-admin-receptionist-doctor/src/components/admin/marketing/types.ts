export type TargetType = "SERVICE" | "PROMOTION" | "EXTERNAL";

export type Banner = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  targetType?: TargetType | string | null;
  targetId?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BannerStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type TargetTypeFilter = "ALL" | "SERVICE" | "PROMOTION" | "EXTERNAL";
