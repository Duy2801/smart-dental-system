import { apiClient } from "@/src/lib/api/client";
import type { User } from "@/src/types/user";

export async function getCurrentUser() {
  return apiClient<User>("/auth/me");
}

export async function login(email: string, password: string) {
  return apiClient<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiClient<void>("/auth/logout", { method: "POST" });
}
