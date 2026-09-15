import type { ComponentPropsWithRef } from "react";
export function Textarea({
  className = "",
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={`min-w-0 rounded-xl border border-[var(--chat-border,#d9e4ef)] bg-white px-3 py-2.5 text-base text-[var(--chat-ink,#24374c)] outline-none focus:border-[var(--chat-brand,#0863c5)] focus:ring-2 focus:ring-[var(--chat-brand,#0863c5)]/15 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
