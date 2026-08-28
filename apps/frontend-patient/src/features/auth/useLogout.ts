import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiLogout } from "@/features/auth/api";
import { ROUTES } from "@/features/dashboard/common/routes";
import apiClient from "@/lib/axios";
import { logout, useAppDispatch } from "@/providers";

const authCookies = [
  "access_token",
  "refreshToken",
  "refresh_token",
  "role",
  "session",
  "user_info",
];

const authStorageKeys = [
  "access_token",
  "refreshToken",
  "refresh_token",
  "role",
  "session",
  "user_info",
  "patient_auth",
];

export function removeAuthCookie(name: string) {
  if (typeof document === "undefined") return;
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const paths = ["/", "/api/v1", "/api/v1/auth"];

  paths.forEach((path) => {
    document.cookie = `${name}=; path=${path}; ${expires}`;
    // Also attempt domain wildcard removal if domain is present
    document.cookie = `${name}=; path=${path}; ${expires}; domain=${window.location.hostname}`;
  });
}

export function clearClientAuth() {
  authCookies.forEach(removeAuthCookie);

  if (typeof window !== "undefined") {
    authStorageKeys.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }

  delete apiClient.defaults.headers.common.Authorization;
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  function handleLogout() {
    // 1. Immediately clear Redux store, cache, and auth tokens (0ms UI lag)
    dispatch(logout());
    queryClient.clear();
    clearClientAuth();

    // 2. Perform fast client-side redirect
    router.replace(ROUTES.login);

    // 3. Fire-and-forget backend apiLogout request
    void apiLogout().catch((error) => {
      console.warn("Server logout request error:", error);
    });
  }

  return { handleLogout };
}
