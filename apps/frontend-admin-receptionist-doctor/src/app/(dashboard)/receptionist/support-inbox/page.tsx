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
  Paperclip,
  ArrowBendUpLeft,
  X,
} from "@phosphor-icons/react";
import {
  claimConversation,
  closeConversation,
  getConversationMessages,
  listMyConversations,
  listUnclaimedConversations,
  markConversationRead,
  sendConversationMessage,
  sendConversationAttachment,
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
  const [fileError, setFileError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<SupportMessage | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const { socket } = useSupportSocketContext();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setReplyingTo(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) => sendConversationMessage(activeId as string, content, replyToId),
    onSuccess: (message) => {
      queryClient.setQueryData<SupportMessage[]>(["support", "messages", message.conversationId],
        (prev) => prev?.some((item) => item.id === message.id) ? prev : [...(prev ?? []), message]);
      setReplyingTo(null);
    },
    onError: (_error, variables) => setDraft(variables.content),
  });

  const attachmentMutation = useMutation({
    mutationFn: ({ file, replyToId }: { file: File; replyToId?: string }) => sendConversationAttachment(activeId as string, file, replyToId),
    onSuccess: (message) => {
      queryClient.setQueryData<SupportMessage[]>(["support", "messages", message.conversationId],
        (prev) => prev?.some((item) => item.id === message.id) ? prev : [...(prev ?? []), message]);
      setReplyingTo(null);
    },
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
    function rejoin() {
      socket?.emit("support:join", { conversationId: activeId });
      void queryClient.invalidateQueries({ queryKey: ["support", "messages", activeId] });
    }
    rejoin();
    socket.on("connect", rejoin);
    void markConversationRead(activeId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
    });
    return () => {
      socket.off("connect", rejoin);
      socket.emit("support:leave", { conversationId: activeId });
    };
  }, [socket, activeId, queryClient]);

  // List refetching on 'support:new'/'claimed'/'requeued'/'message' is
  // already handled by SupportSocketProvider (shared query cache); this page
  // only needs to append live messages to whichever thread is open.
  useEffect(() => {
    if (!socket) return;

    function onMessage(message: SupportMessage) {
      if (message.conversationId !== activeId) return;
      queryClient.setQueryData<SupportMessage[]>(
        ["support", "messages", message.conversationId],
        (prev) => (prev?.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message]),
      );
    }

    socket.on("support:message", onMessage);
    return () => {
      socket.off("support:message", onMessage);
    };
  }, [socket, queryClient, activeId]);

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
    sendMutation.mutate({ content: value, replyToId: replyingTo?.id });
  }

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeId) return;
    if (file.size > 4 * 1024 * 1024) {
      setFileError("Tệp tối đa 4 MB.");
      return;
    }
    setFileError(null);
    attachmentMutation.mutate({ file, replyToId: replyingTo?.id });
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
                onClick={() => { setActiveId(conversation.id); setReplyingTo(null); }}
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
                          ? "group ml-auto max-w-[90%]"
                          : "group max-w-[90%]"
                    }
                  >
                    {message.senderType === "SYSTEM" ? (
                      <p className="text-[11px] italic text-muted-foreground">{message.content}</p>
                    ) : (
                      <div className={`flex items-center gap-2 ${message.senderType === "STAFF" ? "flex-row-reverse" : ""}`}>
                      <div
                        onPointerDown={(event) => {
                          if (event.pointerType === "touch") setActiveMessageId((current) => current === message.id ? null : message.id);
                        }}
                        className={`min-w-0 rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          message.senderType === "STAFF"
                            ? "rounded-tr-sm bg-brand text-white"
                            : "rounded-tl-sm border border-border bg-white text-foreground"
                        }`}
                      >
                        {message.replyToId && <div className="mb-2 rounded-lg border-l-2 border-current bg-black/5 px-2 py-1 text-xs opacity-80"><strong>Trả lời {message.replySenderType === "PATIENT" ? "bệnh nhân" : "lễ tân"}</strong><p className="line-clamp-2">{message.replyPreview}</p></div>}
                        {message.attachmentUrl ? (
                          message.attachmentMime?.startsWith("image/") ? (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={message.attachmentUrl} alt={message.attachmentName || "Ảnh đính kèm"} className="max-h-60 max-w-full rounded-lg object-contain" />
                            </a>
                          ) : (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline"><Paperclip size={16} />{message.attachmentName || "Tệp đính kèm"}</a>
                          )
                        ) : message.content}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(message); setActiveMessageId(null); }}
                        aria-label={`Trả lời tin nhắn ${message.content || message.attachmentName || "đính kèm"}`}
                        title="Trả lời"
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-brand shadow-sm transition hover:bg-muted focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand ${activeMessageId === message.id ? "opacity-100" : "opacity-0 [@media(hover:hover)]:group-hover:opacity-100"}`}
                      >
                        <ArrowBendUpLeft size={16} weight="bold" />
                      </button>
                      </div>
                    )}
                    <time dateTime={message.createdAt} className={`mt-1 block text-[10px] text-muted-foreground ${message.senderType === "STAFF" ? "text-right" : "text-left"}`}>
                      {new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {(sendMutation.isError || attachmentMutation.isError || fileError) && <p role="alert" className="px-3 text-xs text-red-600">{fileError || "Không gửi được tin nhắn hoặc tệp. Vui lòng thử lại."}</p>}
              {replyingTo && <div className="flex items-center gap-2 border-t border-border bg-white px-3 py-2 text-xs text-muted-foreground"><ArrowBendUpLeft size={18} className="text-brand" /><div className="min-w-0 flex-1"><strong>Đang trả lời {replyingTo.senderType === "PATIENT" ? "bệnh nhân" : "lễ tân"}</strong><p className="truncate">{replyingTo.content || replyingTo.attachmentName}</p></div><button type="button" aria-label="Bỏ trả lời" onClick={() => setReplyingTo(null)}><X size={18} /></button></div>}
              <form onSubmit={submit} className="flex gap-2 border-t border-border bg-white p-3">
                <input ref={fileInputRef} type="file" className="hidden" onChange={chooseFile} />
                <button type="button" title="Gửi ảnh hoặc file" aria-label="Gửi ảnh hoặc file" disabled={isClosed || tab !== "mine" || attachmentMutation.isPending} onClick={() => fileInputRef.current?.click()} className="text-brand disabled:opacity-40"><Paperclip size={20} /></button>
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
