"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function getSocketUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  return raw.replace(/\/api\/v1\/?$/, "");
}

/**
 * Low-level socket connection. Mounted once by `SupportSocketProvider` for
 * the whole receptionist session — don't call this directly from a page, or
 * you'll open a second, redundant connection.
 */
export function useSupportSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!getCookie("access_token")) return;

    const instance = io(getSocketUrl(), {
      // A function (not a static object) so Socket.IO re-reads the cookie on
      // every reconnect attempt. The access token expires every 15 minutes
      // and gets silently refreshed by the axios interceptor on ordinary API
      // calls, but a *static* auth value would keep using the token that was
      // current when the socket first connected — after one silent refresh,
      // any later reconnect (network blip, laptop sleep, etc.) would
      // present an already-expired token and the receptionist would quietly
      // stop being tracked as "online" until they reload the page.
      auth: (cb) => cb({ token: getCookie("access_token") }),
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = instance;
    setSocket(instance);

    return () => {
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  return socket;
}
