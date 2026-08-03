"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { DashboardIcon } from "../common/DashboardIcon";

type ChatMessage = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "bot",
    text: "Xin chào An! Tôi là trợ lý nha khoa AI. Tôi có thể giúp bạn đặt lịch hoặc giải đáp thắc mắc.",
  },
];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: "user", text: value },
      {
        id: Date.now() + 1,
        sender: "bot",
        text: "Tôi đã ghi nhận câu hỏi. Chuyên gia DentaCare sẽ hỗ trợ bạn chi tiết hơn ngay khi kết nối API.",
      },
    ]);
    setInput("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-4 flex h-[500px] max-h-[calc(100dvh-120px)] w-[calc(100vw-40px)] max-w-[370px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_24px_70px_rgba(15,43,82,0.22)]">
          <header className="flex items-center justify-between bg-gradient-to-r from-[#0863c5] to-[#0782d8] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <DashboardIcon name="sparkles" className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0782d8] bg-emerald-400" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Trợ lý nha khoa AI</h2>
                <p className="mt-0.5 text-[10px] text-blue-100">Trực tuyến · Phản hồi ngay</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng chatbot"
              className="grid h-8 w-8 place-items-center rounded-lg text-xl text-white/80 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${
                  message.sender === "bot"
                    ? "rounded-tl-sm bg-white text-slate-600 shadow-sm"
                    : "ml-auto rounded-tr-sm bg-[#0863c5] text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {["Đặt lịch khám", "Tư vấn đau răng", "Xem dịch vụ"].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#0863c5] hover:bg-blue-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập câu hỏi..."
              aria-label="Tin nhắn"
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#0863c5] focus:ring-3 focus:ring-blue-100"
            />
            <button
              type="submit"
              aria-label="Gửi tin nhắn"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0863c5] text-white hover:bg-[#0756aa]"
            >
              <DashboardIcon name="send" className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Đóng trợ lý nha khoa" : "Mở trợ lý nha khoa"}
        aria-expanded={open}
        className="ml-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0863c5] text-white shadow-[0_12px_30px_rgba(8,99,197,0.38)] transition hover:-translate-y-1 hover:bg-[#0756aa]"
      >
        <DashboardIcon name={open ? "chevron" : "chat"} className={`h-6 w-6 ${open ? "-rotate-90" : ""}`} />
      </button>
    </div>
  );
}
