import apiClient from "@/src/lib/api/client";
import type { User } from "@/src/types/user";

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User }> {
  const response = await apiClient.post<{ user: User }>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post<void>("/auth/logout");
}
