"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppSelector } from "@/providers";
import { DashboardIcon } from "../common/DashboardIcon";
import { ChatMessageContent } from "./ChatMessageContent";
import { ChatSuggestions } from "./ChatSuggestions";
import { chatIdentity, MAX_INPUT } from "./model";
import { usePatientChat } from "./usePatientChat";

const quickPrompts = ["Đặt lịch khám ngày mai", "Cạo vôi răng bao nhiêu?", "Tư vấn niềng răng", "Giờ làm việc phòng khám"];

export function ChatbotWidget() {
  const identity = useAppSelector((state) => chatIdentity(state.login));
  return <PatientChatPanel key={identity} identity={identity} />;
}

function PatientChatPanel({ identity }: { identity: string }) {
  const chat = usePatientChat(identity);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [open, chat.messages, chat.loading, chat.historyError]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = input.trim();
    if (!value || !chat.canSend) return;
    setInput("");
    await chat.send(value);
  }

  const disabled = !chat.canSend;
  const latest = chat.messages.at(-1);

  return (
    <div className="fixed bottom-20 right-3 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-2.5 flex h-[430px] max-h-[calc(100dvh-130px)] w-[calc(100vw-28px)] max-w-[335px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_16px_50px_rgba(15,43,82,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-200 sm:h-[500px] sm:max-w-[370px]">
          <header className="flex items-center justify-between bg-gradient-to-r from-[#0863c5] via-[#0779da] to-[#0782d8] px-3.5 py-2.5 text-white shadow-md sm:px-4 sm:py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-white/15 sm:h-9 sm:w-9"><DashboardIcon name="sparkles" className="h-4 w-4 text-amber-300" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0782d8] bg-emerald-400" /></span>
              <div><h2 className="text-xs font-bold tracking-tight sm:text-sm">Trợ lý AI Đặt Lịch</h2><p className="mt-0.5 text-[9px] text-blue-100 sm:text-[10px]">Sẵn sàng 24/7 · Smart Dental AI</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chatbot" className="grid h-7 w-7 place-items-center rounded-lg text-lg text-white/80 hover:bg-white/10 hover:text-white">×</button>
          </header>

          {chat.authenticated && <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500 sm:px-4"><span>{chat.historyError ? "Lịch sử chưa đồng bộ" : "Lịch sử trong tài khoản"}</span><button type="button" disabled={chat.busy} onClick={() => void chat.clear()} className="font-semibold text-[#0863c5] disabled:opacity-40">Xóa lịch sử</button></div>}

          <div ref={messagesRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#f8fafc] p-3 text-xs sm:space-y-3 sm:p-4">
            {chat.messages.length === 0 && <div className="rounded-2xl border border-slate-100 bg-white p-3 text-slate-700 shadow-xs"><p className="font-semibold">Xin chào! Tôi có thể giúp gì cho bạn?</p><p className="mt-1.5 leading-relaxed text-slate-500">Tư vấn dịch vụ, báo giá, thông tin phòng khám hoặc đặt lịch khám.</p><div className="mt-2.5 flex flex-wrap gap-1.5">{quickPrompts.map((prompt) => <button key={prompt} type="button" disabled={disabled} onClick={() => { setInput(prompt); void chat.send(prompt); }} className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0863c5] hover:bg-blue-50 disabled:opacity-40">💡 {prompt}</button>)}</div></div>}
            {chat.messages.map((message) => <div key={message.id} className={message.sender === "bot" ? "max-w-[94%]" : "ml-auto max-w-[88%]"}><div className={`rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed shadow-xs sm:text-xs ${message.sender === "bot" ? "rounded-tl-xs border border-slate-100 bg-white text-slate-700" : "rounded-tr-xs bg-gradient-to-r from-[#0863c5] to-[#0779da] text-white"}`}><ChatMessageContent text={message.text} />{message.sender === "bot" && message.sources?.length ? <p className="mt-1.5 border-t border-slate-100 pt-1 text-[9px] text-slate-400">Nguồn: {message.sources.map((source) => source.label).join(" · ")}</p> : null}</div>{message.sender === "bot" && latest?.id === message.id && Boolean(message.suggestions?.length) && <ChatSuggestions suggestions={message.suggestions ?? []} disabled={disabled} onSelect={(suggestion) => void chat.send(suggestion.value, suggestion.metadata)} />}</div>)}
            {(chat.loading || chat.historyBusy) && <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-blue-50 bg-white px-3.5 py-2.5 text-slate-500"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0.2s]" /><span className="ml-1 text-[10px] italic">{chat.loading ? "Trợ lý AI đang tra cứu..." : "Đang tải lịch sử..."}</span></div>}
            {chat.error && <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-[11px] text-amber-800"><p>{chat.error}</p><button type="button" onClick={() => chat.uncertainBooking ? void chat.checkAppointments() : void chat.retry()} className="mt-1.5 font-semibold underline">{chat.uncertainBooking ? "Kiểm tra lịch hẹn" : "Gửi lại"}</button></div>}
            {chat.historyError && <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-[11px] text-amber-800"><p>{chat.historyError}</p><button type="button" disabled={chat.busy} onClick={() => void chat.retryHistory()} className="mt-1.5 font-semibold underline disabled:opacity-40">Tải lại lịch sử</button></div>}
          </div>

          <form onSubmit={submit} className="flex gap-1.5 border-t border-slate-100 bg-white p-2.5"><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập câu hỏi hoặc yêu cầu đặt lịch..." aria-label="Tin nhắn" disabled={disabled} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-[11px] outline-none focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100 disabled:opacity-50 sm:text-xs" /><button type="submit" disabled={disabled || !input.trim()} aria-label="Gửi tin nhắn" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0863c5] text-white hover:bg-[#0756aa] disabled:opacity-40"><DashboardIcon name="send" className="h-3.5 w-3.5" /></button></form>
          <div className="flex justify-between px-3 pb-1.5 text-[9px] text-slate-400"><span>Không gửi mật khẩu hoặc OTP.</span><span>{input.length}/{MAX_INPUT}</span></div>
        </section>
      )}
      <button type="button" onClick={() => { setOpen((current) => !current); setTimeout(() => inputRef.current?.focus(), 0); }} aria-label={open ? "Đóng trợ lý nha khoa" : "Mở trợ lý nha khoa AI"} aria-expanded={open} className="relative ml-auto grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-tr from-[#0863c5] to-[#0782d8] text-white shadow-[0_10px_25px_rgba(8,99,197,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-blue-500/40 active:scale-95 sm:h-14 sm:w-14"><DashboardIcon name={open ? "chevron" : "chat"} className={`h-5 w-5 sm:h-6 sm:w-6 ${open ? "-rotate-90" : ""}`} />{!open && <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" /><span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" /></span>}</button>
    </div>
  );
}
