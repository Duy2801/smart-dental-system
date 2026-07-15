"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { apiMe, apiRefresh } from "@/components/auth/api";
import { login, logout, updateAccessToken } from "./loginSlice";
import store from "./store";

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
      <AuthHydrator />
      {children}
    </Provider>
  );
}
