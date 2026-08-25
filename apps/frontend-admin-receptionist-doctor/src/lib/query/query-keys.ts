export const queryKeys = {
  admin: {
    clinicConfig: ["admin", "clinic-config"] as const,
    overview: ["admin", "overview"] as const,
    report: (timeFilter: string) =>
      ["admin", "report", timeFilter] as const,
    services: (search: string) => ["admin", "services", search] as const,
    schedules: {
      doctors: ["admin", "schedules", "doctors"] as const,
      availability: (doctorId: string) =>
        ["admin", "schedules", "availability", doctorId] as const,
    },
    personnel: (roleFilter: string, search: string) =>
      ["admin", "personnel", roleFilter, search] as const,
    promotions: (search: string) => ["admin", "promotions", search] as const,
    finance: (status: string, search: string) =>
      ["admin", "finance", status, search] as const,
    reviews: (rating: string, visibility: string, search: string) =>
      ["admin", "reviews", rating, visibility, search] as const,
    marketing: (channel: string, search: string) =>
      ["admin", "marketing", channel, search] as const,
    banners: ["admin", "banners"] as const,
  },
};
