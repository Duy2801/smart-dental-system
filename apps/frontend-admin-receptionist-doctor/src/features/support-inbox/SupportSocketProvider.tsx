"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { useSupportSocket } from "./useSupportSocket";
import { listMyConversations, listUnclaimedConversations } from "./api";

type SupportSocketContextValue = {
  socket: Socket | null;
  pendingCount: number;
};

const SupportSocketContext = createContext<SupportSocketContextValue>({
  socket: null,
  pendingCount: 0,
});

/**
 * Connects the receptionist support-chat socket for the whole session (as
 * soon as they're logged in), not just while they happen to have the inbox
 * page open — otherwise the auto-assign algorithm treats them as "offline"
 * whenever they're doing check-in/billing/etc, which defeats the point of
 * auto-assignment. Also owns the unclaimed/mine list queries so a live
 * pending-count badge can be shown anywhere in the layout (e.g. the sidebar
 * nav item), and keeps them fresh via socket events.
 */
export function SupportSocketProvider({ children }: { children: ReactNode }) {
  const socket = useSupportSocket();
  const queryClient = useQueryClient();

  const unclaimedQuery = useQuery({
    queryKey: ["support", "unclaimed"],
    queryFn: listUnclaimedConversations,
    staleTime: 10_000,
  });
  const mineQuery = useQuery({
    queryKey: ["support", "mine"],
    queryFn: listMyConversations,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!socket) return;

    function refreshLists() {
      void queryClient.invalidateQueries({ queryKey: ["support", "unclaimed"] });
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
    }

    socket.on("support:new", refreshLists);
    socket.on("support:claimed", refreshLists);
    socket.on("support:requeued", refreshLists);
    socket.on("support:message", refreshLists);

    return () => {
      socket.off("support:new", refreshLists);
      socket.off("support:claimed", refreshLists);
      socket.off("support:requeued", refreshLists);
      socket.off("support:message", refreshLists);
    };
  }, [socket, queryClient]);

  const pendingCount = useMemo(() => {
    const unclaimed = unclaimedQuery.data?.length ?? 0;
    const unread = (mineQuery.data ?? []).reduce(
      (sum, conversation) => sum + (conversation.unreadCount ?? 0),
      0,
    );
    return unclaimed + unread;
  }, [unclaimedQuery.data, mineQuery.data]);

  const value = useMemo(() => ({ socket, pendingCount }), [socket, pendingCount]);

  return (
    <SupportSocketContext.Provider value={value}>{children}</SupportSocketContext.Provider>
  );
}

export function useSupportSocketContext() {
  return useContext(SupportSocketContext);
}
