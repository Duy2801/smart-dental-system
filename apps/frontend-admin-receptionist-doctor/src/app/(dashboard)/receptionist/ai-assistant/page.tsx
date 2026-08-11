"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import {
  Robot,
  PaperPlaneTilt,
  CalendarBlank,
  UserPlus,
  Receipt,
  Stethoscope,
  Warning,
  ArrowClockwise,
  ChatTeardropDots,
  Sparkle,
  WifiSlash,
  ArrowRight,
  CaretDown,
  CaretUp,
  UserCircleCheck,
  Copy,
  Check,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string; // ISO string
  isError?: boolean;
}

// ---------------------------------------------------------------------------
// AI Service — fix 3: env var, fix 4: 30s timeout
// ---------------------------------------------------------------------------

const AI_BASE =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8001";
const AI_URL = `${AI_BASE}/api/v1/chatbot/receptionist-chat`;

async function callAI(message: string, history: Message[]): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000); // fix 4
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message,
        history: history.map((m) => ({ role: m.role, content: m.content })),
        locale: "vi",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { reply: string };
    return data.reply;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Action shortcuts — keyword → route
// ---------------------------------------------------------------------------

const ACTION_MAP = [
  {
    keywords: ["lịch hẹn", "lịch", "hẹn", "hàng đợi", "xác nhận", "vắng mặt", "no-show"],
    label: "Mở Lịch hẹn",
    href: "/receptionist/appointments",
    icon: <CalendarBlank size={12} weight="bold" />,
  },
  {
    keywords: ["bệnh nhân", "hồ sơ", "tìm kiếm bệnh nhân", "thêm bệnh nhân"],
    label: "Mở Bệnh nhân",
    href: "/receptionist/patients",
    icon: <UserPlus size={12} weight="bold" />,
  },
  {
    keywords: ["thanh toán", "hóa đơn", "thu tiền", "thu ngân", "in hóa đơn"],
    label: "Mở Thanh toán",
    href: "/receptionist/billing",
    icon: <Receipt size={12} weight="bold" />,
  },
  {
    keywords: ["tiếp nhận", "check-in", "check in"],
    label: "Mở Tiếp nhận",
    href: "/receptionist/check-in",
    icon: <UserCircleCheck size={12} weight="bold" />,
  },
];

function getActions(content: string) {
  const lower = content.toLowerCase();
  const seen = new Set<string>();
  return ACTION_MAP.filter((a) => {
    if (seen.has(a.href)) return false;
    if (a.keywords.some((k) => lower.includes(k))) { seen.add(a.href); return true; }
    return false;
  }).slice(0, 2);
}

// ---------------------------------------------------------------------------
// Quick prompts
// ---------------------------------------------------------------------------

const QUICK_PROMPTS = [
  { icon: <CalendarBlank size={13} weight="bold" />, label: "Xử lý lịch hẹn", prompt: "Hướng dẫn xử lý lịch hẹn hôm nay" },
  { icon: <UserPlus size={13} weight="bold" />, label: "Quy trình check-in", prompt: "Quy trình tiếp nhận check-in bệnh nhân" },
  { icon: <Receipt size={13} weight="bold" />, label: "Hướng dẫn thanh toán", prompt: "Quy trình thanh toán hóa đơn" },
  { icon: <Stethoscope size={13} weight="bold" />, label: "Thông tin dịch vụ", prompt: "Danh sách dịch vụ nha khoa và thời gian thực hiện" },
  { icon: <Warning size={13} weight="bold" />, label: "Xử lý vắng mặt", prompt: "Cách xử lý khi bệnh nhân không đến" },
  { icon: <Robot size={13} weight="bold" />, label: "Kịch bản gọi điện", prompt: "Cho tôi kịch bản gọi điện nhắc lịch cho bệnh nhân" },
  { icon: <Warning size={13} weight="bold" />, label: "Xử lý khiếu nại", prompt: "Hướng dẫn xử lý khi bệnh nhân phàn nàn khiếu nại" },
];

// ---------------------------------------------------------------------------
// localStorage — ISO timestamps, cap 60 messages
// ---------------------------------------------------------------------------

const STORAGE_KEY = "sds-receptionist-chat-v1";

// fix 5: WELCOME timestamp created dynamically, not at module load
function makeWelcome(): Message {
  return {
    id: "w",
    role: "assistant",
    content: `Xin chào. Tôi là trợ lý AI nội bộ hỗ trợ nghiệp vụ lễ tân.\n\nTôi có thể hướng dẫn về: lịch hẹn, check-in, thanh toán, quản lý bệnh nhân, xử lý vắng mặt, chính sách hủy/đổi lịch, kịch bản giao tiếp, bảo hiểm y tế và khu vực phòng khám.\n\nNhập câu hỏi hoặc chọn một gợi ý bên dưới.`,
    timestamp: new Date().toISOString(),
  };
}

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [makeWelcome()];
    const parsed = JSON.parse(raw) as Message[];
    return parsed.length ? parsed : [makeWelcome()];
  } catch {
    return [makeWelcome()];
  }
}

