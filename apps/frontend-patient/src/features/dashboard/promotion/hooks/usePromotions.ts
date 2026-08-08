import { useQuery } from "@tanstack/react-query";
import { fetchPromotions, fetchServicesForPromotions } from "../api/promotionApi";

export const promotionQueryKeys = {
  all: ["patient", "promotions"] as const,
  services: () => ["patient", "promotions", "services"] as const,
};

export function usePromotions() {
  const promotionsQuery = useQuery({
    queryKey: promotionQueryKeys.all,
    queryFn: fetchPromotions,
    staleTime: 10 * 60 * 1000, // 10 mins cache
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const servicesQuery = useQuery({
    queryKey: promotionQueryKeys.services(),
    queryFn: fetchServicesForPromotions,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    promotions: promotionsQuery.data ?? [],
    services: servicesQuery.data ?? [],
    isLoading: promotionsQuery.isLoading || servicesQuery.isLoading,
    isError: promotionsQuery.isError || servicesQuery.isError,
    refetch: () => {
      void promotionsQuery.refetch();
      void servicesQuery.refetch();
    },
  };
}
