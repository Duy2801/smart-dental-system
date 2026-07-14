export const siteConfig = {
  name: "Smart Dental System",
  description: "He thong quan ly phong kham nha khoa",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
} as const;
