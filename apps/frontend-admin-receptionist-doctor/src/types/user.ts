import type { Role } from "@/src/constants/roles";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
};
