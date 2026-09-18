"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/providers";
import { DashboardIcon } from "../../common/DashboardIcon";
import { useSupportChat } from "../useSupportChat";
import { SupportChatThread } from "./SupportChatThread";
import type { SupportConversationStatus } from "../api";

function statusLabel(status?: SupportConversationStatus, staffName?: string) {
  if (!status) return "Hỏi lễ tân bất cứ điều gì";
  if (status === "WAITING") return "Đang chờ lễ tân tiếp nhận...";
  if (status === "ASSIGNED") return `Đang trao đổi với ${staffName || "lễ tân"}`;
  return "Hội thoại đã kết thúc";
}

/**
 * "Tư vấn" chat with reception — a full-screen overlay on mobile (opened
 * from the bottom nav's "Tư vấn" button) and a compact floating panel on
 * desktop (opened from its own bubble, like the AI widget). Both share one
 * `useSupportChat()` connection and the same `SupportChatThread` content;
 * only the surrounding chrome differs by breakpoint. It's deliberately an
 * overlay rather than a routed page — a real page would render inside the
 * dashboard's own header/footer, which looked out of place for what should
 * read as an in-place chat panel.
 */
export function SupportChatOverlay() {
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const { isAuthenticated, accessToken } = useAppSelector((state) => state.login);
  const isLoggedIn = isAuthenticated && Boolean(accessToken);

  const { conversation, messages, loading, sending, start, send } = useSupportChat();

  function openPanel() {
    if (!isLoggedIn) {
      window.location.href = "/auth/login";
      return;
    }
    setOpen(true);
    if (!startedRef.current) {
      startedRef.current = true;
      void start();
    }
  }

  useEffect(() => {
    window.addEventListener("open-support-chat", openPanel);
    return () => window.removeEventListener("open-support-chat", openPanel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPanel}
        aria-label="Tư vấn trực tiếp với lễ tân"
        className="fixed bottom-24 right-7 z-50 hidden h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#0863c5] to-[#0058bc] text-white shadow-[0_10px_25px_rgba(8,99,197,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-blue-500/40 active:scale-95 md:grid"
      >
        <DashboardIcon name="headset" className="h-6 w-6" />
      </button>
    );
  }

  const status = statusLabel(conversation?.status, conversation?.assignedTo?.fullName);

  return (
    <>
      {/* Mobile: full-screen takeover, no dashboard header/footer around it */}
      <div className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-3 py-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Quay lại"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            <DashboardIcon name="chevron" className="h-4 w-4 rotate-180" />
          </button>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0863c5] to-[#0058bc] text-white shadow-sm">
            <DashboardIcon name="headset" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-black text-slate-950">Tư vấn</h1>
            <p className="mt-0.5 truncate text-xs text-slate-500">{status}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </header>

        <SupportChatThread
          conversation={conversation}
          messages={messages}
          loading={loading}
          sending={sending}
          onSend={send}
          messagesEndRef={messagesEndRef}
          variant="full"
        />
      </div>

      {/* Desktop: compact floating panel, same spot as the AI bubble */}
      <div className="fixed bottom-24 right-7 z-50 hidden md:flex md:flex-col md:items-end">
        <section className="mb-2.5 flex h-[500px] max-h-[calc(100dvh-130px)] w-[370px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_16px_50px_rgba(15,43,82,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <header className="flex items-center justify-between bg-gradient-to-r from-[#0863c5] via-[#0779da] to-[#0058bc] px-4 py-3 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur-md">
                <DashboardIcon name="headset" className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0863c5] bg-emerald-400" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-tight">Tư vấn Lễ tân</h2>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-blue-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {status}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="grid h-7 w-7 place-items-center rounded-lg text-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </header>

          <SupportChatThread
            conversation={conversation}
            messages={messages}
            loading={loading}
            sending={sending}
            onSend={send}
            messagesEndRef={messagesEndRef}
            variant="compact"
          />
        </section>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng tư vấn lễ tân"
          className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#0863c5] to-[#0058bc] text-white shadow-[0_10px_25px_rgba(8,99,197,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-blue-500/40 active:scale-95"
        >
          <DashboardIcon name="chevron" className="h-6 w-6 -rotate-90" />
        </button>
      </div>
    </>
  );
}
