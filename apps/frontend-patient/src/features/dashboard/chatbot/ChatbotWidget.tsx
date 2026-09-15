"use client";

import type { FormEvent } from "react";
import { useState, useRef, useEffect } from "react";
import apiClient from "@/lib/axios";
import { DashboardIcon } from "../common/DashboardIcon";

import { useAppSelector } from "@/providers";

type ChatMessage = {
  id: number;
  sender: "bot" | "user";
  text: string;
  metadata?: Record<string, unknown>;
  suggestions?: ChatSuggestion[];
};

type ChatSuggestion = {
  type: "quick_reply" | "service" | "time_slot" | "date" | string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
};

type ChatbotApiPayload = {
  reply?: string;
  suggestions?: ChatSuggestion[];
  data?: ChatbotApiPayload;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "bot",
    text: "Xin chào! Tôi là Trợ lý Nha khoa AI Smart Dental 🦷. Tôi có thể giúp bạn tư vấn dịch vụ, báo giá và tự động ĐẶT LỊCH HẸN khám online ngay!",
  },
];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(2);

  const { isAuthenticated, accessToken } = useAppSelector(
    (state) => state.login
  );
  const isLoggedIn = isAuthenticated && Boolean(accessToken);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const nextMessageId = () => {
    const id = messageIdRef.current;
    messageIdRef.current += 1;
    return id;
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, loading, open]);

  async function handleSendMessage(
    textToSend: string,
    metadata?: Record<string, unknown>,
  ) {
    const value = textToSend.trim();
    if (!value || loading) return;

    const userMessage: ChatMessage = {
      id: nextMessageId(),
      sender: "user",
      text: value,
      metadata,
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      // Map message history format for backend
      const historyPayload = updatedHistory.slice(-8).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
        metadata: m.metadata || {},
      }));

      let res: ChatbotApiPayload;
      if (isLoggedIn) {
        try {
          res = await apiClient.post("/chatbot-conversations/agent-chat", {
            message: value,
            history: historyPayload,
            metadata: metadata || {},
          });
        } catch {
          res = await apiClient.post("/chatbot-conversations/public-agent-chat", {
            message: value,
            history: historyPayload,
            metadata: metadata || {},
          });
        }
      } else {
        res = await apiClient.post("/chatbot-conversations/public-agent-chat", {
          message: value,
          history: historyPayload,
          metadata: metadata || {},
        });
      }

      const botReply =
        res?.reply ||
        res?.data?.reply ||
        res?.data?.data?.reply ||
        "Xin lỗi, trợ lý AI đang quá tải. Quý khách vui lòng thử lại sau giây lát nhé!";
      const suggestions =
        res?.suggestions ||
        res?.data?.suggestions ||
        res?.data?.data?.suggestions ||
        [];

      setMessages((curr) => [
        ...curr,
        {
          id: nextMessageId(),
          sender: "bot",
          text: botReply,
          suggestions,
        },
      ]);
    } catch {
      setMessages((curr) => [
        ...curr,
        {
          id: nextMessageId(),
          sender: "bot",
          text: "Xin lỗi, không thể kết nối tới máy chủ AI. Quý khách vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau nhé!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSendMessage(input);
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-2.5 flex h-[430px] sm:h-[500px] max-h-[calc(100dvh-130px)] w-[calc(100vw-28px)] max-w-[335px] sm:max-w-[370px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_16px_50px_rgba(15,43,82,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <header className="flex items-center justify-between bg-gradient-to-r from-[#0863c5] via-[#0779da] to-[#0782d8] px-3.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-white/15 backdrop-blur-md">
                <DashboardIcon name="sparkles" className="h-4 w-4 text-amber-300" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0782d8] bg-emerald-400" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-bold tracking-tight">Trợ lý AI Đặt Lịch</h2>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] sm:text-[10px] text-blue-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng 24/7 · Smart Dental AI
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng chatbot"
              className="grid h-7 w-7 place-items-center rounded-lg text-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#f8fafc] p-3 text-xs sm:p-4 sm:space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.sender === "bot" ? "max-w-[94%]" : "ml-auto max-w-[88%]"}
              >
                <div
                  className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[11px] sm:text-xs leading-relaxed shadow-xs ${
                    message.sender === "bot"
                      ? "rounded-tl-xs border border-slate-100 bg-white text-slate-700"
                      : "rounded-tr-xs bg-gradient-to-r from-[#0863c5] to-[#0779da] text-white"
                  }`}
                >
                  {message.text}
                </div>

                {message.sender === "bot" && Boolean(message.suggestions?.length) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {message.suggestions?.map((suggestion, index) => (
                      <button
                        key={`${message.id}-${suggestion.type}-${index}`}
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          handleSendMessage(suggestion.value, suggestion.metadata)
                        }
                        className={`min-h-7 rounded-full border px-2.5 py-1 text-left text-[10px] sm:text-[11px] font-semibold leading-snug shadow-xs transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                          suggestion.type === "time_slot"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                            : suggestion.type === "service"
                              ? "border-blue-200 bg-white text-[#0863c5] hover:border-blue-400 hover:bg-blue-50"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-[#0863c5]"
                        }`}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 max-w-[85%] rounded-2xl rounded-tl-xs border border-blue-50 bg-white px-3.5 py-2.5 text-slate-500 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[10px] italic text-slate-400">Trợ lý AI đang tra cứu...</span>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Đặt lịch khám ngày mai",
                  "Cạo vôi răng bao nhiêu?",
                  "Tư vấn niềng răng",
                  "Giờ làm việc phòng khám",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-[#0863c5] shadow-xs transition hover:border-blue-400 hover:bg-blue-50 active:scale-95"
                  >
                    💡 {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={onSubmit} className="flex gap-1.5 border-t border-slate-100 bg-white p-2.5">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập yêu cầu đặt lịch hoặc thắc mắc..."
              aria-label="Tin nhắn"
              disabled={loading}
              className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-[11px] sm:text-xs outline-none transition focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Gửi tin nhắn"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0863c5] text-white transition hover:bg-[#0756aa] disabled:opacity-40 active:scale-95"
            >
              <DashboardIcon name="send" className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>
      )}

      {/* Trigger Floating Button */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Đóng trợ lý nha khoa" : "Mở trợ lý nha khoa AI"}
        aria-expanded={open}
        className="relative ml-auto grid h-11 w-11 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#0863c5] to-[#0782d8] text-white shadow-[0_10px_25px_rgba(8,99,197,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-blue-500/40 active:scale-95"
      >
        <DashboardIcon name={open ? "chevron" : "chat"} className={`h-5 w-5 sm:h-6 sm:w-6 ${open ? "-rotate-90" : ""}`} />
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" />
          </span>
        )}
      </button>
    </div>
  );
}
