"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

interface SocketProviderProps {
  children: ReactNode;
  token: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

function getSocketUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";
  return raw.replace(/\/api\/v1\/?$/, "");
}

export const SocketProvider = ({ children, token }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = getSocketUrl();
    console.log("[Socket] Connecting to:", socketUrl);

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected with ID:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected. Reason:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[Socket] Connect Error:", err.message);
    });

    // Realtime system listeners
    socketInstance.on("notification", (payload: { title?: string; message?: string }) => {
      console.log("[Socket] Notification event received:", payload);
      toast.info(
        payload?.title || "Thông báo mới",
        payload?.message || "Bạn có thông báo mới từ hệ thống phòng khám.",
      );
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    socketInstance.on("payment_updated", (payload) => {
      console.log("[Socket] Payment updated event received:", payload);
      toast.success(
        "Thanh toán thành công!",
        "Hệ thống đã nhận được tiền và xác nhận hóa đơn của bạn.",
      );
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["my-consultations"] });
      void queryClient.invalidateQueries({ queryKey: ["consultations"] });
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    });

    socketInstance.on("consultation_updated", (payload) => {
      console.log("[Socket] Consultation updated event received:", payload);
      void queryClient.invalidateQueries({ queryKey: ["my-consultations"] });
      void queryClient.invalidateQueries({ queryKey: ["consultations"] });
    });

    socketInstance.on("appointment_updated", (payload) => {
      console.log("[Socket] Appointment updated event received:", payload);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, queryClient]);

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

/**
 * Custom hook to listen to custom socket events easily in components
 */
export const useSocketEvent = <T,>(
  eventName: string,
  handler: (data: T) => void,
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
};
