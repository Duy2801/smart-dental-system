export const siteConfig = {
  name: "Smart Dental System",
  description: "Hệ thống quản lý phòng khám nha khoa",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
} as const;
