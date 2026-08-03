import { useQuery } from "@tanstack/react-query";
import { fetchPromotions, fetchServicesForPromotions } from "../api/promotionApi";

export function usePromotions() {
  const promotionsQuery = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
    staleTime: 1000 * 60 * 5,
  });

  const servicesQuery = useQuery({
    queryKey: ["promotion-services"],
    queryFn: fetchServicesForPromotions,
    staleTime: 1000 * 60 * 10,
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