function saveMessages(msgs: Message[]) {
  const capped = msgs.length > 60 ? [msgs[0], ...msgs.slice(-59)] : msgs;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// fix 7: date separator between messages from different days
function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// fix 6: Copy button component
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Sao chép"
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-slate-700"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      {copied ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([makeWelcome()]);
  const [userInitials, setUserInitials] = useState("LT");

  useEffect(() => {
    try {
      // Decode JWT payload or simple JSON cookie
      const match = document.cookie.match(new RegExp("(^| )user_info=([^;]+)"));
      if (match && match[2]) {
        const user = JSON.parse(decodeURIComponent(match[2]));
        if (user?.fullName) {
          const initials = user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          setUserInitials(initials);
        }
      }
    } catch {
      // fallback to LT
    }
  }, []);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMessages(loadMessages()); }, []);
  useEffect(() => { if (messages.length > 0) saveMessages(messages); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: `u${Date.now()}`, role: "user", content: trimmed, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setAiError(null);
    setTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const history = messages.filter((m) => m.id !== "w");
    try {
      const reply = await callAI(trimmed, history);
      setMessages((p) => [...p, { id: `a${Date.now()}`, role: "assistant", content: reply, timestamp: new Date().toISOString() }]);
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setAiError(isTimeout
        ? "AI service không phản hồi sau 30 giây. Thử lại hoặc kiểm tra kết nối."
        : "Không kết nối được AI service (port 8001). Kiểm tra ai-service đang chạy.");
      setMessages((p) => [...p, {
        id: `a${Date.now()}`, role: "assistant",
        content: "Xin lỗi, tôi đang không thể kết nối. Vui lòng thử lại sau.",
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setTyping(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
  }

  function clearChat() {
    setMessages([makeWelcome()]);
    setInput("");
    setAiError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      <Header title="Trợ lý AI" description="Hỗ trợ nghiệp vụ lễ tân nha khoa">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Llama 3.3 70B
          </span>
          <button
            type="button"
            onClick={clearChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-brand-dark"
          >
            <ArrowClockwise size={13} />
            Đặt lại
          </button>
        </div>
      </Header>

      <div className="flex h-[calc(100vh-64px)] flex-col bg-muted">

        {/* Notice bar */}
        <div className="flex items-center gap-2 border-b border-border bg-brand-light px-6 py-2">
          <Sparkle size={13} weight="fill" className="shrink-0 text-brand" />
          <p className="text-xs font-medium text-brand-dark">
            <kbd className="rounded border border-brand/20 bg-white px-1 py-0.5 font-mono text-[10px]">Enter</kbd> gửi &nbsp;·&nbsp;
            <kbd className="rounded border border-brand/20 bg-white px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> xuống dòng &nbsp;·&nbsp;
            Lịch sử lưu tự động
          </p>
        </div>

        {/* Error banner */}
        {aiError && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2">
            <WifiSlash size={14} className="shrink-0 text-amber-600" weight="fill" />
            <p className="text-xs font-medium text-amber-700">{aiError}</p>
          </div>
        )}

        {/* Chat scroll area */}
        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-5 md:px-10">
          {messages.map((msg, i) => {
            // fix 7: date separator
            const showDate = i === 0 || !isSameDay(messages[i - 1].timestamp, msg.timestamp);
            // fix 2: extract actions to variable
            const actions = msg.role === "assistant" && msg.id !== "w" ? getActions(msg.content) : [];

            return (
              <div key={msg.id}>
                {/* Date separator */}
                {showDate && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                      {fmtDateLabel(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                      <Robot size={15} weight="fill" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 max-w-[80%] md:max-w-[65%]">
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-brand text-white"
                        : "rounded-tl-sm border border-border bg-white text-foreground"
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      <p className={`mt-2 text-right font-medium tabular-nums text-[10px] ${
                        msg.role === "user" ? "text-white/60" : "text-muted-foreground"
                      }`}>
                        {fmtTime(msg.timestamp)}
                      </p>
                    </div>

                    {/* fix 6: Copy button + fix 5 actions */}
                    {msg.role === "assistant" && msg.id !== "w" && (
                      <div className="flex items-center gap-2 flex-wrap pl-0.5">
                        <CopyBtn text={msg.content} />
                        {msg.isError && (
                          <button
                            type="button"
                            onClick={() => {
                              const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                              if (lastUserMsg) void send(lastUserMsg.content);
                            }}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 transition-colors hover:bg-amber-50"
                          >
                            <ArrowClockwise size={11} />
                            Thử lại
                          </button>
                        )}
                        {actions.map((a) => (
                          <Link
                            key={a.href}
                            href={a.href}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                          >
                            {a.icon}
                            {a.label}
                            <ArrowRight size={10} weight="bold" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-light text-[11px] font-bold text-brand-dark shadow-sm">
                      {userInitials}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                <Robot size={15} weight="fill" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-white px-4 py-3 shadow-sm">
                <div className="flex h-4 items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/50"
                      style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick prompts — collapsible, always accessible */}
        <div className="border-t border-border bg-white">
          <button
            type="button"
            onClick={() => setShowPrompts((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-brand-dark md:px-10"
          >
            <span className="flex items-center gap-1.5">
              <Sparkle size={12} weight="fill" className="text-brand" />
              Gợi ý nhanh
            </span>
            {/* fix 1: caret direction was reversed */}
            {showPrompts ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </button>

          {showPrompts && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 md:px-10">
              {QUICK_PROMPTS.map(({ icon, label, prompt }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-brand hover:bg-brand-light hover:text-brand-dark active:scale-[0.97]"
                >
                  <span className="text-brand">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border bg-white px-4 py-3 md:px-10">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-muted px-3 py-2 transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
            <ChatTeardropDots size={16} className="mb-2 shrink-0 text-muted-foreground" />
            <textarea
              ref={textareaRef}
              id="ai-chat-input"
              value={input}
              rows={1}
              disabled={typing}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
              placeholder="Hỏi về lịch hẹn, check-in, thanh toán, xử lý tình huống..."
              aria-label="Nhập câu hỏi"
              className="min-h-[32px] max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-sm font-medium outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={!input.trim() || typing}
              aria-label="Gửi"
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PaperPlaneTilt size={15} weight="fill" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            SmartDental AI - Groq / llama-3.3-70b - phiên bản nội bộ
          </p>
        </div>

      </div>
    </>
  );
}
