"use client";

import { useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowBendUpLeft, Paperclip, X } from "@phosphor-icons/react";
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
  onSend: (content: string, replyToId?: string) => Promise<void>;
  onSendAttachment: (file: File, replyToId?: string) => Promise<void>;
  error: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  variant?: SupportChatThreadVariant;
};

export function SupportChatThread({
  conversation,
  messages,
  loading,
  sending,
  onSend,
  onSendAttachment,
  error,
  messagesEndRef,
  variant = "full",
}: Props) {
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<SupportMessage | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isClosed = conversation?.status === "CLOSED";
  const isEmpty = !loading && messages.length === 0;
  const compact = variant === "compact";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || isClosed) return;
    const value = text;
    setText("");
    void onSend(value, replyingTo?.id).then(() => setReplyingTo(null)).catch(() => setText(value));
  }

  function sendPrompt(prompt: string) {
    if (isClosed) return;
    void onSend(prompt).catch(() => setText(prompt));
  }

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFileError("Tệp tối đa 4 MB.");
      return;
    }
    setFileError(null);
    void onSendAttachment(file, replyingTo?.id).then(() => setReplyingTo(null)).catch(() => {});
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
                  ? `group ml-auto ${compact ? "max-w-[94%]" : "max-w-[90%]"}`
                  : `group ${compact ? "max-w-[94%]" : "max-w-[90%]"}`
            }
          >
            {message.senderType === "SYSTEM" ? (
              <p className={`italic text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
                {message.content}
              </p>
            ) : (
              <div className={`flex items-center gap-2 ${message.senderType === "PATIENT" ? "flex-row-reverse" : ""}`}>
              <div
                onPointerDown={(event) => {
                  if (event.pointerType === "touch") setActiveMessageId((current) => current === message.id ? null : message.id);
                }}
                className={`min-w-0 whitespace-pre-line rounded-2xl leading-relaxed shadow-xs ${
                  compact ? "px-3.5 py-2.5 text-[11px] sm:text-xs" : "px-4 py-3 text-sm"
                } ${
                  message.senderType === "PATIENT"
                    ? "rounded-tr-sm bg-gradient-to-r from-[#0863c5] to-[#0779da] text-white"
                    : "rounded-tl-sm border border-slate-100 bg-white text-slate-700"
                }`}
              >
                {message.replyToId && (
                  <div className="mb-2 rounded-lg border-l-2 border-current bg-black/5 px-2 py-1 text-[10px] opacity-80">
                    <span className="block font-semibold">Trả lời {message.replySenderType === "PATIENT" ? "bệnh nhân" : "lễ tân"}</span>
                    <span className="line-clamp-2">{message.replyPreview}</span>
                  </div>
                )}
                {message.attachmentUrl ? (
                  message.attachmentMime?.startsWith("image/") ? (
                    <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" aria-label={`Mở ảnh ${message.attachmentName || "đính kèm"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={message.attachmentUrl} alt={message.attachmentName || "Ảnh đính kèm"} className="max-h-52 max-w-full rounded-lg object-contain" />
                    </a>
                  ) : (
                    <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                      <DashboardIcon name="document" className="h-4 w-4" />{message.attachmentName || "Tệp đính kèm"}
                    </a>
                  )
                ) : message.content}
              </div>
              <button
                type="button"
                onClick={() => { setReplyingTo(message); setActiveMessageId(null); }}
                aria-label={`Trả lời tin nhắn ${message.content || message.attachmentName || "đính kèm"}`}
                title="Trả lời"
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#0863c5] shadow-sm transition hover:bg-blue-50 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#0863c5] ${activeMessageId === message.id ? "opacity-100" : "opacity-0 [@media(hover:hover)]:group-hover:opacity-100"}`}
              >
                <ArrowBendUpLeft size={16} weight="bold" />
              </button>
              </div>
            )}
            <time dateTime={message.createdAt} className={`mt-1 block text-[10px] text-slate-400 ${message.senderType === "PATIENT" ? "text-right" : "text-left"}`}>
              {new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </time>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {(error || fileError) && <p role="alert" className="bg-white px-3 pt-2 text-xs text-red-600">{fileError || error}</p>}
      {replyingTo && <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2 text-xs text-slate-600"><ArrowBendUpLeft size={16} className="text-[#0863c5]" /><div className="min-w-0 flex-1"><strong>Đang trả lời {replyingTo.senderType === "PATIENT" ? "bệnh nhân" : "lễ tân"}</strong><p className="truncate">{replyingTo.content || replyingTo.attachmentName}</p></div><button type="button" aria-label="Bỏ trả lời" onClick={() => setReplyingTo(null)}><X size={16} /></button></div>}
      <form
        onSubmit={submit}
        className={`flex gap-2 border-t border-slate-100 bg-white ${compact ? "gap-1.5 p-2.5" : "p-3 sm:p-4"}`}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={chooseFile} />
        <button type="button" aria-label="Gửi ảnh hoặc file" title="Gửi ảnh hoặc file" disabled={sending || isClosed || loading} onClick={() => fileInputRef.current?.click()} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#0863c5] hover:bg-blue-50 disabled:opacity-40"><Paperclip size={18} /></button>
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
