export type ServiceCategory = "all" | "cosmetic" | "restoration" | "orthodontics" | "general";

export type DentalService = {
  id: string;
  title: string;
  description: string;
  category: Exclude<ServiceCategory, "all">;
  price: string;
  image: string;
  imageAlt: string;
  badge?: string;
};

export type ServiceFilter = {
  id: ServiceCategory;
  label: string;
};
