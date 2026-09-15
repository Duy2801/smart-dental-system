import { Button } from "@/components/ui/button";
import { record, type ChatSuggestion } from "./model";

function detail(suggestion: ChatSuggestion) {
  const meta = record(suggestion.metadata);
  const price = meta?.price ?? meta?.basePrice ?? meta?.fee;
  const duration = meta?.duration ?? meta?.durationMinutes;
  const parts: string[] = [];
  if (typeof price === "number" && Number.isFinite(price))
    parts.push(`${new Intl.NumberFormat("vi-VN").format(price)} đ`);
  if (typeof duration === "number") parts.push(`${duration} phút`);
  if (suggestion.type === "time_slot" && typeof meta?.doctorName === "string")
    parts.push(meta.doctorName);
  return parts.join(" · ");
}

export function ChatSuggestions({
  suggestions,
  disabled,
  onSelect,
}: {
  suggestions: ChatSuggestion[];
  disabled: boolean;
  onSelect: (suggestion: ChatSuggestion) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Gợi ý tiếp theo">
      {suggestions.map((suggestion, index) => {
        const card =
          suggestion.type === "service" || suggestion.type === "time_slot";
        const subtitle = detail(suggestion);
        return (
          <Button
            key={`${suggestion.type}-${index}`}
            variant="outline"
            disabled={disabled}
            onClick={() => onSelect(suggestion)}
            className={
              card
                ? "w-full justify-start rounded-xl px-3 py-3 text-left"
                : "rounded-full text-left text-xs"
            }
          >
            {card && (
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--chat-muted)] text-lg"
              >
                {suggestion.type === "service" ? "◇" : "◷"}
              </span>
            )}
            <span className="min-w-0 break-words">
              <span className="block">{suggestion.label}</span>
              {subtitle && (
                <span className="mt-1 block text-xs font-normal text-[var(--chat-secondary)]">
                  {subtitle}
                </span>
              )}
            </span>
            {card && (
              <span aria-hidden="true" className="ml-auto">
                ›
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
