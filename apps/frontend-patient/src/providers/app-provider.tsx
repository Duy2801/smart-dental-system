"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { apiMe, apiRefresh } from "@/features/auth/api";
import { ToastProvider } from "@/features/dashboard/common/toast";
import { login, logout, updateAccessToken } from "./loginSlice";
import store from "./store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthHydrator() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/auth")) return;

    void apiRefresh()
      .then(async (refreshResponse) => {
        const { accessToken } = refreshResponse.data;
        store.dispatch(updateAccessToken(accessToken));

        const meResponse = await apiMe();
        store.dispatch(
          login({
            user: meResponse.data,
            accessToken,
          }),
        );
      })
      .catch(() => {
        store.dispatch(logout());
      });
  }, []);

  return null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator />
        {children}
        <ToastProvider />
      </QueryClientProvider>
    </Provider>
  );
}
