export const MAX_INPUT = 2000;
export const MAX_MESSAGES = 60;
export type ChatSource = { label: string; kind: string };
export type ChatSuggestion = {
  type: string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
};
export type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
  metadata?: Record<string, unknown>;
  suggestions?: ChatSuggestion[];
  sources?: ChatSource[];
};

export function chatIdentity(login: {
  isHydrated: boolean;
  isAuthenticated: boolean;
  accessToken: string;
  user: { id: string } | null;
}) {
  if (!login.isHydrated) return "hydrating";
  return login.isAuthenticated && login.accessToken && login.user?.id
    ? `account:${login.user.id}`
    : "guest";
}

export function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
export function isBookingConfirmation(
  text: string,
  metadata: Record<string, unknown>,
  history: ChatMessage[] = [],
) {
  if (metadata.confirmBooking || record(metadata.bookingState)?.confirmBooking)
    return true;
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
  if (/xac nhan.*dat lich/.test(normalized)) return true;
  return Boolean(
    history
      .at(-1)
      ?.suggestions?.some((item) => item.type === "confirm_booking") &&
    /\b(xac nhan|dong y|ok|oke|dat di|chot)\b/.test(normalized),
  );
}
function unwrap(value: unknown, field: string): Record<string, unknown> {
  let current = record(value);
  for (let i = 0; i < 3 && current; i++) {
    if (field in current) return current;
    current = record(current.data);
  }
  throw new Error("Invalid chat response");
}
function metadata(value: unknown): Record<string, unknown> | undefined {
  const source = record(value);
  if (!source) return undefined;
  // Bound JSON and never forward identity from model output.
  function clean(item: unknown, depth: number): unknown {
    if (depth > 6) return undefined;
    if (typeof item === "number")
      return Number.isFinite(item) ? item : undefined;
    if (item === null || typeof item === "boolean") return item;
    if (typeof item === "string") return item.slice(0, 8000);
    if (Array.isArray(item))
      return item.slice(0, 64).map((entry) => clean(entry, depth + 1));
    const object = record(item);
    if (!object) return undefined;
    return Object.fromEntries(
      Object.entries(object)
        .slice(0, 64)
        .filter(
          ([key]) =>
            key.length <= 100 &&
            ![
              "userId",
              "user_id",
              "createdByUserId",
              "created_by_user_id",
              "__proto__",
              "constructor",
              "prototype",
            ].includes(key),
        )
        .map(([key, entry]) => [key, clean(entry, depth + 1)]),
    );
  }
  const result = clean(source, 0) as Record<string, unknown>;
  return JSON.stringify(result).length <= 16000 ? result : undefined;
}
function parseSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry) => {
      const source = record(entry);
      return source &&
        typeof source.label === "string" &&
        typeof source.kind === "string"
        ? [
            {
              label: source.label.slice(0, 200),
              kind: source.kind.slice(0, 60),
            },
          ]
        : [];
    })
    .slice(0, 8);
}
function parseSuggestions(value: unknown): ChatSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry) => {
      const suggestion = record(entry);
      if (
        !suggestion ||
        typeof suggestion.label !== "string" ||
        typeof suggestion.value !== "string" ||
        !suggestion.value.trim() ||
        suggestion.value.length > MAX_INPUT
      )
        return [];
      return [
        {
          type:
            typeof suggestion.type === "string"
              ? suggestion.type.slice(0, 60)
              : "quick_reply",
          label: suggestion.label.slice(0, 200),
          value: suggestion.value,
          metadata: metadata(suggestion.metadata),
        },
      ];
    })
    .slice(0, 12);
}
export function parseReply(value: unknown): Omit<ChatMessage, "id" | "sender"> {
  const payload = unwrap(value, "reply");
  if (typeof payload.reply !== "string" || !payload.reply.trim())
    throw new Error("Empty chat reply");
  const meta = metadata(payload.metadata);
  return {
    text: payload.reply.slice(0, 8000),
    metadata: meta,
    suggestions: parseSuggestions(payload.suggestions),
    sources: parseSources(payload.sources ?? meta?.sources),
  };
}
export function parseHistory(value: unknown): ChatMessage[] {
  const payload = unwrap(value, "messages");
  if (!Array.isArray(payload.messages)) throw new Error("Invalid chat history");
  const seen = new Set<string>();
  return payload.messages
    .flatMap((entry) => {
      const message = record(entry);
      if (
        !message ||
        typeof message.id !== "string" ||
        !message.id ||
        seen.has(message.id) ||
        !["bot", "user"].includes(String(message.sender)) ||
        typeof message.text !== "string" ||
        !message.text.trim()
      )
        return [];
      seen.add(message.id);
      const meta = metadata(message.metadata);
      return [
        {
          id: message.id.slice(0, 100),
          sender: message.sender as ChatMessage["sender"],
          text: message.text.slice(0, 8000),
          metadata: meta,
          suggestions: parseSuggestions(message.suggestions),
          sources: parseSources(message.sources ?? meta?.sources),
        },
      ];
    })
    .slice(-MAX_MESSAGES);
}
export function buildRequestHistory(messages: ChatMessage[]) {
  return messages.slice(-8).map((message) => ({
    role: message.sender === "user" ? "user" : "assistant",
    content: message.text.slice(0, 4000),
    metadata: message.metadata ?? {},
  }));
}
export class RequestGate {
  private generation = 0;
  private active: number | null = null;
  start(): number | null {
    if (this.active !== null) return null;
    this.active = ++this.generation;
    return this.active;
  }
  isCurrent(id: number) {
    return this.active === id;
  }
  finish(id: number) {
    if (this.active === id) this.active = null;
  }
  reset() {
    this.generation++;
    this.active = null;
  }
}
export type MessageBlock =
  | { type: "heading" | "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };
export function parseMessageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    const list = line.match(/^\s*(?:([-*])|(\d+)\.)\s+(.+)$/);
    const previous = blocks.at(-1);
    if (!line.trim()) {
      blocks.push({ type: "paragraph", text: "" });
      continue;
    }
    if (heading) {
      blocks.push({ type: "heading", text: heading[1] });
      continue;
    }
    if (list) {
      const ordered = Boolean(list[2]);
      if (previous?.type === "list" && previous.ordered === ordered)
        previous.items.push(list[3]);
      else blocks.push({ type: "list", ordered, items: [list[3]] });
    } else if (previous?.type === "paragraph" && previous.text)
      previous.text += `\n${line}`;
    else blocks.push({ type: "paragraph", text: line });
  }
  return blocks.filter((block) => block.type !== "paragraph" || block.text);
}
