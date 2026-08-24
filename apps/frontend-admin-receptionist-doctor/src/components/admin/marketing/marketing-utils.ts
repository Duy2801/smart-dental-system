import type { Banner, BannerStatusFilter } from "./types";

export function filterBanners(
  banners: Banner[],
  search: string,
  statusFilter: BannerStatusFilter,
) {
  return banners.filter((banner) => {
    const matchSearch = search
      ? banner.title.toLowerCase().includes(search.toLowerCase()) ||
        (banner.description &&
          banner.description.toLowerCase().includes(search.toLowerCase()))
      : true;

    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
          ? banner.isActive
          : !banner.isActive;

    return matchSearch && matchStatus;
  });
}

export function getBannerStats(banners: Banner[]) {
  const totalBanners = banners.length;
  const activeBanners = banners.filter((b) => b.isActive).length;
  const inactiveBanners = totalBanners - activeBanners;

  return {
    totalBanners,
    activeBanners,
    inactiveBanners,
  };
}
