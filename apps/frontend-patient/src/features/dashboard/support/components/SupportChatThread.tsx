"use client";

import { useState, type FormEvent, type RefObject } from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import type { SupportConversation, SupportMessage } from "../api";

const STARTER_PROMPTS = [
  "Tôi muốn đặt lịch khám",
  "Chi phí dịch vụ như thế nào?",
  "Tư vấn tình trạng răng miệng",
  "Giờ làm việc phòng khám",
];

export type SupportChatThreadVariant = "compact" | "full";

type Props = {
  conversation: SupportConversation | null;
  messages: SupportMessage[];
  loading: boolean;
  sending: boolean;
  onSend: (content: string) => Promise<void>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  variant?: SupportChatThreadVariant;
};

export function SupportChatThread({
  conversation,
  messages,
  loading,
  sending,
  onSend,
  messagesEndRef,
  variant = "full",
}: Props) {
  const [text, setText] = useState("");
  const isClosed = conversation?.status === "CLOSED";
  const isEmpty = !loading && messages.length === 0;
  const compact = variant === "compact";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || isClosed) return;
    const value = text;
    setText("");
    void onSend(value);
  }

  function sendPrompt(prompt: string) {
    if (isClosed) return;
    void onSend(prompt);
  }

  return (
    <>
      <div
        className={`flex-1 overflow-y-auto bg-[#f6faf9] ${
          compact ? "space-y-2.5 p-3 text-xs sm:p-4 sm:space-y-3" : "space-y-4 px-4 py-6 sm:px-8"
        }`}
      >
        {loading && (
          <div className={`text-center text-slate-400 ${compact ? "py-6 text-[11px]" : "py-10 text-sm"}`}>
            Đang tải hội thoại...
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center py-4 text-center">
            <span
              className={`grid place-items-center rounded-full bg-gradient-to-br from-[#0863c5] to-[#0058bc] text-white shadow-md ${
                compact ? "h-14 w-14" : "h-20 w-20"
              }`}
            >
              <DashboardIcon name="headset" className={compact ? "h-6 w-6" : "h-9 w-9"} />
            </span>
            <h3 className={`mt-3 font-black text-slate-900 ${compact ? "text-sm" : "text-xl"}`}>
              Chào bạn! 👋
            </h3>
            <p className={`mt-1.5 max-w-xs text-slate-500 ${compact ? "text-[11px]" : "text-sm"}`}>
              Mình là lễ tân hỗ trợ trực tuyến. Bạn có thể hỏi về lịch hẹn, chi phí, dịch vụ hoặc bất kỳ thắc mắc nào khác.
            </p>

            <div className={`mt-4 flex flex-wrap justify-center gap-2 ${compact ? "max-w-[280px]" : "max-w-md"}`}>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendPrompt(prompt)}
                  className={`rounded-full border border-blue-200 bg-white font-semibold text-[#0058bc] shadow-xs transition hover:border-blue-400 hover:bg-blue-50 active:scale-95 ${
                    compact ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-xs"
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && !isEmpty && conversation?.status === "WAITING" && (
          <div
            className={`rounded-2xl border border-amber-100 bg-amber-50 text-amber-700 ${
              compact ? "px-3.5 py-2.5 text-[11px]" : "px-4 py-3 text-sm"
            }`}
          >
            Yêu cầu của bạn đã được ghi nhận. Lễ tân sẽ tham gia hội thoại trong giây lát.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.senderType === "SYSTEM"
                ? "mx-auto max-w-[90%] text-center"
                : message.senderType === "PATIENT"
                  ? `ml-auto ${compact ? "max-w-[88%]" : "max-w-[80%]"}`
                  : `${compact ? "max-w-[94%]" : "max-w-[80%]"}`
            }
          >
            {message.senderType === "SYSTEM" ? (
              <p className={`italic text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
                {message.content}
              </p>
            ) : (
              <div
                className={`whitespace-pre-line rounded-2xl leading-relaxed shadow-xs ${
                  compact ? "px-3.5 py-2.5 text-[11px] sm:text-xs" : "px-4 py-3 text-sm"
                } ${
                  message.senderType === "PATIENT"
                    ? "rounded-tr-sm bg-gradient-to-r from-[#0863c5] to-[#0779da] text-white"
                    : "rounded-tl-sm border border-slate-100 bg-white text-slate-700"
                }`}
              >
                {message.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={submit}
        className={`flex gap-2 border-t border-slate-100 bg-white ${compact ? "gap-1.5 p-2.5" : "p-3 sm:p-4"}`}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={isClosed ? "Hội thoại đã kết thúc" : "Nhập tin nhắn..."}
          aria-label="Tin nhắn cho lễ tân"
          disabled={isClosed || loading}
          className={`min-w-0 flex-1 rounded-xl border border-slate-200 outline-none transition focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100 disabled:opacity-50 ${
            compact ? "h-9 px-3 text-[11px] sm:text-xs" : "h-11 px-4 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={sending || isClosed || loading || !text.trim()}
          aria-label="Gửi tin nhắn"
          className={`grid shrink-0 place-items-center rounded-xl bg-[#0863c5] text-white transition hover:bg-[#0756aa] disabled:opacity-40 active:scale-95 ${
            compact ? "h-9 w-9" : "h-11 w-11"
          }`}
        >
          <DashboardIcon name="send" className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </form>
    </>
  );
}
