import type { DentalService, ServiceFormState } from "./types";

export const emptyServiceForm: ServiceFormState = {
  category: "",
  name: "",
  description: "",
  durationMinutes: 30,
  basePrice: 0,
  isActive: true,
};

export function toServiceFormState(service: DentalService): ServiceFormState {
  return {
    category: service.category,
    name: service.name,
    description: service.description ?? "",
    durationMinutes: service.durationMinutes,
    basePrice: Number(service.basePrice),
    isActive: service.isActive,
  };
}

export function groupServicesByCategory(services: DentalService[]) {
  return services.reduce<Record<string, DentalService[]>>((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {});
}

export function formatVND(amount: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount));
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
