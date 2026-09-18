"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/src/components/layout/header";
import {
  ChatCircleDots,
  PaperPlaneTilt,
  UserCircle,
  CheckCircle,
  Clock,
  Tray,
} from "@phosphor-icons/react";
import {
  claimConversation,
  closeConversation,
  getConversationMessages,
  listMyConversations,
  listUnclaimedConversations,
  markConversationRead,
  sendConversationMessage,
  type SupportConversation,
  type SupportMessage,
} from "@/src/features/support-inbox/api";
import { useSupportSocketContext } from "@/src/features/support-inbox/SupportSocketProvider";

type Tab = "unclaimed" | "mine";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

function ConversationCard({
  conversation,
  active,
  onClick,
  actionLabel,
  onAction,
  actionPending,
}: {
  conversation: SupportConversation;
  active: boolean;
  onClick: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionPending?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-3 transition ${
        active ? "border-brand bg-brand-light" : "border-border bg-white hover:bg-muted"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {conversation.patient.fullName || "Khách hàng"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {conversation.patient.phone || conversation.patient.email || ""}
          </p>
        </div>
        {Boolean(conversation.unreadCount) && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock size={11} />
          {timeAgo(conversation.lastMessageAt)}
        </span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            disabled={actionPending}
            className="rounded-lg bg-brand px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {actionPending ? "Đang nhận..." : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SupportInboxPage() {
  const [tab, setTab] = useState<Tab>("unclaimed");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const { socket } = useSupportSocketContext();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

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

  const messagesQuery = useQuery({
    queryKey: ["support", "messages", activeId],
    queryFn: () => getConversationMessages(activeId as string),
    enabled: Boolean(activeId),
  });

  const claimMutation = useMutation({
    mutationFn: claimConversation,
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: ["support", "unclaimed"] });
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
      setTab("mine");
      setActiveId(conversation.id);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendConversationMessage(activeId as string, content),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeConversation(activeId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
      setActiveId(null);
    },
  });

  // Join/leave the socket room for whichever conversation is open, and mark
  // it read for the receptionist viewing it.
  useEffect(() => {
    if (!socket || !activeId) return;
    socket.emit("support:join", { conversationId: activeId });
    void markConversationRead(activeId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
    });
    return () => {
      socket.emit("support:leave", { conversationId: activeId });
    };
  }, [socket, activeId, queryClient]);

  // List refetching on 'support:new'/'claimed'/'requeued'/'message' is
  // already handled by SupportSocketProvider (shared query cache); this page
  // only needs to append live messages to whichever thread is open.
  useEffect(() => {
    if (!socket) return;

    function onMessage(message: SupportMessage) {
      if (message.conversationId !== activeIdRef.current) return;
      queryClient.setQueryData<SupportMessage[]>(
        ["support", "messages", message.conversationId],
        (prev) => (prev?.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message]),
      );
    }

    socket.on("support:message", onMessage);
    return () => {
      socket.off("support:message", onMessage);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const list = tab === "unclaimed" ? unclaimedQuery.data ?? [] : mineQuery.data ?? [];
  const activeConversation = list.find((c) => c.id === activeId) ?? null;
  const isClosed = activeConversation?.status === "CLOSED";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || !activeId) return;
    setDraft("");
    sendMutation.mutate(value);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header title="Hỗ trợ khách hàng" description="Hội thoại bệnh nhân yêu cầu lễ tân hỗ trợ trực tiếp" />

      <div className="flex min-h-0 flex-1 bg-muted">
        {/* Conversation list */}
        <div className="flex w-full max-w-xs shrink-0 flex-col border-r border-border bg-white">
          <div className="flex border-b border-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab("unclaimed")}
              className={`flex-1 px-3 py-2.5 transition ${
                tab === "unclaimed" ? "border-b-2 border-brand text-brand" : "text-muted-foreground"
              }`}
            >
              Chưa xử lý {unclaimedQuery.data?.length ? `(${unclaimedQuery.data.length})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`flex-1 px-3 py-2.5 transition ${
                tab === "mine" ? "border-b-2 border-brand text-brand" : "text-muted-foreground"
              }`}
            >
              Của tôi {mineQuery.data?.length ? `(${mineQuery.data.length})` : ""}
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
            {list.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                <Tray size={28} />
                <p className="text-xs">
                  {tab === "unclaimed" ? "Không có yêu cầu nào đang chờ" : "Bạn chưa phụ trách hội thoại nào"}
                </p>
              </div>
            )}
            {list.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onClick={() => setActiveId(conversation.id)}
                actionLabel={tab === "unclaimed" ? "Nhận xử lý" : undefined}
                actionPending={claimMutation.isPending && claimMutation.variables === conversation.id}
                onAction={
                  tab === "unclaimed" ? () => claimMutation.mutate(conversation.id) : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ChatCircleDots size={32} />
              <p className="text-sm">Chọn một hội thoại để bắt đầu</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <UserCircle size={28} className="text-brand" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {activeConversation.patient.fullName || "Khách hàng"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {activeConversation.patient.phone || activeConversation.patient.email || ""}
                    </p>
                  </div>
                </div>
                {tab === "mine" && !isClosed && (
                  <button
                    type="button"
                    onClick={() => closeMutation.mutate()}
                    disabled={closeMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                  >
                    <CheckCircle size={13} />
                    Đóng hội thoại
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-8">
                {(messagesQuery.data ?? []).map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.senderType === "SYSTEM"
                        ? "mx-auto max-w-[80%] text-center"
                        : message.senderType === "STAFF"
                          ? "ml-auto max-w-[70%]"
                          : "max-w-[70%]"
                    }
                  >
                    {message.senderType === "SYSTEM" ? (
                      <p className="text-[11px] italic text-muted-foreground">{message.content}</p>
                    ) : (
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          message.senderType === "STAFF"
                            ? "rounded-tr-sm bg-brand text-white"
                            : "rounded-tl-sm border border-border bg-white text-foreground"
                        }`}
                      >
                        {message.content}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={submit} className="flex gap-2 border-t border-border bg-white p-3">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={isClosed ? "Hội thoại đã đóng" : "Nhập tin nhắn..."}
                  disabled={isClosed || tab !== "mine"}
                  className="h-10 flex-1 rounded-xl border border-border bg-muted px-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isClosed || tab !== "mine" || !draft.trim() || sendMutation.isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PaperPlaneTilt size={16} weight="fill" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
