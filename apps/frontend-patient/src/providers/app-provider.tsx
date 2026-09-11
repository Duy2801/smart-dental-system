"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { apiMe, apiRefresh } from "@/features/auth/api";
import { loadPatientSession } from "@/features/auth/session-storage";
import { ToastProvider } from "@/features/dashboard/common/toast";
import { SocketProvider } from "@/service/ws/useSocket";
import { useAppSelector } from "./hooks";
import {
  finishHydration,
  login,
  logout,
  updateAccessToken,
} from "./loginSlice";
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
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (window.location.pathname.startsWith("/auth")) {
      store.dispatch(finishHydration());
      return;
    }

    const storedSession = loadPatientSession();
    if (storedSession) {
      store.dispatch(
        login({
          user: storedSession.user,
          accessToken: storedSession.accessToken,
        }),
      );

      void apiMe()
        .then((profileResponse) => {
          const user = profileResponse.data;
          const accessToken =
            store.getState().login.accessToken || storedSession.accessToken;
          queryClient.setQueryData(["patient", "profile"], user);
          store.dispatch(
            login({
              user,
              accessToken,
            }),
          );
        })
        .catch(() => {
          store.dispatch(logout());
        });
      return;
    }

    void apiRefresh()
      .then(async (refreshResponse) => {
        const { accessToken, user: refreshedUser } = refreshResponse.data;
        store.dispatch(updateAccessToken(accessToken));

        const user = refreshedUser ?? (await apiMe()).data;
        queryClient.setQueryData(["patient", "profile"], user);
        store.dispatch(
          login({
            user,
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

function SocketAppWrapper({ children }: { children: ReactNode }) {
  const accessToken = useAppSelector((state) => state.login.accessToken);

  return <SocketProvider token={accessToken}>{children}</SocketProvider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator />
        <SocketAppWrapper>
          {children}
          <ToastProvider />
        </SocketAppWrapper>
      </QueryClientProvider>
    </Provider>
  );
}
